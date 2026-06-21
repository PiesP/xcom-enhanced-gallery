#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2024-2026 PiesP
#
# Generate cropped, multi-size icons from the source logo.
# Crops to content bbox, centers in a square canvas, then generates all sizes.
#
# Usage: python3 scripts/generate-icons.py

import os
import sys
import base64
import io
import json
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install pillow")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_ICON = REPO_ROOT / ".hermes" / "icon.png"
CROPPED_ICON = REPO_ROOT / ".hermes" / "icon-cropped.png"
PUBLIC_ICONS = REPO_ROOT / "assets" / "icons"
EXT_ICONS = REPO_ROOT / "dist-extension" / "icons"
B64_OUTPUT = REPO_ROOT / ".hermes" / "icon-b64.txt"

# Standard icon sizes for Chrome extension + web
SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]

# Chrome extension icon sizes (subset)
EXT_SIZES = [16, 32, 48, 128]


def crop_to_square(img_path: Path, padding_percent: int = 4, alpha_threshold: int = 128) -> Image.Image:
    """
    Crop transparent borders, then fit into a square canvas with uniform padding.
    Uses alpha_threshold to ignore faint glow/shadow pixels that extend the bbox.
    The content is centered both horizontally and vertically within the square.
    """
    img = Image.open(img_path)
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    w, h = img.size
    alpha = img.split()[3]

    # Find content bounds using threshold (ignore near-transparent pixels)
    first_row = last_row = first_col = last_col = None

    for y in range(h):
        for x in range(w):
            if alpha.getpixel((x, y)) > alpha_threshold:
                if first_row is None:
                    first_row = y
                last_row = y
                if first_col is None or x < first_col:
                    first_col = x
                if last_col is None or x > last_col:
                    last_col = x

    if first_row is None:
        raise ValueError("Image is fully transparent")

    content_bbox = (first_col, first_row, last_col + 1, last_row + 1)
    content_w = content_bbox[2] - content_bbox[0]
    content_h = content_bbox[3] - content_bbox[1]

    print(f"  Content bbox: {content_bbox}")
    print(f"  Content size: {content_w}x{content_h}")

    # Crop to actual content
    cropped = img.crop(content_bbox)

    # Make square canvas (max of width/height + padding)
    max_dim = max(content_w, content_h)
    pad = max_dim * padding_percent // 100
    canvas_size = max_dim + pad * 2

    # Center the content in the square
    square = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset_x = (canvas_size - content_w) // 2
    offset_y = (canvas_size - content_h) // 2
    square.paste(cropped, (offset_x, offset_y), cropped)

    print(f"  Square canvas: {canvas_size}x{canvas_size} (padding={pad}px)")
    print(f"  Content offset: ({offset_x}, {offset_y})")

    return square


def generate_size_variants(img: Image.Image, output_dir: Path, sizes: list[int]) -> None:
    """Generate resized PNG icons."""
    output_dir.mkdir(parents=True, exist_ok=True)

    for size in sizes:
        resized = img.resize((size, size), Image.LANCZOS)
        out_path = output_dir / f"icon-{size}x{size}.png"
        resized.save(out_path, "PNG", optimize=True)
        file_size = out_path.stat().st_size
        print(f"  {size:>4}x{size:<4}  {file_size:>7,} bytes  {out_path.name}")


def generate_base64(img: Image.Image, size: int = 64) -> str:
    """Generate base64 data URI for inline use."""
    icon = img.resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    icon.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def generate_manifest(repo_root: Path) -> None:
    """Generate Chrome extension manifest.json with icon references."""
    pkg_path = repo_root / "package.json"
    version = "0.0.0"
    if pkg_path.exists():
        with open(pkg_path) as f:
            version = json.load(f).get("version", "0.0.0")

    manifest = {
        "manifest_version": 3,
        "name": "X.com Enhanced Gallery",
        "version": version,
        "description": "Media viewer and download functionality for X.com",
        "permissions": ["storage", "downloads", "activeTab"],
        "host_permissions": ["https://x.com/*", "https://*.x.com/*"],
        "icons": {
            "16": "icons/icon-16x16.png",
            "32": "icons/icon-32x32.png",
            "48": "icons/icon-48x48.png",
            "128": "icons/icon-128x128.png",
        },
        "background": {
            "service_worker": "background.js",
        },
        "content_scripts": [
            {
                "matches": ["https://x.com/*", "https://*.x.com/*"],
                "js": ["content-script.js"],
                "run_at": "document-idle",
            },
        ],
        "action": {
            "default_icon": {
                "16": "icons/icon-16x16.png",
                "32": "icons/icon-32x32.png",
            },
            "default_title": "X.com Enhanced Gallery",
        },
    }

    manifest_path = repo_root / "extension" / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print(f"  Written: {manifest_path.relative_to(repo_root)}")


def main():
    if not SOURCE_ICON.exists():
        print(f"ERROR: Source icon not found: {SOURCE_ICON}")
        sys.exit(1)

    print(f"Source: {SOURCE_ICON}")
    print(f"  Size: {Image.open(SOURCE_ICON).size}")
    print("")

    # Step 1: Crop to square
    print("Step 1: Cropping to square...")
    cropped = crop_to_square(SOURCE_ICON)
    cropped.save(CROPPED_ICON, "PNG", optimize=True)
    print(f"  Saved: {CROPPED_ICON.relative_to(REPO_ROOT)} ({cropped.width}x{cropped.height})")
    print("")

    # Step 2: Generate size variants for assets/
    print("Step 2: Generating assets/icons/...")
    generate_size_variants(cropped, PUBLIC_ICONS, SIZES)
    print("")

    # Step 3: Generate size variants for extension
    print("Step 3: Generating dist-extension/icons/...")
    generate_size_variants(cropped, EXT_ICONS, EXT_SIZES)
    print("")

    # Step 3b: Also save full-res icon.png in both dirs
    cropped.save(PUBLIC_ICONS / "icon.png", "PNG", optimize=True)
    cropped.save(EXT_ICONS / "icon.png", "PNG", optimize=True)
    print(f"  Saved icon.png (full resolution: {cropped.width}x{cropped.height})")
    print("")

    # Step 4: Generate base64 for userscript
    print("Step 4: Generating base64 data URI (64x64)...")
    b64_uri = generate_base64(cropped, 64)
    B64_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(B64_OUTPUT, "w") as f:
        f.write(b64_uri)
    print(f"  Length: {len(b64_uri)} chars")
    print(f"  Saved: {B64_OUTPUT.relative_to(REPO_ROOT)}")
    print("")

    # Step 5: Generate manifest.json
    print("Step 5: Generating extension/manifest.json...")
    generate_manifest(REPO_ROOT)
    print("")

    print("✓ All icons generated successfully.")
    print("")
    print("Summary:")
    print(f"  Cropped source:    {CROPPED_ICON.relative_to(REPO_ROOT)} ({cropped.width}x{cropped.height})")
    print(f"  Asset icons:       {PUBLIC_ICONS.relative_to(REPO_ROOT)}/ ({len(SIZES)} sizes + icon.png)")
    print(f"  Extension icons:   {EXT_ICONS.relative_to(REPO_ROOT)}/ ({len(EXT_SIZES)} sizes + icon.png)")
    print(f"  Base64 data URI:   {B64_OUTPUT.relative_to(REPO_ROOT)}")
    print(f"  Extension manifest: extension/manifest.json")


if __name__ == "__main__":
    main()
