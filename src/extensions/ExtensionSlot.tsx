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
    let disposed = false;
    let generation = 0;

    const render = () => {
      if (disposed) return;
      const api = window.YadakExtensions;
      if (!api) return;
      const currentGeneration = ++generation;
      container.replaceChildren();
      void api.runHook(name, {
        ...payloadRef.current,
        slot: name,
        container
      }).catch(error => {
        if (!disposed && currentGeneration === generation) {
          console.error(`Extension hook failed: ${name}`, error);
        }
      });
    };

    const onHooksChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string }>).detail;
      if (!detail?.name || detail.name === name) render();
    };

    render();
    window.addEventListener('yadak:extensions-ready', render);
    window.addEventListener('yadak:extension-hooks-changed', onHooksChanged);

    return () => {
      disposed = true;
      generation += 1;
      window.removeEventListener('yadak:extensions-ready', render);
      window.removeEventListener('yadak:extension-hooks-changed', onHooksChanged);
      container.replaceChildren();
    };
  }, [name, payloadKey]);

  return <div ref={ref} data-yadak-extension-slot={name} className={className} />;
};
