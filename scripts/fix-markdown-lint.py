#!/usr/bin/env python3
"""
Markdown 린트 오류 자동 수정 스크립트

수정 대상 오류:
- MD028: Blockquote 내부 빈 줄
- MD029: Ordered list 번호 형식
- MD003: Heading 스타일 (setext → atx)
- MD022: Heading 주변 빈 줄
- MD001: Heading 레벨 증가
- MD046: Code block 스타일 (fenced → indented)
"""

import re
from pathlib import Path

def fix_blockquote_blank_lines(content: str) -> str:
    """MD028: Blockquote 내부 빈 줄 제거"""
    lines = content.split('\n')
    result = []
    in_blockquote = False
    
    for i, line in enumerate(lines):
        if line.startswith('>'):
            in_blockquote = True
            result.append(line)
        elif in_blockquote and line.strip() == '':
            # Blockquote 다음 빈 줄
            if i + 1 < len(lines) and lines[i + 1].startswith('>'):
                # 다음 줄도 blockquote면 빈 줄 건너뛰기
                continue
            else:
                in_blockquote = False
                result.append(line)
        else:
            in_blockquote = False
            result.append(line)
    
    return '\n'.join(result)

def fix_ordered_list_prefix(content: str) -> str:
    """MD029: Ordered list 번호를 1로 시작하도록 수정"""
    lines = content.split('\n')
    result = []
    
    for line in lines:
        # 1-9 숫자로 시작하는 리스트 항목을 1로 변경
        if re.match(r'^[2-9]\.\s', line):
            result.append(re.sub(r'^[2-9]\.', '1.', line))
        else:
            result.append(line)
    
    return '\n'.join(result)

def fix_heading_style(content: str) -> str:
    """MD003: Setext 스타일 heading을 ATX 스타일로 변경"""
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 다음 줄이 존재하고 '====' 또는 '----'로 시작하는 경우
        if i + 1 < len(lines):
            next_line = lines[i + 1]
            if re.match(r'^=+\s*$', next_line):
                # H1 heading
                result.append(f'# {line}')
                i += 2  # 현재 줄과 다음 줄 건너뛰기
                continue
            elif re.match(r'^-+\s*$', next_line):
                # H2 heading
                result.append(f'## {line}')
                i += 2
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_blanks_around_headings(content: str) -> str:
    """MD022: Heading 주변에 빈 줄 추가"""
    lines = content.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        # Heading 감지 (ATX 스타일)
        if re.match(r'^#{1,6}\s', line):
            # 이전 줄이 비어있지 않으면 빈 줄 추가
            if i > 0 and result and result[-1].strip() != '':
                result.append('')
            
            result.append(line)
            
            # 다음 줄이 비어있지 않으면 빈 줄 추가 (테이블이 아닌 경우)
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                if next_line.strip() != '' and not next_line.startswith('|'):
                    result.append('')
        else:
            result.append(line)
    
    return '\n'.join(result)

def fix_heading_increment(content: str) -> str:
    """MD001: Heading 레벨을 점진적으로 증가하도록 수정"""
    lines = content.split('\n')
    result = []
    last_level = 0
    
    for line in lines:
        match = re.match(r'^(#{1,6})\s', line)
        if match:
            current_level = len(match.group(1))
            
            # 레벨이 1보다 크게 증가하면 조정
            if last_level > 0 and current_level > last_level + 1:
                # 적절한 레벨로 조정
                adjusted_level = last_level + 1
                line = '#' * adjusted_level + line[current_level:]
                current_level = adjusted_level
            
            last_level = current_level
        
        result.append(line)
    
    return '\n'.join(result)

def fix_trailing_spaces(content: str) -> str:
    """MD009: Trailing spaces 제거 (줄 끝 공백)"""
    lines = content.split('\n')
    result = []
    
    for line in lines:
        # 줄 끝 공백 제거 (단, 2 spaces는 허용 - hard break)
        stripped = line.rstrip()
        # 2 spaces로 끝나는 경우는 유지
        if line.endswith('  ') and not line.endswith('   '):
            result.append(stripped + '  ')
        else:
            result.append(stripped)
    
    return '\n'.join(result)

def fix_code_block_style(content: str) -> str:
    """MD046: Fenced code block을 indented로 변경 (리스트 내부에서만)"""
    lines = content.split('\n')
    result = []
    i = 0
    in_list = False
    list_indent = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 리스트 항목 감지
        list_match = re.match(r'^(\s*)[*\-+]\s', line) or re.match(r'^(\s*)\d+\.\s', line)
        if list_match:
            in_list = True
            list_indent = len(list_match.group(1))
            result.append(line)
            i += 1
            continue
        
        # Fenced code block 감지 (리스트 내부)
        if in_list and re.match(r'^\s*```', line):
            # Fenced code block 시작
            fence_indent = len(line) - len(line.lstrip())
            code_lines = []
            i += 1
            
            # Code block 내용 수집
            while i < len(lines) and not re.match(r'^\s*```', lines[i]):
                code_line = lines[i]
                # Indented로 변환 (4 spaces)
                if code_line.strip():
                    code_lines.append(' ' * (list_indent + 4) + code_line.lstrip())
                else:
                    code_lines.append('')
                i += 1
            
            # Code block 종료 (```) 건너뛰기
            if i < len(lines):
                i += 1
            
            # Indented code lines 추가
            result.extend(code_lines)
            continue
        
        # 빈 줄이거나 리스트 연속이 아니면 리스트 종료
        if line.strip() == '' or not line.startswith(' ' * list_indent):
            in_list = False
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_markdown_file(file_path: Path):
    """Markdown 파일의 모든 린트 오류 수정"""
    print(f"🔧 수정 중: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 순서대로 수정 적용
    content = fix_trailing_spaces(content)
    content = fix_blockquote_blank_lines(content)
    content = fix_ordered_list_prefix(content)
    content = fix_heading_style(content)
    content = fix_blanks_around_headings(content)
    content = fix_heading_increment(content)
    content = fix_code_block_style(content)
    
    # 변경사항이 있으면 파일 저장
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 수정 완료: {file_path}")
    else:
        print(f"ℹ️  변경사항 없음: {file_path}")

def main():
    """메인 실행 함수"""
    docs_dir = Path(__file__).parent.parent / 'docs'
    
    # 수정 대상 파일
    target_files = [
        docs_dir / 'TDD_REFACTORING_PLAN_COMPLETED.md',
        docs_dir / 'TDD_REFACTORING_PLAN.md',
    ]
    
    for file_path in target_files:
        if file_path.exists():
            fix_markdown_file(file_path)
        else:
            print(f"⚠️  파일 없음: {file_path}")
    
    print("\n✨ 모든 Markdown 파일 수정 완료!")
    print("💡 실행: npm run lint:md")

if __name__ == '__main__':
    main()
