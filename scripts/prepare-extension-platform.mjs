import fs from 'node:fs/promises';

const patchFile = async (file, transform) => {
  const before = await fs.readFile(file, 'utf8');
  const after = transform(before);
  if (after !== before) await fs.writeFile(file, after, 'utf8');
  return after !== before;
};

const requireMarker = (source, marker, file) => {
  if (!source.includes(marker)) throw new Error(`Extension platform marker missing in ${file}: ${marker.slice(0, 90)}`);
};

const insertAfter = (source, marker, insertion, guard, file) => {
  if (guard && source.includes(guard)) return source;
  requireMarker(source, marker, file);
  return source.replace(marker, marker + insertion);
};

const insertBefore = (source, marker, insertion, guard, file) => {
  if (guard && source.includes(guard)) return source;
  requireMarker(source, marker, file);
  return source.replace(marker, insertion + marker);
};

const changed = [];

if (await patchFile('src/components/admin/AdminView.tsx', source => {
  const file = 'src/components/admin/AdminView.tsx';
  source = insertAfter(
    source,
    "import { AdminDashboardPro } from './AdminDashboardPro';\n",
    "import { AdminExtensionManager } from './AdminExtensionManager';\nimport { AdminExtensionPageHost } from './AdminExtensionPageHost';\nimport { ExtensionSlot } from '../../extensions/ExtensionSlot';\n",
    "import { AdminExtensionManager } from './AdminExtensionManager';",
    file
  );

  if (!source.includes("'extensions'")) {
    requireMarker(source, " | 'analytics'\n", file);
    source = source.replace(" | 'analytics'\n", " | 'analytics' | 'extensions'\n");
  }

  source = insertAfter(
    source,
    "  useEffect(() => {\n    setApiForm(apiIntegrations);\n  }, [apiIntegrations]);\n",
    `\n  const [extensionAdminMenus, setExtensionAdminMenus] = useState<Array<{ id: string; label: string; order?: number }>>([]);\n  useEffect(() => {\n    const syncExtensionMenus = () => setExtensionAdminMenus(window.YadakExtensions?.getAdminMenus().map(item => ({ id: item.id, label: item.label, order: item.order })) || []);\n    syncExtensionMenus();\n    window.addEventListener('yadak:extensions-ready', syncExtensionMenus);\n    window.addEventListener('yadak:extension-admin-menu-changed', syncExtensionMenus);\n    return () => {\n      window.removeEventListener('yadak:extensions-ready', syncExtensionMenus);\n      window.removeEventListener('yadak:extension-admin-menu-changed', syncExtensionMenus);\n    };\n  }, []);\n`,
    'const [extensionAdminMenus, setExtensionAdminMenus]',
    file
  );

  source = insertAfter(
    source,
    "    if (!permissions) return true;\n",
    "    if (tabId === 'extensions' || tabId.startsWith('extension:')) return permissions.canManageSettings;\n",
    "tabId.startsWith('extension:')",
    file
  );

  source = insertAfter(
    source,
    "        { id: 'theme', label: 'قالب، لوگو و فونت گوگل', icon: Palette },\n",
    "        { id: 'extensions', label: 'افزونه‌ها و قالب‌های نصبی', icon: Package },\n        ...extensionAdminMenus.map(item => ({ id: `extension:${item.id}`, label: item.label, icon: Package })),\n",
    "label: 'افزونه‌ها و قالب‌های نصبی'",
    file
  );

  if (source.includes("!['overview','analytics','sandbox'].includes(activeTab)")) {
    source = source.replace(
      "!['overview','analytics','sandbox'].includes(activeTab) && <AdminBulkActions section={activeTab} />",
      "!['overview','analytics','sandbox','extensions'].includes(activeTab) && !activeTab.startsWith('extension:') && <AdminBulkActions section={activeTab} />"
    );
  }

  source = insertBefore(
    source,
    "          {!['overview','analytics','sandbox','extensions'].includes(activeTab) && !activeTab.startsWith('extension:') && <AdminBulkActions section={activeTab} />}\n",
    "          <ExtensionSlot name=\"admin.content.before\" payload={{ activeTab }} payloadKey={activeTab} className=\"contents\" />\n",
    'name="admin.content.before"',
    file
  );

  source = insertBefore(
    source,
    "          {/* THEME CONTROLLER */}\n",
    `          {/* EXTENSIONS & INSTALLED THEMES */}\n          {activeTab === 'extensions' && (\n            <AdminExtensionManager />\n          )}\n\n          {activeTab.startsWith('extension:') && (\n            <AdminExtensionPageHost pageId={activeTab.slice('extension:'.length)} />\n          )}\n\n`,
    "<AdminExtensionManager />",
    file
  );

  return source;
})) changed.push('AdminView');

if (await patchFile('src/components/product/ProductCard.tsx', source => {
  const file = 'src/components/product/ProductCard.tsx';
  source = insertAfter(
    source,
    "import { ShoppingBag, Heart, ArrowRightLeft, Star, CheckCircle2, AlertTriangle, ShieldCheck, Phone } from 'lucide-react';\n",
    "import { ExtensionSlot } from '../../extensions/ExtensionSlot';\n",
    "../../extensions/ExtensionSlot",
    file
  );
  source = insertBefore(
    source,
    "          {/* Fitment Indicator Box (Mandatory Key Feature!) */}\n",
    "          <ExtensionSlot name=\"product.card\" payload={{ product }} payloadKey={product.id} className=\"mb-3\" />\n\n",
    'name="product.card"',
    file
  );
  return source;
})) changed.push('ProductCard');

if (await patchFile('src/components/product/ProductDetailView.tsx', source => {
  const file = 'src/components/product/ProductDetailView.tsx';
  source = insertAfter(
    source,
    "import { apiRequest } from '../../api/client';\n",
    "import { ExtensionSlot } from '../../extensions/ExtensionSlot';\n",
    "../../extensions/ExtensionSlot",
    file
  );
  source = insertBefore(
    source,
    "      {/* Main Top Grid: Gallery & Product Info */}\n",
    "      <ExtensionSlot name=\"product.page.beforeMain\" payload={{ product }} payloadKey={product.id} />\n\n",
    'name="product.page.beforeMain"',
    file
  );
  return source;
})) changed.push('ProductDetailView');

if (await patchFile('src/components/cart/CheckoutView.tsx', source => {
  const file = 'src/components/cart/CheckoutView.tsx';
  source = insertAfter(
    source,
    "import { apiRequest, ApiError } from '../../api/client';\n",
    "import { ExtensionSlot } from '../../extensions/ExtensionSlot';\n",
    "../../extensions/ExtensionSlot",
    file
  );
  source = insertBefore(
    source,
    "      {paymentFailed && (\n",
    "      <ExtensionSlot name=\"checkout.beforeForm\" payload={{ cart, cartTotal, finalTotal }} payloadKey={`${cart.length}:${finalTotal}`} />\n\n",
    'name="checkout.beforeForm"',
    file
  );
  return source;
})) changed.push('CheckoutView');

if (await patchFile('src/components/common/LiveSectionModal.tsx', source => {
  const file = 'src/components/common/LiveSectionModal.tsx';
  source = insertAfter(
    source,
    "import { LinkDestinationPicker } from './LinkDestinationPicker';\n",
    "import { ExtensionSlot } from '../../extensions/ExtensionSlot';\n",
    "../../extensions/ExtensionSlot",
    file
  );
  source = insertAfter(
    source,
    "      <div className=\"flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-neutral-50/60\">\n",
    "        <ExtensionSlot name=\"liveEditor.inspector\" payload={{ pageSlug, sectionId, section: form, tab }} payloadKey={`${pageSlug}:${sectionId}:${tab}`} />\n",
    'name="liveEditor.inspector"',
    file
  );
  return source;
})) changed.push('LiveSectionModal');

if (await patchFile('src/components/page/PageView.tsx', source => {
  const file = 'src/components/page/PageView.tsx';
  source = insertAfter(
    source,
    "import { LiveSectionModal } from '../common/LiveSectionModal';\n",
    "import { ExtensionSlot } from '../../extensions/ExtensionSlot';\nimport { ExtensionSectionQuickAdd } from '../../extensions/ExtensionSectionQuickAdd';\nimport type { ExtensionSectionDefinition } from '../../extensions/runtime';\n",
    "../../extensions/ExtensionSectionQuickAdd",
    file
  );

  source = insertBefore(
    source,
    "  const handleMoveOrder = (sectionId: string, direction: 'up' | 'down') => {\n",
    `  const handleAddExtensionSection = (definition: ExtensionSectionDefinition) => {\n    const nextOrder = (currentPage.sections.length || 0) + 1;\n    const newId = \`ext-sec-\${Date.now()}\`;\n    const defaults = definition.defaultConfig || {};\n    const newSec = {\n      id: newId,\n      title: definition.label,\n      subtitle: definition.description || '',\n      content: '',\n      badge: '',\n      imageUrl: '',\n      buttonText: '',\n      buttonLink: '',\n      isVisible: true,\n      order: nextOrder,\n      ...defaults,\n      sectionKey: \`extension:\${definition.id}\`\n    } as PageSection;\n    addSection(currentPage.slug, newSec);\n    setEditingSectionId(newId);\n    showToast(\`سکشن افزونه «\${definition.label}» اضافه شد.\`);\n  };\n\n`,
    'const handleAddExtensionSection',
    file
  );

  source = insertAfter(
    source,
    "            const hasImage = Boolean(section.imageUrl);\n",
    `\n            if (section.sectionKey?.startsWith('extension:')) {\n              const extensionSectionId = section.sectionKey.slice('extension:'.length);\n              return (\n                <div key={section.id} className={\`builder-responsive-section relative group bg-white rounded-3xl border \${isLiveEditActive ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-neutral-200'}\`} style={getSectionStyle(section)}>\n                  {isLiveEditActive && (\n                    <div className=\"absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 p-1.5 rounded-2xl shadow-xl\">\n                      <button type=\"button\" onClick={() => setEditingSectionId(section.id)} className=\"px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-bold\">ویرایش بخش</button>\n                      <button type=\"button\" onClick={() => { if (confirm(\`سکشن \"\${section.title}\" حذف شود؟\`)) deleteSection(currentPage.slug, section.id); }} className=\"p-1.5 text-red-300 hover:text-white rounded-lg\"><Trash2 className=\"w-3.5 h-3.5\" /></button>\n                    </div>\n                  )}\n                  <ExtensionSlot name={\`section.render.\${extensionSectionId}\`} payload={{ section, page: currentPage, liveEdit: isLiveEditActive }} payloadKey={\`\${section.id}:\${section.updatedAt || section.order}\`} className=\"min-h-[80px]\" />\n                </div>\n              );\n            }\n`,
    "section.sectionKey?.startsWith('extension:')",
    file
  );

  source = insertBefore(
    source,
    "          </div>\n        )}\n\n      </div>\n\n      {/* Live Section Editor Modal */}",
    "            <ExtensionSectionQuickAdd onAdd={handleAddExtensionSection} />\n",
    '<ExtensionSectionQuickAdd onAdd={handleAddExtensionSection} />',
    file
  );
  return source;
})) changed.push('PageView');

console.log(`Extension platform source integration OK${changed.length ? `; patched ${changed.join(', ')}` : '; already applied'}.`);
