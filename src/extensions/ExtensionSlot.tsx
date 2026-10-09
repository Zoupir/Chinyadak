import React, { useEffect, useRef } from 'react';

type ExtensionSlotProps = {
  name: string;
  payload?: Record<string, unknown>;
  payloadKey?: string | number;
  className?: string;
};

export const ExtensionSlot: React.FC<ExtensionSlotProps> = ({
  name,
  payload = {},
  payloadKey = '',
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.replaceChildren();

    const api = window.YadakExtensions;
    if (!api) return;

    let cancelled = false;
    void api.runHook(name, {
      ...payloadRef.current,
      slot: name,
      container
    }).catch(error => {
      if (!cancelled) console.error(`Extension hook failed: ${name}`, error);
    });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [name, payloadKey]);

  return <div ref={ref} data-yadak-extension-slot={name} className={className} />;
};
