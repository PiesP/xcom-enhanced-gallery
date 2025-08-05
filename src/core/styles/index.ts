/**
 * @fileoverview 코어 스타일 관리
 * @description 코어 레벨 스타일 시스템
 */

export type GlassmorphismIntensity = 'subtle' | 'medium' | 'strong';

export class CoreStyleManager {
  private static instance: CoreStyleManager | null = null;

  public static getInstance(): CoreStyleManager {
    if (!CoreStyleManager.instance) {
      CoreStyleManager.instance = new CoreStyleManager();
    }
    return CoreStyleManager.instance;
  }

  public setGlassmorphism(intensity: GlassmorphismIntensity): void {
    const values = {
      subtle: '0.8',
      medium: '0.6',
      strong: '0.4',
    };
    this.setCSSVariable('--xeg-glass-opacity', values[intensity]);
  }

  /**
   * CSS 클래스 결합 기능
   */
  public combineClasses(...classes: (string | null | undefined | false)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  /**
   * CSS 변수 설정
   */
  public setCSSVariable(name: string, value: string, element?: HTMLElement): void {
    const target = element || document.documentElement;
    target.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
  }

  /**
   * CSS 변수 조회
   */
  public getCSSVariable(name: string, element?: HTMLElement): string {
    const target = element || document.documentElement;
    const computedStyle = getComputedStyle(target);
    return computedStyle.getPropertyValue(name.startsWith('--') ? name : `--${name}`).trim();
  }

  /**
   * 글래스모피즘 효과 적용
   */
  public applyGlassmorphism(element: HTMLElement, intensity: GlassmorphismIntensity): void {
    const values = {
      subtle: '0.8',
      medium: '0.6',
      strong: '0.4',
    };

    element.style.setProperty('--glass-opacity', values[intensity]);
    element.style.background = `rgba(255, 255, 255, ${values[intensity]})`;
    element.style.backdropFilter = 'blur(10px)';
    element.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    element.style.willChange = 'backdrop-filter, transform';
  }

  /**
   * 컴포넌트 상태 업데이트
   */
  public updateComponentState(element: HTMLElement, state: Record<string, boolean>): void {
    Object.entries(state).forEach(([key, value]) => {
      const className = `is-${key}`;
      if (value) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    });
  }
}

export const coreStyleManager = CoreStyleManager.getInstance();

/**
 * CSS 클래스 결합 편의 함수
 */
export function combineClasses(...classes: (string | null | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
