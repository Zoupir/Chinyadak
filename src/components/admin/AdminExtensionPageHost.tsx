import React, { useEffect, useRef, useState } from 'react';

interface Props {
  pageId: string;
}

export const AdminExtensionPageHost: React.FC<Props> = ({ pageId }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();
    setError('');

    const menu = window.YadakExtensions?.getAdminMenus().find(item => item.id === pageId);
    if (!menu) {
      setError('این صفحه افزونه دیگر ثبت نشده یا افزونه غیرفعال است.');
      return;
    }
    if (typeof menu.render !== 'function') {
      setError('این افزونه برای صفحه مدیریت تابع render تعریف نکرده است.');
      return;
    }

    let cleanup: void | (() => void);
    let cancelled = false;
    Promise.resolve(menu.render(host, { pageId, path: window.location.pathname }))
      .then(result => {
        if (cancelled) {
          if (typeof result === 'function') result();
          return;
        }
        cleanup = result;
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
      host.replaceChildren();
    };
  }, [pageId]);

  return (
    <section className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs min-h-[320px]">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-4 text-xs font-bold mb-4">{error}</div>}
      <div ref={hostRef} data-yadak-extension-admin-page={pageId} />
    </section>
  );
};
