#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
"""Rewrite two VUI bounds in one known Baseline MP4, retaining its sample timeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


class Bits:
    def __init__(self, value: bytes):
        self.bits = "".join(f"{byte:08b}" for byte in value)
        self.at = 0

    def read(self, width: int) -> int:
        assert 0 < width <= 32 and self.at + width <= len(self.bits)
        value = int(self.bits[self.at : self.at + width], 2)
        self.at += width
        return value

    def ue(self) -> int:
        zeros = 0
        while self.read(1) == 0:
            zeros += 1
            assert zeros < 32
        return (1 << zeros) - 1 + (self.read(zeros) if zeros else 0)


def ue_bits(value: int) -> str:
    code = f"{value + 1:b}"
    return "0" * (len(code) - 1) + code


def remove_prevention(payload: bytes) -> bytes:
    result = bytearray()
    for at, value in enumerate(payload):
        if len(result) >= 2 and result[-2:] == b"\x00\x00" and value == 3:
            assert at + 1 < len(payload) and payload[at + 1] <= 3
            continue
        result.append(value)
    return bytes(result)


def add_prevention(payload: bytes) -> bytes:
    result = bytearray()
    for value in payload:
        if len(result) >= 2 and result[-2:] == b"\x00\x00" and value <= 3:
            result.append(3)
        result.append(value)
    return bytes(result)


def rewrite_sps(nal: bytes) -> tuple[bytes, dict]:
    assert nal[0] & 0x1F == 7 and nal[0] & 0x80 == 0
    before = remove_prevention(nal[1:])
    assert add_prevention(before) == nal[1:]
    b = Bits(before)
    assert b.read(8) == 66  # Baseline, including Constrained Baseline constraint flags.
    constraints = b.read(8)
    assert constraints == 0xC0
    assert b.read(8) == 30
    assert b.ue() == 0  # seq_parameter_set_id
    assert b.ue() == 0  # log2_max_frame_num_minus4
    assert b.ue() == 2  # pic_order_cnt_type, no B pictures
    assert b.ue() == 1  # max_num_ref_frames
    assert b.read(1) == 0  # gaps_in_frame_num_allowed_flag
    assert b.ue() == 19 and b.ue() == 11  # 320 x 192, 240 macroblocks
    assert b.read(1) == 1  # frame_mbs_only_flag
    assert b.read(1) == 1  # direct_8x8_inference_flag
    assert b.read(1) == 0  # frame_cropping_flag
    assert b.read(1) == 1  # vui_parameters_present_flag
    assert b.read(1) == 1 and b.read(8) == 1  # square pixels
    assert b.read(1) == 0  # overscan_info_present_flag
    assert b.read(1) == 0  # video_signal_type_present_flag
    assert b.read(1) == 0  # chroma_loc_info_present_flag
    assert b.read(1) == 1  # timing_info_present_flag
    assert b.read(32) == 1 and b.read(32) == 48  # 24 fps
    assert b.read(1) == 1  # fixed_frame_rate_flag
    assert b.read(1) == 0 and b.read(1) == 0  # no NAL/VCL HRD parameters
    assert b.read(1) == 0  # pic_struct_present_flag
    assert b.read(1) == 1  # bitstream_restriction_flag
    assert b.read(1) == 1  # motion_vectors_over_pic_boundaries_flag
    assert b.ue() == 0 and b.ue() == 0  # two byte/bit denominator fields
    assert b.ue() == 10 and b.ue() == 10  # horizontal/vertical motion vector bounds
    reorder_at = b.at
    assert b.ue() == 0 and b.ue() == 1
    stop_at = b.at
    assert b.read(1) == 1
    assert set(b.bits[b.at:]) <= {"0"}
    assert len(b.bits) - b.at < 8
    new_bits = b.bits[:reorder_at] + ue_bits(16) + ue_bits(16) + "1"
    new_bits += "0" * ((-len(new_bits)) % 8)
    new_rbsp = bytes(int(new_bits[i : i + 8], 2) for i in range(0, len(new_bits), 8))
    return nal[:1] + add_prevention(new_rbsp), {
        "profile_idc": 66,
        "constraint_flags_byte": constraints,
        "level_idc": 30,
        "max_num_ref_frames": 1,
        "coded_width": 320,
        "coded_height": 192,
        "coded_macroblocks": 240,
        "original_reorder_bit_offset_in_rbsp": reorder_at,
        "original_trailing_bit_offset_in_rbsp": stop_at,
        "original_max_num_reorder_frames": 0,
        "original_max_dec_frame_buffering": 1,
        "candidate_max_num_reorder_frames": 16,
        "candidate_max_dec_frame_buffering": 16,
        "original_sps_nal_bytes": len(nal),
        "candidate_sps_nal_bytes": 1 + len(add_prevention(new_rbsp)),
    }


def read32(data: bytes | bytearray, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 4], "big")


def boxes(data: bytes, start: int, end: int, ancestors: tuple = ()):
    offset = start
    while offset < end:
        assert offset + 8 <= end
        size = read32(data, offset)
        kind = data[offset + 4 : offset + 8].decode("ascii")
        assert size >= 8 and offset + size <= end, (offset, kind, size, end)
        box = (offset, size, kind)
        path = ancestors + (box,)
        yield path
        if kind in {"moov", "trak", "mdia", "minf", "stbl"}:
            yield from boxes(data, offset + 8, offset + size, path)
        elif kind == "stsd":
            assert read32(data, offset + 12) == 1  # one sample description
            yield from boxes(data, offset + 16, offset + size, path)
        elif kind == "avc1":
            yield from boxes(data, offset + 86, offset + size, path)
        offset += size
    assert offset == end


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    source = args.source.read_bytes()
    paths = list(boxes(source, 0, len(source)))
    avcc_paths = [p for p in paths if p[-1][2] == "avcC"]
    stco_paths = [p for p in paths if p[-1][2] == "stco"]
    mdat_paths = [p for p in paths if p[-1][2] == "mdat"]
    assert len(avcc_paths) == len(stco_paths) == len(mdat_paths) == 1
    avcc_path = avcc_paths[0]
    assert tuple(part[2] for part in avcc_path) == (
        "moov", "trak", "mdia", "minf", "stbl", "stsd", "avc1", "avcC"
    )
    avcc_offset, avcc_size, _ = avcc_path[-1]
    avcc = source[avcc_offset + 8 : avcc_offset + avcc_size]
    assert avcc[0] == 1 and avcc[1] == 66 and avcc[3] == 30
    assert avcc[5] & 31 == 1
    sps_length = int.from_bytes(avcc[6:8], "big")
    old_sps = avcc[8 : 8 + sps_length]
    new_sps, sps_info = rewrite_sps(old_sps)
    assert avcc[8 + sps_length] == 1  # one PPS follows
    pps_length = int.from_bytes(avcc[9 + sps_length : 11 + sps_length], "big")
    assert len(avcc) == 11 + sps_length + pps_length
    patched_avcc = (
        avcc[:6]
        + len(new_sps).to_bytes(2, "big")
        + new_sps
        + avcc[8 + sps_length :]
    )
    delta = len(patched_avcc) - len(avcc)
    assert delta == 2
    candidate = bytearray(
        source[: avcc_offset + 8] + patched_avcc + source[avcc_offset + avcc_size :]
    )
    for offset, size, _ in avcc_path:
        candidate[offset : offset + 4] = (size + delta).to_bytes(4, "big")
    stco_offset, stco_size, _ = stco_paths[0][-1]
    assert stco_size == 20 and read32(source, stco_offset + 12) == 1
    original_chunk_offset = read32(source, stco_offset + 16)
    mdat_offset, mdat_size, _ = mdat_paths[0][-1]
    assert mdat_offset > avcc_offset
    assert original_chunk_offset == mdat_offset + 8
    new_stco_offset = stco_offset + delta
    candidate[new_stco_offset + 16 : new_stco_offset + 20] = (
        original_chunk_offset + delta
    ).to_bytes(4, "big")
    result = bytes(candidate)
    assert len(result) == len(source) + delta
    new_paths = list(boxes(result, 0, len(result)))
    assert len([p for p in new_paths if p[-1][2] == "avcC"]) == 1
    assert result[mdat_offset + delta :] == source[mdat_offset:]
    args.target.write_bytes(result)
    args.report.write_text(
        json.dumps(
            {
                **sps_info,
                "avcc_old_size": avcc_size,
                "avcc_new_size": avcc_size + delta,
                "mdat_original_offset": mdat_offset,
                "mdat_candidate_offset": mdat_offset + delta,
                "stco_original_offset": original_chunk_offset,
                "stco_candidate_offset": original_chunk_offset + delta,
                "sample_data_identical": True,
            },
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
