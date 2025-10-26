/**
 * @fileoverview High Contrast Detection Service
 * @description 툴바의 고대비 모드 필요 여부를 감지하는 서비스
 *
 * Phase 3: use-toolbar-settings-controller에서 분리된 로직
 */

export interface HighContrastDetectionInput {
  readonly toolbar: HTMLElement;
  readonly documentRef: Document;
  readonly windowRef: Window;
  readonly offsets: ReadonlyArray<number>;
}

/**
 * 기본 고대비 감지 알고리즘
 *
 * @description
 * 툴바 요소 주변의 배경색을 샘플링하여 고대비 모드 필요 여부를 판단합니다.
 * offsets 배열의 위치에서 배경색을 확인하여, 밝은색 요소를 만나면
 * 고대비 모드를 활성화합니다.
 *
 * @param input - 감지 입력 데이터
 * @returns 고대비 모드 필요 여부
 */
export function evaluateHighContrast(input: HighContrastDetectionInput): boolean {
  const { toolbar, documentRef, windowRef, offsets } = input;

  if (typeof documentRef.elementsFromPoint !== 'function') {
    return false;
  }

  const rect = toolbar.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return false;
  }

  const lightHits = offsets.filter(offset => {
    const x = rect.left + rect.width * offset;
    const y = rect.top + rect.height * 0.5;
    const elements = documentRef.elementsFromPoint(x, y);
    return elements.some(element => {
      const bg = windowRef.getComputedStyle(element).backgroundColor || '';
      return /(?:white|255)/i.test(bg);
    });
  }).length;

  return lightHits >= 2;
}

/**
 * 고대비 감지기 클래스
 *
 * @description
 * 고대비 모드 감지를 관리하는 클래스입니다.
 * 스크롤 이벤트를 감시하여 배경 변화를 감지합니다.
 */
export class HighContrastDetector {
  private input: HighContrastDetectionInput | null = null;
  private onChangeCallback: ((enabled: boolean) => void) | null = null;

  /**
   * 감지기 초기화
   */
  initialize(
    input: HighContrastDetectionInput,
    onChangeCallback: (enabled: boolean) => void
  ): void {
    this.input = input;
    this.onChangeCallback = onChangeCallback;
  }

  /**
   * 고대비 여부 평가
   */
  evaluate(): boolean {
    if (!this.input) {
      return false;
    }
    return evaluateHighContrast(this.input);
  }

  /**
   * 콜백 실행
   */
  notifyChange(enabled: boolean): void {
    if (this.onChangeCallback) {
      this.onChangeCallback(enabled);
    }
  }

  /**
   * 정리
   */
  destroy(): void {
    this.input = null;
    this.onChangeCallback = null;
  }
}
