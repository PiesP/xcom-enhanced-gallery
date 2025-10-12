#!/usr/bin/env python3
"""
Bundle 분석 도구
docs/bundle-analysis.html에서 JSON 데이터를 추출하여 크기 분포 분석
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

def extract_json_from_html(html_path: Path) -> dict:
    """HTML 파일에서 JSON 데이터 추출"""
    content = html_path.read_text(encoding='utf-8')
    # 'const data = {...}' 패턴 찾기
    match = re.search(r'const\s+data\s*=\s*({.*?});?\s*$', content, re.MULTILINE | re.DOTALL)
    if not match:
        raise ValueError("JSON 데이터를 찾을 수 없습니다")
    return json.loads(match.group(1))

def analyze_node(node: dict, parts: dict, path: str = "") -> List[Tuple[str, int, int, int]]:
    """재귀적으로 노드 분석"""
    results = []
    
    uid = node.get('uid')
    if uid and uid in parts:
        part = parts[uid]
        rendered = part.get('renderedLength', 0)
        gzip = part.get('gzipLength', 0)
        brotli = part.get('brotliLength', 0)
        name = node.get('name', 'unknown')
        full_path = f"{path}/{name}" if path else name
        
        # Solid.js 모듈이나 큰 파일만 수집
        if rendered > 1000 or 'solid' in full_path.lower():
            results.append((full_path, rendered, gzip, brotli))
    
    # 자식 노드 처리
    children = node.get('children', [])
    for child in children:
        child_path = f"{path}/{node.get('name', '')}" if path or node.get('name') else path
        results.extend(analyze_node(child, parts, child_path))
    
    return results

def format_size(bytes: int) -> str:
    """바이트를 KB로 포맷"""
    return f"{bytes / 1024:.2f} KB"

def main():
    html_path = Path('docs/bundle-analysis.html')
    if not html_path.exists():
        print("❌ docs/bundle-analysis.html을 찾을 수 없습니다")
        return
    
    print("📊 Bundle 분석 중...")
    data = extract_json_from_html(html_path)
    
    node_parts = data.get('nodeParts', {})
    root = data.get('tree', {})
    
    # 모든 모듈 분석
    results = analyze_node(root, node_parts)
    
    # 크기 순 정렬
    results.sort(key=lambda x: x[1], reverse=True)
    
    print("\n" + "=" * 100)
    print("🎯 주요 모듈 크기 분석 (Top 20)")
    print("=" * 100)
    print(f"{'경로':<60} {'원본':<12} {'gzip':<12} {'brotli':<12}")
    print("-" * 100)
    
    total_rendered = 0
    total_gzip = 0
    total_brotli = 0
    solid_total = 0
    app_total = 0
    
    for i, (path, rendered, gzip, brotli) in enumerate(results[:20], 1):
        print(f"{i:2}. {path:<57} {format_size(rendered):<12} {format_size(gzip):<12} {format_size(brotli):<12}")
        total_rendered += rendered
        total_gzip += gzip
        total_brotli += brotli
        
        if 'solid-js' in path:
            solid_total += rendered
        else:
            app_total += rendered
    
    print("-" * 100)
    print(f"{'Top 20 합계':<60} {format_size(total_rendered):<12} {format_size(total_gzip):<12} {format_size(total_brotli):<12}")
    
    # Solid.js vs 애플리케이션 코드
    print("\n" + "=" * 100)
    print("📦 Solid.js vs 애플리케이션 코드 (Top 20 기준)")
    print("=" * 100)
    print(f"Solid.js 런타임:     {format_size(solid_total):>12} ({solid_total / total_rendered * 100:.1f}%)")
    print(f"애플리케이션 코드:    {format_size(app_total):>12} ({app_total / total_rendered * 100:.1f}%)")
    
    print("\n✅ 분석 완료! 전체 시각화는 docs/bundle-analysis.html을 브라우저에서 확인하세요.")

if __name__ == '__main__':
    main()
