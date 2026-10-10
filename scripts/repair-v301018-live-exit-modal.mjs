import fs from 'node:fs';

const fail = message => { throw new Error(`v30.10.18 live-exit repair failed: ${message}`); };

// Central contract: an open live-section inspector must close immediately when
// live-edit mode is disabled, regardless of which parent toggled the mode.
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  const marker = 'LIVE-EDIT-MODAL-CLOSE-v301018';

  if (!source.includes(marker)) {
    const storeAnchor = `    deleteSection,\n    showToast\n  } = useStore();`;
    if (!source.includes(storeAnchor)) fail('LiveSectionModal store anchor missing');
    source = source.replace(
      storeAnchor,
      `    deleteSection,\n    showToast,\n    isLiveEditActive\n  } = useStore();`
    );

    const returnAnchor = `  if (!isOpen || !form) return null;`;
    if (!source.includes(returnAnchor)) fail('LiveSectionModal return anchor missing');
    source = source.replace(
      returnAnchor,
      `  // ${marker}\n  useEffect(() => {\n    if (!isOpen || isLiveEditActive) return;\n    onClose();\n  }, [isOpen, isLiveEditActive, onClose]);\n\n${returnAnchor}`
    );
  }

  if (!source.includes(marker)) fail('LiveSectionModal live-exit marker missing');
  if (!source.includes('if (!isOpen || isLiveEditActive) return;')) fail('LiveSectionModal live-exit guard missing');
  if (!source.includes('onClose();\n  }, [isOpen, isLiveEditActive, onClose]);')) fail('LiveSectionModal live-exit close effect missing');

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

// Marketplace toolbar should clear its local inspector id synchronously too,
// so re-entering live edit can never resurrect the previously open modal.
{
  const file = 'src/components/home/MarketplaceRtlHome.tsx';
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  const oldHandler = `setIsLiveEditActive(false); }}>خروج از ویرایش</button>`;
  const newHandler = `setLiveSectionId(null); setIsLiveEditActive(false); }}>خروج از ویرایش</button>`;

  if (source.includes(oldHandler)) source = source.replace(oldHandler, newHandler);
  if (!source.includes(newHandler)) fail('Marketplace live-exit toolbar handler missing');

  if (source !== before) fs.writeFileSync(file, source, 'utf8');
}

// Generic page live editor has its own local modal id; clear it before leaving
// edit mode for the same reason.
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

console.log('v30.10.18 live-edit exit now closes and clears active section modals.');
