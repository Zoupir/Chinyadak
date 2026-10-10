import fs from 'node:fs';

const changed = [];
const edit = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(file);
  }
};

edit('src/context/StoreContext.tsx', source => {
  const bulkStart = "  const bulkUpdateProducts = (updates: { id: string; price?: number; stock?: number; status?: string }[]) => {";
  const vehicleMarker = '\n\n  // Vehicle Selection\n';
  const start = source.indexOf(bulkStart);
  const end = source.indexOf(vehicleMarker, start);
  if (start < 0 || end < 0) throw new Error('v30.10.2 bulk product state target missing');
  const replacement = `  const bulkUpdateProducts = (updates: { id: string; price?: number; stock?: number; status?: string }[]) => {\n    void apiRequest<{ ok: boolean; products: Product[] }>('/api/catalog/products/bulk', {\n      method: 'PATCH',\n      body: JSON.stringify({ updates })\n    }).then(({ products: saved }) => {\n      const byId = new Map(saved.map(product => [product.id, product]));\n      setProducts(prev => prev.map(product => byId.get(product.id) || product));\n      showToast(\`${'${saved.length}'} محصول با موفقیت به‌روزرسانی گروهی شدند.\`);\n    }).catch(error => {\n      console.error(error);\n      showToast('به‌روزرسانی گروهی محصولات انجام نشد.', 'error');\n    });\n  };`;
  source = source.slice(0, start) + replacement + source.slice(end);

  if (!source.includes('data-v30102-vehicle-state-reconcile')) {
    const marker = `  // Restore the HttpOnly server session without exposing credentials to JavaScript.\n`;
    if (!source.includes(marker)) throw new Error('v30.10.2 vehicle state reconciliation insertion target missing');
    const effect = `  // data-v30102-vehicle-state-reconcile: local vehicle state may outlive\n  // server-side taxonomy changes. Once public data is ready, remove references\n  // to inactive/deleted models instead of carrying orphan state indefinitely.\n  useEffect(() => {\n    if (!isStoreReady) return;\n    const activeModelIds = new Set(models.map(model => model.id));\n    setGarage(prev => prev.filter(car => activeModelIds.has(car.modelId)));\n    setSelectedVehicleState(prev => prev && activeModelIds.has(prev.modelId) ? prev : null);\n  }, [isStoreReady, models]);\n\n`;
    source = source.replace(marker, effect + marker);
  }
  return source;
});

edit('src/server/routes/bulk.ts', source => {
  if (!source.includes("from '../data-integrity'")) {
    source = source.replace(
      "import { pool, withTransaction, refundOrderLoyalty, type RowDataPacket } from '../db';",
      "import { pool, withTransaction, refundOrderLoyalty, type RowDataPacket } from '../db';\nimport { categorySubtreeSlugs, collectProductReferenceUsage, parseStoredJson } from '../data-integrity';"
    );
  }

  if (!source.includes('const integrityUsage =')) {
    const marker = "      const [rows] = await tx.query<RowDataPacket[]>(`SELECT * FROM ${d.table} WHERE id IN (${ids.map(() => '?').join(',')}) FOR UPDATE`, ids);\n";
    if (!source.includes(marker)) throw new Error('v30.10.2 bulk integrity rows marker missing');
    source = source.replace(marker, marker + `      const destructiveCatalogAction = ['deactivate','trash','delete'].includes(action) && ['products','categories','brands','models'].includes(kind);\n      const integrityUsage = destructiveCatalogAction ? await collectProductReferenceUsage(tx) : null;\n`);
  }

  if (!source.includes("if (kind === 'categories' && integrityUsage)")) {
    const marker = "        if (kind === 'products' && Number(row.reserved_stock) > 0 && ['trash','delete','deactivate'].includes(action)) throw Error('PRODUCT_HAS_ACTIVE_RESERVATIONS');\n";
    if (!source.includes(marker)) throw new Error('v30.10.2 bulk integrity guard marker missing');
    const guards = `        if (kind === 'products' && integrityUsage && ['trash','delete','deactivate'].includes(action) && (integrityUsage.productLinks.get(String(row.id))?.size || 0) > 0) throw Error('PRODUCT_REFERENCED_BY_OTHER_PRODUCTS');\n        if (kind === 'models' && integrityUsage && ['trash','delete','deactivate'].includes(action) && (integrityUsage.modelIds.get(String(row.id))?.size || 0) > 0) throw Error('VEHICLE_MODEL_IN_USE');\n        if (kind === 'brands' && integrityUsage && ['trash','delete','deactivate'].includes(action)) {\n          const [linkedModels] = await tx.query<RowDataPacket[]>('SELECT id FROM vehicle_models WHERE brand_id = ? AND is_active = 1 LIMIT 1', [row.id]);\n          if (linkedModels.length) throw Error('BRAND_HAS_MODELS_USE_INDIVIDUAL_ACTION');\n          if ((integrityUsage.brandIds.get(String(row.id))?.size || 0) > 0) throw Error('VEHICLE_BRAND_IN_USE');\n        }\n        if (kind === 'categories' && integrityUsage && ['trash','delete','deactivate'].includes(action)) {\n          const category = { ...parseStoredJson<any>(row.data_json, {}), id: row.id, slug: row.slug };\n          const slugs = categorySubtreeSlugs(category);\n          for (const slug of slugs) if ((integrityUsage.categorySlugs.get(slug)?.size || 0) > 0) throw Error('CATEGORY_IN_USE');\n          const [children] = await tx.query<RowDataPacket[]>('SELECT id FROM categories WHERE parent_id = ? AND is_active = 1 LIMIT 1', [row.id]);\n          if (children.length) throw Error('CATEGORY_HAS_CHILDREN');\n        }\n`;
    source = source.replace(marker, marker + guards);
  }

  return source;
});

edit('src/server/routes/catalog.ts', source => {
  source = source.replace(
    '  const [[countRow], [rows], refs] = await Promise.all([',
    '  const [[countRows], [rows], refs] = await Promise.all(['
  );
  source = source.replace(
    '  const total = Number(countRow?.total || 0);',
    '  const total = Number(countRows[0]?.total || 0);'
  );
  return source;
});

edit('src/server/routes/vehicles.ts', source => {
  if (!source.includes('type DbExecutor')) {
    source = source.replace(
      "  type CanonicalModelRow\n} from '../data-integrity';",
      "  type CanonicalModelRow,\n  type DbExecutor\n} from '../data-integrity';"
    );
  }
  source = source.replace(
    'const ensureActiveBrand = async (brandId: string, tx = pool): Promise<boolean> => {',
    'const ensureActiveBrand = async (brandId: string, tx: DbExecutor = pool): Promise<boolean> => {'
  );
  return source;
});

edit('scripts/smoke-test.ts', source => {
  source = source.replace(
    '  const selection = catalog.data.products.slice(0, 2).map(item => item.id);',
    `  const stage3ReferencedProductIds = new Set(catalog.data.products.flatMap((item: any) => [\n    ...(Array.isArray(item.complementPartIds) ? item.complementPartIds : []),\n    ...(Array.isArray(item.relatedPartIds) ? item.relatedPartIds : [])\n  ].map(String)));\n  const selection = catalog.data.products.filter(item => !stage3ReferencedProductIds.has(String(item.id))).slice(0, 2).map(item => item.id);\n  assert.equal(selection.length, 2, 'Bulk smoke needs two products that are not referenced by other active products.');`
  );
  return source;
});

console.log('v30.10.2 data-integrity wiring:', changed.length ? changed.join(', ') : 'already satisfied');
