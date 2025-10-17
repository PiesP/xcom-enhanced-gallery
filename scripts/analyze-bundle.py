#!/usr/bin/env python3
"""
번들 분석 리포트에서 큰 모듈 식별
Usage: python scripts/analyze-bundle.py
"""

import json
import sys

try:
    with open('docs/bundle-data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    print("Error: docs/bundle-data.json not found")
    sys.exit(1)

modules = []

def traverse(node):
    if 'uid' in node:
        uid = node['uid']
        if uid in data['nodeParts']:
            part = data['nodeParts'][uid]
            meta_uid = part.get('metaUid')
            if meta_uid and meta_uid in data['nodeMetas']:
                meta = data['nodeMetas'][meta_uid]
                if 'id' in meta:
                    modules.append({
                        'name': meta['id'],
                        'rendered': part['renderedLength'],
                        'gzip': part['gzipLength'],
                        'brotli': part['brotliLength'],
                    })
    if 'children' in node:
        for child in node['children']:
            traverse(child)

traverse(data['tree'])

# Sort by rendered size
modules.sort(key=lambda m: m['rendered'], reverse=True)

print("=" * 80)
print("Top 10 Largest Modules (by rendered size)")
print("=" * 80)
print()

for i, m in enumerate(modules[:10], 1):
    name = m['name'].replace('C:/git/xcom-enhanced-gallery/', '')
    print(f"{i}. {name}")
    print(f"   Rendered: {m['rendered']:,} bytes ({m['rendered']/1024:.2f} KB)")
    print(f"   Gzip: {m['gzip']:,} bytes ({m['gzip']/1024:.2f} KB)")
    print(f"   Brotli: {m['brotli']:,} bytes ({m['brotli']/1024:.2f} KB)")
    print()

total_rendered = sum(m['rendered'] for m in modules)
total_gzip = sum(m['gzip'] for m in modules)
total_brotli = sum(m['brotli'] for m in modules)

top10_rendered = sum(m['rendered'] for m in modules[:10])
top10_gzip = sum(m['gzip'] for m in modules[:10])

print("=" * 80)
print("Summary")
print("=" * 80)
print()
print(f"Total modules: {len(modules)}")
print(f"Total rendered: {total_rendered:,} bytes ({total_rendered/1024:.2f} KB)")
print(f"Total gzip: {total_gzip:,} bytes ({total_gzip/1024:.2f} KB)")
print(f"Total brotli: {total_brotli:,} bytes ({total_brotli/1024:.2f} KB)")
print()
print(f"Top 10 rendered: {top10_rendered:,} bytes ({top10_rendered/1024:.2f} KB)")
print(f"Top 10 represent: {(top10_rendered/total_rendered)*100:.2f}% of total")
print()
print(f"Top 10 gzip: {top10_gzip:,} bytes ({top10_gzip/1024:.2f} KB)")
print(f"Top 10 represent: {(top10_gzip/total_gzip)*100:.2f}% of total")

# 큰 모듈 카테고리 분석 (>10 KB rendered)
print()
print("=" * 80)
print("Large Modules (>10 KB rendered)")
print("=" * 80)
print()

large_modules = [m for m in modules if m['rendered'] > 10 * 1024]
categories = {}

for m in large_modules:
    name = m['name'].replace('C:/git/xcom-enhanced-gallery/', '')
    if 'node_modules/solid-js' in name:
        category = 'Solid.js'
    elif 'src/shared/services' in name:
        category = 'Services'
    elif 'src/shared/utils' in name:
        category = 'Utils'
    elif 'src/shared/components' in name:
        category = 'Components'
    elif 'src/features' in name:
        category = 'Features'
    else:
        category = 'Other'

    if category not in categories:
        categories[category] = {'count': 0, 'rendered': 0, 'gzip': 0, 'brotli': 0}

    categories[category]['count'] += 1
    categories[category]['rendered'] += m['rendered']
    categories[category]['gzip'] += m['gzip']
    categories[category]['brotli'] += m['brotli']

for category, stats in sorted(categories.items(), key=lambda x: x[1]['rendered'], reverse=True):
    print(f"{category}:")
    print(f"  Modules: {stats['count']}")
    print(f"  Rendered: {stats['rendered']/1024:.2f} KB")
    print(f"  Gzip: {stats['gzip']/1024:.2f} KB")
    print(f"  % of total: {(stats['rendered']/total_rendered)*100:.2f}%")
    print()

# JSON 출력
output = {
    'top10': [
        {
            'name': m['name'].replace('C:/git/xcom-enhanced-gallery/', ''),
            'rendered': m['rendered'],
            'gzip': m['gzip'],
            'brotli': m['brotli']
        }
        for m in modules[:10]
    ],
    'summary': {
        'totalModules': len(modules),
        'totalRendered': total_rendered,
        'totalGzip': total_gzip,
        'totalBrotli': total_brotli,
        'top10Percent': f"{(top10_rendered/total_rendered)*100:.2f}"
    },
    'largeModules': len(large_modules),
    'categories': categories
}

with open('docs/bundle-analysis-summary.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2)

print("Summary saved to: docs/bundle-analysis-summary.json")
