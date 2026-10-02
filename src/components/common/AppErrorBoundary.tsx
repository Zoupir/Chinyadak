import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled React error:', error, info);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4" role="alert">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h1 className="text-lg font-black text-neutral-900">خطای غیرمنتظره در رابط کاربری</h1>
          <p className="text-xs leading-6 text-neutral-600">
            اطلاعات شما حذف نشده است. صفحه را دوباره بارگذاری کنید؛ اگر خطا تکرار شد، گزارش سرور باید بررسی شود.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold"
          >
            بارگذاری مجدد
          </button>
        </div>
      </div>
    );
  }
}
