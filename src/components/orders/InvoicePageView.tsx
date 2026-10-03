import React from 'react';
import { useStore } from '../../context/StoreContext';
import { InvoiceModal } from './InvoiceModal';

interface InvoicePageViewProps {
  orderId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const InvoicePageView: React.FC<InvoicePageViewProps> = ({ orderId, onNavigate }) => {
  const { orders, settings } = useStore();
  const order = orders.find(item => item.id === orderId || item.orderNumber === orderId) || orders[0];

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">سفارشی برای نمایش فاکتور یافت نشد</h2>
        <button
          type="button"
          onClick={() => onNavigate('account', 'orders')}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          بازگشت به سفارش‌ها
        </button>
      </div>
    );
  }

  // Keep the dedicated invoice route on the same renderer as the modal so
  // print and Save as PDF always use the exact invoice the customer reviewed.
  return (
    <InvoiceModal
      order={order}
      settings={settings}
      onClose={() => onNavigate('account', 'orders')}
    />
  );
};
