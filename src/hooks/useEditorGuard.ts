import { RefObject, useCallback, useEffect } from 'react';

const DEFAULT_MESSAGE = 'تغییرات ذخیره‌نشده دارید. بدون ذخیره خارج می‌شوید؟';

export const editorSnapshot = (value: unknown): string => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value ?? '');
  }
};

export const useUnsavedChangesGuard = (dirty: boolean, message = DEFAULT_MESSAGE) => {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  return useCallback(() => !dirty || window.confirm(message), [dirty, message]);
};

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export const useDialogFocusTrap = (
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onRequestClose: () => void
) => {
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const initial = dialog.querySelector<HTMLElement>('[data-autofocus="true"]')
      || dialog.querySelector<HTMLElement>(focusableSelector)
      || dialog;
    window.setTimeout(() => initial.focus({ preventScroll: true }), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onRequestClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(item => item.offsetParent !== null || item === document.activeElement);
      if (!focusables.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus({ preventScroll: true });
    };
  }, [open, dialogRef, onRequestClose]);
};
