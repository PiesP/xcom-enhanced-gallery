/**
 * 문자열 포맷팅을 위한 유틸리티 클래스
 */
export class StringFormatter {
  /**
   * 템플릿 문자열에 변수 값 대입
   * @param {string} template - 템플릿 문자열 (예: "Hello {{name}}")
   * @param {Object} params - 대입할 변수 (예: {name: "World"})
   * @returns {string} 변수가 대입된 문자열
   */
  static format(template, params = {}) {
    if (!template) return '';
    if (!params || typeof params !== 'object') return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
  
  /**
   * 순서 기반 포맷팅 (인덱스로 변수 참조)
   * @param {string} template - 템플릿 문자열 (예: "Hello {0}, it's {1}")
   * @param  {...any} args - 순서대로 대입할 변수들
   * @returns {string} 변수가 대입된 문자열
   */
  static formatIndexed(template, ...args) {
    if (!template) return '';
    if (!args || args.length === 0) return template;
    
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      const idx = parseInt(index, 10);
      return idx < args.length ? args[idx] : match;
    });
  }
  
  /**
   * 복수형 처리
   * @param {number} count - 개수
   * @param {string} singular - 단수형 문자열
   * @param {string} plural - 복수형 문자열
   * @returns {string} 개수에 따른 적절한 문자열
   */
  static pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }
  
  /**
   * HTML 이스케이핑
   * @param {string} text - 원본 텍스트
   * @returns {string} 이스케이핑된 텍스트
   */
  static escapeHTML(text) {
    if (!text) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}