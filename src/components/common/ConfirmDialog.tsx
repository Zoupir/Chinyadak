import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  danger = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden text-right">
        <div className="p-5 border-b border-neutral-100 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-2xl grid place-items-center shrink-0 ${danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-sm text-neutral-900">{title}</h3>
            <div className="mt-1 text-xs leading-6 text-neutral-500">{message}</div>
          </div>
          <button type="button" onClick={onCancel} className="p-2 rounded-xl hover:bg-neutral-100" aria-label="بستن">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-neutral-50 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-xs font-black text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-900 hover:bg-black'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
