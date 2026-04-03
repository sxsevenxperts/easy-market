'use client';

import { useState, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

export function useConfirm() {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDangerous: false,
    isLoading: false,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      isDangerous?: boolean;
      onConfirm: () => void | Promise<void>;
    }) => {
      return new Promise<boolean>(resolve => {
        setState(prev => ({
          ...prev,
          isOpen: true,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          isDangerous: options.isDangerous || false,
          isLoading: false,
          onConfirm: async () => {
            setState(prev => ({ ...prev, isLoading: true }));
            try {
              await options.onConfirm();
              setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
              resolve(true);
            } catch (error) {
              setState(prev => ({ ...prev, isLoading: false }));
              resolve(false);
            }
          },
          onCancel: () => {
            setState(prev => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        }));
      });
    },
    []
  );

  return {
    confirm,
    ConfirmComponent: (
      <ConfirmModal
        title={state.title}
        message={state.message}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        isDangerous={state.isDangerous}
        isOpen={state.isOpen}
        isLoading={state.isLoading}
        onConfirm={state.onConfirm}
        onCancel={state.onCancel}
      />
    ),
  };
}
