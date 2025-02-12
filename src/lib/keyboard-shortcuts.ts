export interface Shortcut {
  key: string;
  description: string;
  command: () => void;
  scope: 'global' | 'board' | 'task';
}

export function isInputElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}

export function createShortcuts(handlers: {
  createBoard?: () => void;
  showSearch?: () => void;
  toggleHelp?: () => void;
  closeModal?: () => void;
}) {
  return [
    {
      key: 'n',
      description: 'Create new board',
      command: handlers.createBoard || (() => {}),
      scope: 'global'
    },
    {
      key: '/',
      description: 'Search boards',
      command: handlers.showSearch || (() => {}),
      scope: 'global'
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      command: handlers.toggleHelp || (() => {}),
      scope: 'global'
    },
    {
      key: 'Escape',
      description: 'Close modal',
      command: handlers.closeModal || (() => {}),
      scope: 'global'
    }
  ] as Shortcut[];
} 