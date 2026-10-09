import fs from 'node:fs';

// ---------------------------------------------------------------------------
// Browser-observable inspector controls.
// ---------------------------------------------------------------------------
{
  const file = 'src/components/common/LiveSectionModal.tsx';
  let source = fs.readFileSync(file, 'utf8');

  const patchSelect = (valueExpr, field) => {
    const from = `<select value={${valueExpr}}`;
    const to = `<select data-section-field="${field}" value={${valueExpr}}`;
    if (!source.includes(to)) {
      if (!source.includes(from)) throw new Error(`v30.10.17 browser hook target missing: ${field}`);
      source = source.replace(from, to);
    }
  };

  patchSelect('form.desktopColumns || 3', 'desktopColumns');
  patchSelect('form.tabletColumns || Math.min(form.desktopColumns || 3,2)', 'tabletColumns');
  patchSelect('form.mobileColumns || 1', 'mobileColumns');

  if (!source.includes('data-section-field="desktopColumns"') ||
      !source.includes('data-section-field="tabletColumns"') ||
      !source.includes('data-section-field="mobileColumns"')) {
    throw new Error('v30.10.17 responsive column browser hooks incomplete');
  }

  fs.writeFileSync(file, source, 'utf8');
}

// ---------------------------------------------------------------------------
// Live-edit mode must survive the admin -> storefront navigation boundary.
// Use a one-shot session handoff. Marketplace consumes it during its FIRST
// render, before passive effects can race with the route transition, then syncs
// the normal StoreContext boolean. This avoids relying on historical source
// shapes of the StoreContext state declaration.
// ---------------------------------------------------------------------------
{
  const builderFile = 'src/components/admin/AdminVisualPageBuilder.tsx';
  let builder = fs.readFileSync(builderFile, 'utf8');
  const builderMarker = 'LIVE-EDIT-NAVIGATION-HANDOFF-v301017';

  if (!builder.includes(builderMarker)) {
    const setterPattern = /setIsLiveEditActive\s*\(\s*true\s*\)\s*;/;
    if (!setterPattern.test(builder)) throw new Error('v30.10.17 visual-builder live setter missing');
    builder = builder.replace(
      setterPattern,
      `// ${builderMarker}\n            try {\n              window.sessionStorage.setItem('yadak-live-edit-pending', '1');\n            } catch {\n              // The ordinary React state path still works when storage is unavailable.\n            }\n            setIsLiveEditActive(true);`
    );
  }

  if (!builder.includes(builderMarker) || !builder.includes("sessionStorage.setItem('yadak-live-edit-pending', '1')")) {
    throw new Error('v30.10.17 visual-builder live navigation handoff incomplete');
  }
  fs.writeFileSync(builderFile, builder, 'utf8');

  const marketplaceFile = 'src/components/home/MarketplaceRtlHome.tsx';
  let marketplace = fs.readFileSync(marketplaceFile, 'utf8');
  const marketplaceMarker = 'LIVE-EDIT-FIRST-RENDER-HANDOFF-v301017';

  if (!marketplace.includes(marketplaceMarker)) {
    const destructure = `    isLiveEditActive,\n    setIsLiveEditActive,`;
    const destructurePrepared = `    isLiveEditActive: contextLiveEditActive,\n    setIsLiveEditActive,`;
    if (marketplace.includes(destructure)) {
      marketplace = marketplace.replace(destructure, destructurePrepared);
    } else if (!marketplace.includes(destructurePrepared)) {
      throw new Error('v30.10.17 marketplace live-edit destructure target missing');
    }

    const anchor = `  } = useStore();\n\n  const homeSections`;
    if (!marketplace.includes(anchor)) throw new Error('v30.10.17 marketplace first-render anchor missing');
    const injection = `  } = useStore();\n\n  // ${marketplaceMarker}\n  const [navigationLiveEditRequested] = useState<boolean>(() => {\n    if (typeof window === 'undefined') return false;\n    try {\n      return window.sessionStorage.getItem('yadak-live-edit-pending') === '1';\n    } catch {\n      return false;\n    }\n  });\n  const isLiveEditActive = contextLiveEditActive || navigationLiveEditRequested;\n\n  useEffect(() => {\n    if (!navigationLiveEditRequested) return;\n    try { window.sessionStorage.removeItem('yadak-live-edit-pending'); } catch {}\n    if (!contextLiveEditActive) setIsLiveEditActive(true);\n  }, [navigationLiveEditRequested, contextLiveEditActive, setIsLiveEditActive]);\n\n  const homeSections`;
    marketplace = marketplace.replace(anchor, injection);
  }

  const legacyMarker = 'MARKETPLACE-LEGACY-SECTION-BRIDGE-v301017';
  if (!marketplace.includes(legacyMarker)) {
    const sectionConfigLine = `  const sectionConfig = (key: string) => homeSections.find(section => section.sectionKey === key);`;
    if (!marketplace.includes(sectionConfigLine)) throw new Error('v30.10.17 marketplace sectionConfig target missing');
    marketplace = marketplace.replace(
      sectionConfigLine,
      `  // ${legacyMarker}\n  const legacySectionIdByKey: Record<string, string> = {\n    hero: 'sec-hero',\n    'featured-categories': 'sec-categories',\n    manufacturers: 'sec-brands',\n    testimonials: 'sec-trust',\n    articles: 'sec-articles'\n  };\n  const sectionConfig = (key: string) => homeSections.find(\n    section => section.sectionKey === key || section.id === legacySectionIdByKey[key]\n  );`
    );

    const heroLookup = `    const section = homeSections.find(item => item.sectionKey === 'hero');`;
    if (marketplace.includes(heroLookup)) marketplace = marketplace.replace(heroLookup, `    const section = sectionConfig('hero');`);

    const liveLookup = `    const section = homeSections.find(item => item.sectionKey === sectionKey);`;
    if (!marketplace.includes(liveLookup)) throw new Error('v30.10.17 marketplace live section lookup target missing');
    marketplace = marketplace.replace(liveLookup, `    const section = sectionConfig(sectionKey);`);
  }

  if (!marketplace.includes(marketplaceMarker) ||
      !marketplace.includes('const isLiveEditActive = contextLiveEditActive || navigationLiveEditRequested;') ||
      !marketplace.includes(legacyMarker) ||
      !marketplace.includes('const section = sectionConfig(sectionKey);')) {
    throw new Error('v30.10.17 marketplace live-edit compatibility bridge incomplete');
  }
  fs.writeFileSync(marketplaceFile, marketplace, 'utf8');
}

console.log('v30.10.17 browser contract: responsive controls observable, live-edit handoff survives navigation, and legacy home sections remain editable.');
