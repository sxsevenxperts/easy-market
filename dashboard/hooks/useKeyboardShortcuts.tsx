'use client';

import { useEffect, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  // Usar ref para evitar que o efeito re-execute quando o array muda de referência
  // mas não de conteúdo (arrays literais criam nova referência a cada render)
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcutsRef.current.forEach((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // Efeito roda apenas uma vez — shortcutsRef.current é atualizado via ref sem re-executar o efeito
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  refresh: { key: 'F5' },
  escape: { key: 'Escape' },
  save: { key: 's', ctrl: true },
  enter: { key: 'Enter' },
};
