import fs from 'node:fs';

const fail = message => { throw new Error(`v30.10.18 live-exit repair failed: ${message}`); };

// Marketplace owns the active live-section inspector id. Clear that local state
// before disabling live edit, and also clear it if live edit/auth is disabled by
// another control. Keeping this in the owner avoids false closes during public
// hydration where the modal and toolbar can observe state at different moments.
{
  const file = 'src/components/home/MarketplaceRtlHome.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  const oldHandler = `setIsLiveEditActive(false); }}>خروج از ویرایش</button>`;
  const newHandler = `setLiveSectionId(null); setIsLiveEditActive(false); }}>خروج از ویرایش</button>`;

  if (source.includes(oldHandler)) source = source.replace(oldHandler, newHandler);

  const marker = 'MARKETPLACE-LIVE-EXIT-CLOSE-v301018';
  if (!source.includes(marker)) {
    const stateAnchor = `  const [liveSectionId, setLiveSectionId] = useState<string | null>(null);`;
    if (!source.includes(stateAnchor)) fail('Marketplace live-section state anchor missing');
    source = source.replace(
      stateAnchor,
      `${stateAnchor}\n\n  // ${marker}\n  useEffect(() => {\n    if (!isLiveEditActive || !adminAuth.isAuthenticated) setLiveSectionId(null);\n  }, [isLiveEditActive, adminAuth.isAuthenticated]);`
    );
  }

  if (!source.includes(newHandler)) fail('Marketplace live-exit toolbar handler missing');
  if (!source.includes(marker)) fail('Marketplace live-exit state cleanup missing');
  if (!source.includes('if (!isLiveEditActive || !adminAuth.isAuthenticated) setLiveSectionId(null);')) {
    fail('Marketplace live-exit cleanup effect missing');
  }

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

// Generic page live editor has its own local modal id; clear it synchronously
// before leaving edit mode so the modal cannot remain mounted behind the page.
{
  const file = 'src/components/page/PageView.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  const oldHandler = `onClick={() => setIsLiveEditActive(false)}`;
  const newHandler = `onClick={() => { setEditingSectionId(null); setIsLiveEditActive(false); }}`;

  if (source.includes(oldHandler)) source = source.replace(oldHandler, newHandler);
  if (!source.includes(newHandler)) fail('PageView live-exit handler missing');

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

console.log('v30.10.18 live-edit exit now closes active section modals at their owning parent.');
