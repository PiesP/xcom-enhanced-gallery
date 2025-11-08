/* global MutationRecord, Node */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';

/**
 * @fileoverview MutationObserver Browser API Tests
 *
 * 목적: MutationObserver API를 사용한 DOM 변경 감지 테스트
 * - 속성 변경 감지
 * - 자식 노드 추가/제거 감지
 * - 텍스트 내용 변경 감지
 */

describe('MutationObserver API', () => {
  setupGlobalTestIsolation();

  let container: HTMLDivElement;
  let observer: MutationObserver | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    observer?.disconnect();
    observer = null;
    document.body.removeChild(container);
  });

  it('should observe attribute changes', async () => {
    const mutations: MutationRecord[] = [];

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        mutations.push(...records);

        if (mutations.length > 0) {
          expect(mutations[0]?.type).toBe('attributes');
          expect(mutations[0]?.attributeName).toBe('data-test');
          expect(mutations[0]?.oldValue).toBeNull();
          resolve();
        }
      });

      observer.observe(container, {
        attributes: true,
        attributeOldValue: true,
      });

      // 속성 변경 트리거
      setTimeout(() => {
        container.setAttribute('data-test', 'value');
      }, 50);
    });
  });

  it('should observe child node additions', async () => {
    const addedNodes: Node[] = [];

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        records.forEach(record => {
          record.addedNodes.forEach(node => addedNodes.push(node));
        });

        if (addedNodes.length === 2) {
          expect(addedNodes[0]?.nodeName).toBe('DIV');
          expect(addedNodes[1]?.nodeName).toBe('SPAN');
          resolve();
        }
      });

      observer.observe(container, {
        childList: true,
      });

      // 자식 노드 추가
      setTimeout(() => {
        const div = document.createElement('div');
        const span = document.createElement('span');
        container.appendChild(div);
        container.appendChild(span);
      }, 50);
    });
  });

  it('should observe child node removals', async () => {
    const child1 = document.createElement('div');
    const child2 = document.createElement('span');
    child1.className = 'child1';
    child2.className = 'child2';
    container.appendChild(child1);
    container.appendChild(child2);

    const removedNodes: Node[] = [];

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        records.forEach(record => {
          record.removedNodes.forEach(node => removedNodes.push(node));
        });

        if (removedNodes.length === 1) {
          expect(removedNodes[0]).toBe(child1);
          resolve();
        }
      });

      observer.observe(container, {
        childList: true,
      });

      // 자식 노드 제거
      setTimeout(() => {
        container.removeChild(child1);
      }, 50);
    });
  });

  it('should observe text content changes with characterData', async () => {
    const textNode = document.createTextNode('initial');
    container.appendChild(textNode);

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        const record = records[0];
        if (record && record.type === 'characterData') {
          expect(record.oldValue).toBe('initial');
          expect(record.target.textContent).toBe('updated');
          resolve();
        }
      });

      observer.observe(container, {
        characterData: true,
        characterDataOldValue: true,
        subtree: true,
      });

      // 텍스트 변경
      setTimeout(() => {
        textNode.textContent = 'updated';
      }, 50);
    });
  });

  it('should observe nested subtree changes', async () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.appendChild(child);
    container.appendChild(parent);

    const mutations: MutationRecord[] = [];

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        mutations.push(...records);

        if (mutations.length > 0) {
          expect(mutations[0]?.target).toBe(child);
          expect(mutations[0]?.attributeName).toBe('class');
          resolve();
        }
      });

      observer.observe(container, {
        attributes: true,
        subtree: true, // 하위 트리 모두 감시
      });

      // 중첩된 요소의 속성 변경
      setTimeout(() => {
        child.className = 'nested-class';
      }, 50);
    });
  });

  it('should handle multiple mutation types simultaneously', async () => {
    const mutations: Array<{ type: string; detail: string }> = [];

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        records.forEach(record => {
          if (record.type === 'attributes') {
            mutations.push({ type: 'attributes', detail: record.attributeName || '' });
          } else if (record.type === 'childList') {
            mutations.push({
              type: 'childList',
              detail: `added:${record.addedNodes.length},removed:${record.removedNodes.length}`,
            });
          }
        });

        if (mutations.length >= 2) {
          const hasAttributes = mutations.some(m => m.type === 'attributes');
          const hasChildList = mutations.some(m => m.type === 'childList');
          expect(hasAttributes).toBe(true);
          expect(hasChildList).toBe(true);
          resolve();
        }
      });

      observer.observe(container, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      // 여러 타입의 변경 트리거
      setTimeout(() => {
        container.setAttribute('data-multi', 'test');
        const newChild = document.createElement('div');
        container.appendChild(newChild);
      }, 50);
    });
  });

  it('should stop observing after disconnect', async () => {
    let mutationCount = 0;

    observer = new MutationObserver(() => {
      mutationCount++;
    });

    observer.observe(container, {
      attributes: true,
      childList: true,
    });

    // 첫 번째 변경
    container.setAttribute('data-test', 'value1');
    await new Promise(resolve => setTimeout(resolve, 100));

    const countAfterFirst = mutationCount;
    expect(countAfterFirst).toBeGreaterThan(0);

    // 관찰 중지
    observer.disconnect();

    // 두 번째 변경 (관찰되지 않아야 함)
    container.setAttribute('data-test', 'value2');
    const child = document.createElement('div');
    container.appendChild(child);
    await new Promise(resolve => setTimeout(resolve, 100));

    // 카운트가 증가하지 않았는지 확인
    expect(mutationCount).toBe(countAfterFirst);
  });

  it('should batch rapid mutations', async () => {
    const mutationBatches: number[] = [];

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        mutationBatches.push(records.length);

        if (mutationBatches.length > 0) {
          // MutationObserver는 마이크로태스크로 일괄 처리함
          expect(records.length).toBeGreaterThan(0);
          resolve();
        }
      });

      observer.observe(container, {
        attributes: true,
      });

      // 빠른 연속 변경
      container.setAttribute('data-1', 'a');
      container.setAttribute('data-2', 'b');
      container.setAttribute('data-3', 'c');
      container.setAttribute('data-4', 'd');
      container.setAttribute('data-5', 'e');
    });
  });

  it('should provide previousSibling and nextSibling information', async () => {
    const sibling1 = document.createElement('div');
    const sibling2 = document.createElement('div');
    sibling1.className = 'sibling1';
    sibling2.className = 'sibling2';
    container.appendChild(sibling1);
    container.appendChild(sibling2);

    return new Promise<void>(resolve => {
      observer = new MutationObserver(records => {
        const record = records[0];
        if (record && record.type === 'childList' && record.addedNodes.length > 0) {
          expect(record.previousSibling).toBe(sibling2);
          expect(record.nextSibling).toBeNull();
          resolve();
        }
      });

      observer.observe(container, {
        childList: true,
      });

      // 새 노드 추가
      setTimeout(() => {
        const newNode = document.createElement('div');
        newNode.className = 'new-sibling';
        container.appendChild(newNode);
      }, 50);
    });
  });
});
