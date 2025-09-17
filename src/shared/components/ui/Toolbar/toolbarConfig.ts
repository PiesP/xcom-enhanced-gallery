export interface ToolbarActionConfig {
  readonly type: string;
  readonly group: string;
}

export interface ToolbarConfig {
  readonly actionGroups: readonly ToolbarActionConfig[];
}

export const defaultToolbarConfig: ToolbarConfig = {
  actionGroups: [
    { type: 'previous', group: 'navigation' },
    { type: 'next', group: 'navigation' },
    { type: 'downloadCurrent', group: 'downloads' },
  ],
};
