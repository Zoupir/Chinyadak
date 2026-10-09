import fs from 'node:fs';

const file = 'src/server/ssr-store-context.tsx';
let source = fs.readFileSync(file, 'utf8');
const before = source;

source = source.replace(
  "import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';",
  "import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';"
);

if (!source.includes('data-v30109-live-edit-restore-lock')) {
  const start = source.indexOf('// data-v30109-live-edit-session: document navigation must not turn live editing off.');
  if (start < 0) throw new Error('v30.10.9 live-edit session block missing before restore-lock repair.');
  const tail = source.indexOf('\n  useEffect(() => {', start);
  if (tail < 0) throw new Error('v30.10.9 live-edit restore effect missing.');
  const effectEnd = source.indexOf('\n  }, []);', tail);
  if (effectEnd < 0) throw new Error('v30.10.9 live-edit restore effect end missing.');
  const end = effectEnd + '\n  }, []);'.length;
  const replacement = `// data-v30109-live-edit-session: document navigation must not turn live editing off.
  // data-v30109-live-edit-restore-lock: a child mount must not clear the explicit
  // admin request before /api/auth/me has validated the public storefront session.
  const liveEditRestorePendingRef = useRef(true);
  const requestedLiveEditRef = useRef(false);
  if (typeof window !== 'undefined' && liveEditRestorePendingRef.current) {
    try { requestedLiveEditRef.current = window.sessionStorage.getItem('chinpart_live_edit_active') === '1'; } catch {}
  }
  const [isLiveEditActive, setLiveEditActiveState] = useState<boolean>(false);
  const setIsLiveEditActive = (nextValue: boolean | ((previous: boolean) => boolean)) => {
    setLiveEditActiveState(previous => {
      const next = typeof nextValue === 'function' ? nextValue(previous) : nextValue;
      if (liveEditRestorePendingRef.current && requestedLiveEditRef.current && next === false) return previous;
      if (next !== previous || !liveEditRestorePendingRef.current) {
        try { window.sessionStorage.setItem('chinpart_live_edit_active', next ? '1' : '0'); } catch {}
      }
      requestedLiveEditRef.current = next;
      return next;
    });
  };
  useEffect(() => {
    try {
      const requested = window.sessionStorage.getItem('chinpart_live_edit_active') === '1';
      requestedLiveEditRef.current = requested;
      if (requested) setLiveEditActiveState(true);
    } catch {}
  }, []);`;
  source = source.slice(0, start) + replacement + source.slice(end);
}

if (!source.includes('data-v30109-admin-validation-unlocks-live-edit')) {
  const authSet = "        setAdminAuth({ isAuthenticated: true, username: data.admin.username || '', isMustChangePassword: false, currentUser: data.admin });";
  if (!source.includes(authSet)) throw new Error('v30.10.9 public admin auth assignment missing.');
  source = source.replace(authSet, `${authSet}\n        // data-v30109-admin-validation-unlocks-live-edit\n        if (requestedLiveEditRef.current) setLiveEditActiveState(true);\n        liveEditRestorePendingRef.current = false;`);
}

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log('v30.10.9 live-edit restore lock applied until admin session validation.');
} else {
  console.log('v30.10.9 live-edit restore lock already applied.');
}

for (const marker of [
  'useMemo, useRef, useState',
  'data-v30109-live-edit-restore-lock',
  'liveEditRestorePendingRef.current && requestedLiveEditRef.current && next === false',
  'data-v30109-admin-validation-unlocks-live-edit'
]) {
  if (!source.includes(marker)) throw new Error(`v30.10.9 live-edit restore lock incomplete: ${marker}`);
}
