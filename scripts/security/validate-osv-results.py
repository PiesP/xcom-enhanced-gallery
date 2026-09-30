#!/usr/bin/env python3
"""Validate raw OSV JSON before passing it to osv-reporter."""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import sys
import tempfile
from typing import Any


class ValidationError(ValueError):
    """Raised when scanner output cannot be safely reported."""


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


def reject_nonfinite_constant(value: str) -> None:
    raise ValidationError(f"JSON contains non-finite value: {value}")


def parse_finite_float(value: str) -> float:
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ValidationError("JSON contains a non-finite number")
    return parsed


def load_report(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as input_file:
        document = json.load(
            input_file,
            object_pairs_hook=reject_duplicate_json_keys,
            parse_constant=reject_nonfinite_constant,
            parse_float=parse_finite_float,
        )
    return require_mapping(document, "OSV document")


def validate_osv_report(report: Any) -> dict[str, Any]:
    document = require_mapping(report, "OSV document")
    results = require_list(document.get("results"), "OSV document.results")

    for result_index, raw_result in enumerate(results):
        result_location = f"OSV document.results[{result_index}]"
        result = require_mapping(raw_result, result_location)
        source = require_mapping(result.get("source"), f"{result_location}.source")
        require_string(source.get("type"), f"{result_location}.source.type")
        require_string(source.get("path"), f"{result_location}.source.path")
        packages = require_list(result.get("packages"), f"{result_location}.packages")

        for package_index, raw_package_result in enumerate(packages):
            package_location = f"{result_location}.packages[{package_index}]"
            package_result = require_mapping(raw_package_result, package_location)
            package = require_mapping(
                package_result.get("package"), f"{package_location}.package"
            )
            optional_string(
                package.get("ecosystem"), f"{package_location}.package.ecosystem"
            )
            optional_string(package.get("name"), f"{package_location}.package.name")
            optional_string(package.get("version"), f"{package_location}.package.version")
            vulnerabilities = require_list(
                package_result.get("vulnerabilities"),
                f"{package_location}.vulnerabilities",
            )
            groups = require_list(package_result.get("groups"), f"{package_location}.groups")

            for vulnerability_index, raw_vulnerability in enumerate(vulnerabilities):
                vulnerability = require_mapping(
                    raw_vulnerability,
                    f"{package_location}.vulnerabilities[{vulnerability_index}]",
                )
                require_string(
                    vulnerability.get("id"),
                    f"{package_location}.vulnerabilities[{vulnerability_index}].id",
                )

            for group_index, raw_group in enumerate(groups):
                group_location = f"{package_location}.groups[{group_index}]"
                group = require_mapping(raw_group, group_location)
                require_string_list(group.get("ids"), f"{group_location}.ids")
                if group.get("aliases") is not None:
                    aliases = require_list(group["aliases"], f"{group_location}.aliases")
                    for alias in aliases:
                        require_string(alias, f"{group_location}.alias")

    return document


def write_report(path: Path, report: dict[str, Any]) -> None:
    temporary_path: Path | None = None
    try:
        descriptor, raw_temporary_path = tempfile.mkstemp(
            dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
        )
        temporary_path = Path(raw_temporary_path)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output_file:
            json.dump(report, output_file, ensure_ascii=False, indent=2, allow_nan=False)
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


def prepare_output(output: Path, source: Path) -> None:
    if paths_refer_to_same_file(output, source):
        raise ValidationError("output must differ from input")
    output.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        prepare_output(args.output, args.input)
        report = validate_osv_report(load_report(args.input))
        write_report(args.output, report)
    except (OSError, ValueError) as error:
        print(f"validate-osv-results: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
