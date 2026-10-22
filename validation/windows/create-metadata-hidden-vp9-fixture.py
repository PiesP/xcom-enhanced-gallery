#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
"""Make a bounded hidden-first-keyframe VP9 MP4 from one known source."""

import argparse
import hashlib
import json
import struct
from pathlib import Path

SOURCE_SHA256 = "5c2d73ce56a49e7ce51ce9edbbc780e3fe35daa3e00bbe5d5adeac871cc4b018"
TARGET_SHA256 = "d4ac575d4f6ce11458e61f948fab6becd37ae5530afc66db7141dcdde012e8a2"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def u32(data, offset):
    return struct.unpack_from(">I", data, offset)[0]


def boxes(data, start, end):
    result = []
    while start < end:
        assert start + 8 <= end
        size = u32(data, start)
        kind = data[start + 4 : start + 8].decode("ascii")
        assert 8 <= size <= end - start and size != 1
        result.append((kind, start, size))
        start += size
    assert start == end
    return result


def child(data, parent, kind):
    found = [box for box in boxes(data, parent[1] + 8, parent[1] + parent[2]) if box[0] == kind]
    assert len(found) == 1
    return found[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("receipt", type=Path)
    args = parser.parse_args()
    assert len({args.source.resolve(), args.target.resolve(), args.receipt.resolve()}) == 3
    assert not args.target.exists() and not args.receipt.exists()
    source = args.source.read_bytes()
    assert len(source) == 92715 and sha256(source) == SOURCE_SHA256
    top = boxes(source, 0, len(source))
    assert top == [("ftyp", 0, 28), ("moov", 28, 978), ("free", 1006, 8), ("mdat", 1014, 91701)]
    stbl = child(source, child(source, child(source, child(source, top[1], "trak"), "mdia"), "minf"), "stbl")
    stsd = child(source, stbl, "stsd")
    stss = child(source, stbl, "stss")
    stsz = child(source, stbl, "stsz")
    stco = child(source, stbl, "stco")
    assert (stsd, stss, stsz, stco) == (
        ("stsd", 437, 168), ("stss", 629, 20), ("stsz", 677, 212), ("stco", 889, 20)
    )
    assert source[stsd[1] + 20 : stsd[1] + 24] == b"vp09"
    assert u32(source, stss[1] + 12) == 1 and u32(source, stss[1] + 16) == 1
    assert u32(source, stsz[1] + 12) == 0 and u32(source, stsz[1] + 16) == 48
    sizes = [u32(source, stsz[1] + 20 + 4 * i) for i in range(48)]
    assert sizes[0] == 7172 and sum(sizes) == 91693
    assert source[stco[1] + 8 : stco[1] + 16] == b"\x00\x00\x00\x00\x00\x00\x00\x01"
    assert u32(source, stco[1] + 16) == 1022
    # VP9 6.2 syntax: marker (2), profile (2), show_existing (1), frame_type (1),
    # show_frame (1), error_resilient_mode (1). Source is profile-0 shown KEY.
    assert source[1022] == 0x82
    padding = 32768 - (1022 + sizes[0])
    assert padding == 24574
    first_start = 1022 + padding
    target = bytearray(source)
    struct.pack_into(">I", target, stco[1] + 16, first_start)
    struct.pack_into(">I", target, 1006, 8 + padding)
    target[1014:1014] = b"\x00" * padding
    target[first_start] = 0x80
    target = bytes(target)
    assert len(target) == 92715 + padding
    assert boxes(target, 0, len(target)) == [
        top[0], top[1], ("free", 1006, 8 + padding), ("mdat", 1014 + padding, 91701)
    ]
    assert first_start == 25596 and first_start + sizes[0] == 32768
    assert target[first_start + 1 :] == source[1023:]
    assert target[28 : stco[1] + 16] == source[28 : stco[1] + 16]
    assert target[stco[1] + 20 : 1006] == source[stco[1] + 20 : 1006]
    assert sha256(target) == TARGET_SHA256
    args.target.write_bytes(target)
    args.receipt.write_text(json.dumps({
        "command": "python3 validation/windows/create-metadata-hidden-vp9-fixture.py <source> <target> <receipt>",
        "source_sha256": sha256(source), "source_bytes": len(source),
        "target_sha256": sha256(target), "target_bytes": len(target),
        "source_top_boxes": top,
        "target_top_boxes": boxes(target, 0, len(target)),
        "sample_count": len(sizes), "first_key_size": sizes[0],
        "first_key_start": first_start, "first_key_end_exclusive": 32768,
        "held_prefix_end_exclusive": 32768,
        "padding_added_to_free": padding,
        "only_payload_change": {"sample": 0, "byte": 0, "old": "82", "new": "80", "bit": "show_frame"},
        "other_changes": ["free.size", "stco.chunk_offset", "free zero padding"],
    }, indent=2) + "\n")


if __name__ == "__main__":
    main()
