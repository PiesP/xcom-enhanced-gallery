#!/usr/bin/env python3
"""Apply narrowly scoped, time-limited exceptions to raw OSV JSON output."""

from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
import json
import os
from pathlib import Path
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
ALLOWED_IDS = frozenset(
    {
        "GHSA-jmr9-qjv8-65gv",
        "GHSA-7pqw-9j4j-h8q3",
    }
)
POLICY_ENTRY_KEYS = frozenset({"id", "ignoreUntil", "reason"})


class ValidationError(ValueError):
    """Raised when input cannot be handled without broadening the exception."""


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


def load_policy(path: Path, today: date) -> frozenset[str]:
    with path.open("rb") as policy_file:
        policy = require_mapping(tomllib.load(policy_file), "policy")

    if set(policy) != {"IgnoredVulns"}:
        raise ValidationError("policy must contain only IgnoredVulns")

    entries = require_list(policy["IgnoredVulns"], "policy.IgnoredVulns")
    if len(entries) != len(ALLOWED_IDS):
        raise ValidationError("policy must define exactly the two supported exceptions")

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

    if set(expiries) != ALLOWED_IDS:
        raise ValidationError("policy must define each supported exception exactly once")

    return frozenset(
        vulnerability_id
        for vulnerability_id, ignore_until in expiries.items()
        if ignore_until > today
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
    with path.open("r", encoding="utf-8") as input_file:
        report = json.load(input_file, object_pairs_hook=reject_duplicate_json_keys)
    return require_mapping(report, "OSV document")


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
        raise ValidationError("output must differ from policy and input")
    output.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--policy", required=True, type=Path)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        prepare_output(args.output, (args.policy, args.input))
        active_ids = load_policy(args.policy, datetime.now(timezone.utc).date())
        report = validate_and_filter_report(load_report(args.input), active_ids)
        write_report(args.output, report)
    except (OSError, ValueError) as error:
        print(f"scope-osv-exceptions: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
