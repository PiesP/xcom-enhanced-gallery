#!/usr/bin/env python3
"""Apply narrowly scoped, time-limited exceptions to raw OSV JSON output."""

from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import tomllib
from typing import Any


TARGET_SOURCE_TYPE = "lockfile"
TARGET_SOURCE_PATH = "/src/scripts/security/codex-security/package-lock.json"
TARGET_PACKAGE = {
    "ecosystem": "npm",
    "name": "extract-zip",
    "version": "2.0.1",
}
CLI_PACKAGE_NAME = "@openai/codex-security"
ALLOWED_IDS = frozenset(
    {
        "GHSA-jmr9-qjv8-65gv",
        "GHSA-7pqw-9j4j-h8q3",
    }
)
REVIEW_POLICY_KEYS = frozenset(
    {"package", "version", "integrity", "lockfileSha256", "reviewedOn"}
)
POLICY_ENTRY_KEYS = frozenset({"id", "ignoreUntil", "reason"})


class ValidationError(ValueError):
    """Raised when input cannot be handled without broadening the exception."""


class SecurityReviewRequired(ValidationError):
    """Raised when a reviewed security-tool artifact no longer matches."""


def require_mapping(value: Any, location: str) -> dict[str, Any]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise ValidationError(f"{location} must be an object")
    return value


def require_list(value: Any, location: str) -> list[Any]:
    if not isinstance(value, list):
        raise ValidationError(f"{location} must be an array")
    return value


def require_string(value: Any, location: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValidationError(f"{location} must be a non-empty string")
    return value


def optional_string(value: Any, location: str) -> str | None:
    if value is None:
        return None
    return require_string(value, location)


def require_string_list(value: Any, location: str) -> list[str]:
    values = require_list(value, location)
    if not values or not all(isinstance(item, str) and item for item in values):
        raise ValidationError(f"{location} must contain non-empty strings")
    return values


def reject_duplicate_json_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValidationError(f"JSON contains duplicate key: {key}")
        result[key] = value
    return result


def load_policy_document(path: Path) -> dict[str, Any]:
    with path.open("rb") as policy_file:
        policy = require_mapping(tomllib.load(policy_file), "policy")
    return policy


def validate_review_metadata(policy: dict[str, Any], today: date) -> dict[str, Any]:
    if set(policy) != {"IgnoredVulns", "CodexSecurityReview"}:
        raise ValidationError(
            "policy must contain only IgnoredVulns and CodexSecurityReview"
        )

    review = require_mapping(
        policy.get("CodexSecurityReview"), "policy.CodexSecurityReview"
    )
    if set(review) != REVIEW_POLICY_KEYS:
        raise ValidationError(
            "policy.CodexSecurityReview must contain exactly package, version, "
            "integrity, lockfileSha256, and reviewedOn"
        )
    require_string(review.get("package"), "policy.CodexSecurityReview.package")
    require_string(review.get("version"), "policy.CodexSecurityReview.version")
    integrity = require_string(
        review.get("integrity"), "policy.CodexSecurityReview.integrity"
    )
    if not integrity.startswith("sha512-"):
        raise ValidationError(
            "policy.CodexSecurityReview.integrity must be a sha512 integrity value"
        )
    lockfile_sha256 = require_string(
        review.get("lockfileSha256"), "policy.CodexSecurityReview.lockfileSha256"
    )
    if re.fullmatch(r"[0-9a-f]{64}", lockfile_sha256) is None:
        raise ValidationError(
            "policy.CodexSecurityReview.lockfileSha256 must be 64 lowercase hex characters"
        )
    reviewed_on = review.get("reviewedOn")
    if type(reviewed_on) is not date:
        raise ValidationError(
            "policy.CodexSecurityReview.reviewedOn must be a TOML local date"
        )
    if reviewed_on > today:
        raise ValidationError(
            "policy.CodexSecurityReview.reviewedOn cannot be in the future"
        )
    return review


def load_policy(path: Path, today: date) -> frozenset[str]:
    policy = load_policy_document(path)
    validate_review_metadata(policy, today)

    entries = require_list(policy["IgnoredVulns"], "policy.IgnoredVulns")
    if len(entries) > len(ALLOWED_IDS):
        raise ValidationError(
            f"policy must define at most {len(ALLOWED_IDS)} supported exceptions"
        )

    expiries: dict[str, date] = {}
    for index, raw_entry in enumerate(entries):
        location = f"policy.IgnoredVulns[{index}]"
        entry = require_mapping(raw_entry, location)
        if not set(entry).issubset(POLICY_ENTRY_KEYS):
            raise ValidationError(f"{location} contains unsupported settings")

        vulnerability_id = require_string(entry.get("id"), f"{location}.id")
        if vulnerability_id not in ALLOWED_IDS:
            raise ValidationError(f"{location}.id is not a supported exception")
        if vulnerability_id in expiries:
            raise ValidationError(f"{location}.id is duplicated")

        ignore_until = entry.get("ignoreUntil")
        if type(ignore_until) is not date:
            raise ValidationError(f"{location}.ignoreUntil must be a TOML local date")
        reason = entry.get("reason")
        if reason is not None:
            require_string(reason, f"{location}.reason")
        expiries[vulnerability_id] = ignore_until

    return frozenset(
        vulnerability_id
        for vulnerability_id, ignore_until in expiries.items()
        if ignore_until > today
    )


def load_json_document(path: Path, location: str) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as input_file:
        document = json.load(input_file, object_pairs_hook=reject_duplicate_json_keys)
    return require_mapping(document, location)


def validate_cli_review(
    policy_path: Path, cli_package_path: Path, cli_lock_path: Path
) -> None:
    policy = load_policy_document(policy_path)
    review = validate_review_metadata(policy, datetime.now(timezone.utc).date())
    reviewed_package = require_string(
        review.get("package"), "policy.CodexSecurityReview.package"
    )
    reviewed_version = require_string(
        review.get("version"), "policy.CodexSecurityReview.version"
    )
    reviewed_integrity = require_string(
        review.get("integrity"), "policy.CodexSecurityReview.integrity"
    )
    reviewed_lockfile_sha256 = require_string(
        review.get("lockfileSha256"), "policy.CodexSecurityReview.lockfileSha256"
    )
    if reviewed_package != CLI_PACKAGE_NAME:
        raise ValidationError(
            f"policy.CodexSecurityReview.package must be {CLI_PACKAGE_NAME}"
        )

    manifest = load_json_document(cli_package_path, "CLI package manifest")
    dependencies = require_mapping(manifest.get("dependencies"), "CLI package dependencies")
    declared_version = require_string(
        dependencies.get(CLI_PACKAGE_NAME), f"CLI package dependencies.{CLI_PACKAGE_NAME}"
    )

    lock = load_json_document(cli_lock_path, "CLI package lockfile")
    packages = require_mapping(lock.get("packages"), "CLI package lockfile.packages")
    root_package = require_mapping(packages.get(""), "CLI package lockfile.packages['']")
    root_dependencies = require_mapping(
        root_package.get("dependencies"), "CLI package lockfile root dependencies"
    )
    locked_package = require_mapping(
        packages.get(f"node_modules/{CLI_PACKAGE_NAME}"),
        f"CLI package lockfile.packages.node_modules/{CLI_PACKAGE_NAME}",
    )
    root_version = require_string(
        root_dependencies.get(CLI_PACKAGE_NAME),
        f"CLI package lockfile root dependencies.{CLI_PACKAGE_NAME}",
    )
    locked_version = require_string(
        locked_package.get("version"),
        f"CLI package lockfile node_modules/{CLI_PACKAGE_NAME}.version",
    )
    locked_integrity = require_string(
        locked_package.get("integrity"),
        f"CLI package lockfile node_modules/{CLI_PACKAGE_NAME}.integrity",
    )

    if not (declared_version == root_version == locked_version):
        raise ValidationError(
            "CLI package and lock versions must be one matching exact version"
        )
    if declared_version != reviewed_version:
        raise SecurityReviewRequired(
            "SECURITY_REVIEW_REQUIRED: candidate CLI "
            f"{declared_version} differs from reviewed CLI {reviewed_version}"
        )
    if locked_integrity != reviewed_integrity:
        raise SecurityReviewRequired(
            "SECURITY_REVIEW_REQUIRED: candidate CLI integrity differs from the "
            "reviewed npm artifact"
        )
    actual_lockfile_sha256 = sha256(cli_lock_path.read_bytes()).hexdigest()
    if actual_lockfile_sha256 != reviewed_lockfile_sha256:
        raise SecurityReviewRequired(
            "SECURITY_REVIEW_REQUIRED: candidate CLI lockfile differs from the "
            "reviewed dependency configuration"
        )


def validate_and_filter_report(report: Any, active_ids: frozenset[str]) -> dict[str, Any]:
    document = require_mapping(report, "OSV document")
    results = require_list(document.get("results"), "OSV document.results")

    for result_index, raw_result in enumerate(results):
        result_location = f"OSV document.results[{result_index}]"
        result = require_mapping(raw_result, result_location)
        source = require_mapping(result.get("source"), f"{result_location}.source")
        source_type = require_string(source.get("type"), f"{result_location}.source.type")
        source_path = require_string(source.get("path"), f"{result_location}.source.path")
        packages = require_list(result.get("packages"), f"{result_location}.packages")
        is_target_source = (
            source_type == TARGET_SOURCE_TYPE and source_path == TARGET_SOURCE_PATH
        )

        for package_index, raw_package_result in enumerate(packages):
            package_location = f"{result_location}.packages[{package_index}]"
            package_result = require_mapping(raw_package_result, package_location)
            package = require_mapping(
                package_result.get("package"), f"{package_location}.package"
            )
            ecosystem = optional_string(
                package.get("ecosystem"), f"{package_location}.package.ecosystem"
            )
            name = optional_string(package.get("name"), f"{package_location}.package.name")
            version = optional_string(
                package.get("version"), f"{package_location}.package.version"
            )
            if is_target_source and None in (ecosystem, name, version):
                raise ValidationError(
                    f"{package_location}.package must identify every target-lock package"
                )
            vulnerabilities = require_list(
                package_result.get("vulnerabilities"),
                f"{package_location}.vulnerabilities",
            )
            groups = require_list(package_result.get("groups"), f"{package_location}.groups")

            vulnerability_ids: list[str] = []
            for vulnerability_index, raw_vulnerability in enumerate(vulnerabilities):
                vulnerability = require_mapping(
                    raw_vulnerability,
                    f"{package_location}.vulnerabilities[{vulnerability_index}]",
                )
                vulnerability_ids.append(
                    require_string(
                        vulnerability.get("id"),
                        f"{package_location}.vulnerabilities[{vulnerability_index}].id",
                    )
                )

            for group_index, raw_group in enumerate(groups):
                group = require_mapping(raw_group, f"{package_location}.groups[{group_index}]")
                require_string_list(
                    group.get("ids"), f"{package_location}.groups[{group_index}].ids"
                )
                if group.get("aliases") is not None:
                    aliases = require_list(
                        group["aliases"], f"{package_location}.groups[{group_index}].aliases"
                    )
                    for alias in aliases:
                        require_string(alias, f"{package_location}.groups[{group_index}].alias")

            is_target = (
                is_target_source
                and ecosystem == TARGET_PACKAGE["ecosystem"]
                and name == TARGET_PACKAGE["name"]
                and version == TARGET_PACKAGE["version"]
            )
            if not is_target:
                continue

            removed_ids = active_ids.intersection(vulnerability_ids)
            if not removed_ids:
                continue

            package_result["vulnerabilities"] = [
                vulnerability
                for vulnerability, vulnerability_id in zip(
                    vulnerabilities, vulnerability_ids, strict=True
                )
                if vulnerability_id not in removed_ids
            ]

            reconciled_groups: list[dict[str, Any]] = []
            for raw_group in groups:
                group = require_mapping(raw_group, "validated group")
                if any(item not in removed_ids for item in group["ids"]):
                    reconciled_groups.append(group)
            package_result["groups"] = reconciled_groups

    return document


def load_report(path: Path) -> dict[str, Any]:
    return load_json_document(path, "OSV document")


def write_report(path: Path, report: dict[str, Any]) -> None:
    temporary_path: Path | None = None
    try:
        descriptor, raw_temporary_path = tempfile.mkstemp(
            dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
        )
        temporary_path = Path(raw_temporary_path)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output_file:
            json.dump(report, output_file, ensure_ascii=False, indent=2)
            output_file.write("\n")
        os.replace(temporary_path, path)
        temporary_path = None
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def paths_refer_to_same_file(first: Path, second: Path) -> bool:
    if first.resolve() == second.resolve():
        return True
    try:
        return first.samefile(second)
    except FileNotFoundError:
        return False


def prepare_output(output: Path, protected_paths: tuple[Path, ...]) -> None:
    if any(paths_refer_to_same_file(output, protected) for protected in protected_paths):
        raise ValidationError("output must differ from policy, CLI review inputs, and input")
    output.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--policy", required=True, type=Path)
    parser.add_argument("--cli-package", required=True, type=Path)
    parser.add_argument("--cli-lock", required=True, type=Path)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        prepare_output(
            args.output,
            (args.policy, args.cli_package, args.cli_lock, args.input),
        )
        active_ids = load_policy(args.policy, datetime.now(timezone.utc).date())
        validate_cli_review(args.policy, args.cli_package, args.cli_lock)
        report = validate_and_filter_report(load_report(args.input), active_ids)
        write_report(args.output, report)
    except (OSError, ValueError) as error:
        print(f"scope-osv-exceptions: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
