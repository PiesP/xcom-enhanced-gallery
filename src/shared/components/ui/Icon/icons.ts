/**
 * Tabler Icons 기반 아이콘 컴포넌트들
 * 각 아이콘은 실제 SVG 경로로 구현되어 있습니다.
 */
import { getPreact } from '@shared/external/vendors';
import { Icon, type IconProps } from './Icon';

type IconComponentProps = Omit<IconProps, 'children'>;

// ChevronLeft 아이콘 (이전 버튼)
export function ChevronLeft(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M15 6l-6 6l6 6' }),
  ]);
}

// ChevronRight 아이콘 (다음 버튼)
export function ChevronRight(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M9 6l6 6l-6 6' }),
  ]);
}

// Download 아이콘 (다운로드 버튼)
export function Download(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2' }),
    h('path', { d: 'M7 11l5 5l5 -5' }),
    h('path', { d: 'M12 4l0 12' }),
  ]);
}

// FileZip 아이콘 (일괄 다운로드)
export function FileZip(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', {
      d: 'M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-11z',
    }),
    h('path', {
      d: 'M11 17a1 1 0 0 1 1 -1h1a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-1z',
    }),
    h('path', { d: 'M11 5l0 2' }),
    h('path', { d: 'M13 7l0 2' }),
    h('path', { d: 'M11 9l0 2' }),
    h('path', { d: 'M13 11l0 2' }),
    h('path', { d: 'M11 13l0 2' }),
  ]);
}

// Settings 아이콘 (설정 버튼)
export function Settings(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', {
      d: 'M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z',
    }),
    h('path', { d: 'M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0' }),
  ]);
}

// X 아이콘 (닫기 버튼)
export function X(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M18 6l-12 12' }),
    h('path', { d: 'M6 6l12 12' }),
  ]);
}

// ZoomIn 아이콘 (원본 크기 핏)
export function ZoomIn(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0' }),
    h('path', { d: 'M7 10l6 0' }),
    h('path', { d: 'M10 7l0 6' }),
    h('path', { d: 'M21 21l-6 -6' }),
  ]);
}

// ArrowAutofitWidth 아이콘 (너비 맞춤)
export function ArrowAutofitWidth(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6' }),
    h('path', { d: 'M10 18h-7' }),
    h('path', { d: 'M21 18h-7' }),
    h('path', { d: 'M6 15l-3 3l3 3' }),
    h('path', { d: 'M18 15l3 3l-3 3' }),
  ]);
}

// ArrowAutofitHeight 아이콘 (높이 맞춤)
export function ArrowAutofitHeight(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M12 20h-6a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h6' }),
    h('path', { d: 'M18 14v7' }),
    h('path', { d: 'M18 3v7' }),
    h('path', { d: 'M15 18l3 3l3 -3' }),
    h('path', { d: 'M15 6l3 -3l3 3' }),
  ]);
}

// ArrowsMaximize 아이콘 (컨테이너 맞춤)
export function ArrowsMaximize(props: IconComponentProps) {
  const { h } = getPreact();
  return h(Icon, props, [
    h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
    h('path', { d: 'M16 4l4 0l0 4' }),
    h('path', { d: 'M14 10l6 -6' }),
    h('path', { d: 'M8 20l-4 0l0 -4' }),
    h('path', { d: 'M4 20l6 -6' }),
    h('path', { d: 'M16 20l4 0l0 -4' }),
    h('path', { d: 'M14 14l6 6' }),
    h('path', { d: 'M8 4l-4 0l0 4' }),
    h('path', { d: 'M4 4l6 6' }),
  ]);
}
