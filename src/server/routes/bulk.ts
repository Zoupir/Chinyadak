import { Router } from 'express';
import { requireAdminPermission, type AuthenticatedRequest } from '../auth';
import { pool, withTransaction, refundOrderLoyalty, type RowDataPacket } from '../db';

const definitions: Record<string, { table?: string; title: string; permission: string; active?: string; field?: string; setting?: string; flag?: string }> = {
  products: { table: 'products', title: 'name_fa', permission: 'canManageProducts', active: 'status' },
  categories: { table: 'categories', title: 'name_fa', permission: 'canManageProducts', active: 'is_active' },
  articles: { table: 'articles', title: 'title', permission: 'canManageArticles', active: 'is_active' },
  article_categories: { table: 'article_categories', title: 'name', permission: 'canManageArticles' },
  pages: { table: 'site_pages', title: 'title', permission: 'canManageSettings' },
  sliders: { table: 'sliders', title: "JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.title'))", permission: 'canManageSliders', active: 'is_active' },
  brands: { table: 'vehicle_brands', title: 'name_fa', permission: 'canManageVehicles', active: 'is_active' },
  models: { table: 'vehicle_models', title: 'name_fa', permission: 'canManageVehicles', active: 'is_active' },
  customers: { table: 'customers', title: "CONCAT(first_name,' ',last_name)", permission: 'canManageOrders', active: 'status' },
  admins: { table: 'admin_users', title: 'full_name', permission: 'canManageAdmins', active: 'is_active' },
  orders: { table: 'orders', title: 'order_number', permission: 'canManageOrders', active: 'status' },
  navigation: { setting: 'site_settings', field: 'navigationMenus', title: 'title', flag: 'isVisible', permission: 'canManageSettings' },
  parts_brands: { setting: 'site_settings', field: 'popularPartsBrands', title: 'nameFa', flag: 'isVisible', permission: 'canManageProducts' },
  menus: { setting: 'site_settings', field: 'headerMenus', title: 'title', flag: 'isVisible', permission: 'canManageSettings' },
  shipping: { setting: 'site_settings', field: 'shippingMethods', title: 'title', flag: 'enabled', permission: 'canManageSettings' },
  gateways: { setting: 'payment_gateways', title: 'title', flag: 'isActive', permission: 'canManageSettings' },
  banners: { setting: 'site_settings', field: 'bannerPlacements', title: 'title', flag: 'isVisible', permission: 'canManageSettings' }
};
const parse = (v: any) => typeof v === 'string' ? JSON.parse(v) : v;
export const bulkRouter = Router();
bulkRouter.use('/:kind', (req, res, next) => {
  const d = definitions[req.params.kind];
  if (!d) { res.status(404).json({ error: 'BULK_KIND_INVALID' }); return; }
  return requireAdminPermission(d.permission)(req as AuthenticatedRequest, res, next);
});
bulkRouter.get('/:kind', async (req, res) => {
  const d = definitions[req.params.kind];
  const q = String(req.query.q || '').slice(0, 200);
  const offset = Math.max(0, Math.floor(Number(req.query.offset) || 0));
  const trash = req.query.trash === '1';
  if (!d.table) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT setting_value FROM app_settings WHERE setting_key = ?', [d.setting!]);
    const data = rows[0] ? parse(rows[0].setting_value) : {};
    const items = (d.field ? data[d.field] : data) || [];
    const filtered = (Array.isArray(items) ? items : []).filter(item => Boolean(item.__trashed) === trash && String(item[d.title] || item.title || item.nameFa || item.name || item.id).includes(q));
    res.json({ total: filtered.length, items: filtered.slice(offset, offset + 100).map(item => ({ id: item.id, title: item[d.title] || item.title || item.nameFa || item.name || item.id, active: item[d.flag!] !== false })) }); return;
  }
  const where = `${d.title} LIKE ? AND ${trash ? '' : 'NOT '}EXISTS (SELECT 1 FROM admin_trash t WHERE t.entity_kind = ? AND t.entity_id = r.id)`;
  const [count] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) total FROM ${d.table} r WHERE ${where}`, ['%' + q + '%', req.params.kind]);
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT id, ${d.title} title FROM ${d.table} r WHERE ${where} ORDER BY id LIMIT 100 OFFSET ${offset}`, ['%' + q + '%', req.params.kind]);
  res.json({ items: rows, total: Number(count[0].total) });
});
bulkRouter.post('/:kind', async (req: AuthenticatedRequest, res) => {
  const kind = req.params.kind, d = definitions[kind];
  const ids = [...new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map(String))] as string[];
  const action = String(req.body?.action || '');
  if (!ids.length || ids.length > 500 || !['activate','deactivate','trash','restore','delete'].includes(action)) { res.status(400).json({ error: 'BULK_SELECTION_INVALID' }); return; }
  try {
    const changed = await withTransaction(async tx => {
      if (!d.table) {
        const [rows] = await tx.query<RowDataPacket[]>('SELECT setting_value FROM app_settings WHERE setting_key = ? FOR UPDATE', [d.setting!]);
        const data = rows[0] ? parse(rows[0].setting_value) : {};
        let list = d.field ? data[d.field] || [] : (Array.isArray(data) ? data : []);
        let count = 0;
        list = list.filter((item: any) => {
          if (!ids.includes(String(item.id))) return true;
          count++;
          if (action === 'delete') return false;
          if (action === 'trash') { item.__bulkPreviousFlag = item[d.flag!]; item.__trashed = true; item[d.flag!] = false; }
          else if (action === 'restore') { item[d.flag!] = item.__bulkPreviousFlag ?? true; delete item.__trashed; delete item.__bulkPreviousFlag; }
          else { if (item.__trashed) throw Error('RESTORE_REQUIRED'); item[d.flag!] = action === 'activate'; }
          return true;
        });
        if (d.field) data[d.field] = list;
        await tx.execute('UPDATE app_settings SET setting_value = ? WHERE setting_key = ?', [JSON.stringify(d.field ? data : list), d.setting!]);
        return count;
      }
      const [rows] = await tx.query<RowDataPacket[]>(`SELECT * FROM ${d.table} WHERE id IN (${ids.map(() => '?').join(',')}) FOR UPDATE`, ids);
      for (const row of rows) {
        if (row.is_system || (kind === 'admins' && row.id === req.auth?.sub)) throw Error('BULK_PROTECTED_RECORD');
        if (kind === 'admins' && row.role === 'super_admin' && ['deactivate','delete','trash'].includes(action)) { const [owners] = await tx.query<RowDataPacket[]>("SELECT id FROM admin_users WHERE role = 'super_admin' AND is_active = 1 FOR UPDATE"); if (owners.length <= 1) throw Error('LAST_SUPER_ADMIN'); }
        if (kind === 'products' && Number(row.reserved_stock) > 0 && ['trash','delete','deactivate'].includes(action)) throw Error('PRODUCT_HAS_ACTIVE_RESERVATIONS');
        if (kind === 'orders' && !['delete','deactivate'].includes(action)) throw Error('ORDERS_SUPPORT_CANCEL_OR_DELETE');
        if (kind === 'orders') {
          if (row.payment_status === 'initiated') throw Error('PAYMENT_IN_PROGRESS');
          await refundOrderLoyalty(tx, row.id, ['paid','paid_stock_review'].includes(row.payment_status));
          if (action === 'deactivate') { await tx.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [row.id]); continue; }
        }
        if (action === 'delete') {
          if (kind === 'brands') { const [linked] = await tx.query<RowDataPacket[]>('SELECT id FROM vehicle_models WHERE brand_id = ? LIMIT 1', [row.id]); if (linked.length) throw Error('BRAND_HAS_MODELS'); }
          if (kind === 'customers') { const [linked] = await tx.query<RowDataPacket[]>('SELECT id FROM orders WHERE customer_id = ? LIMIT 1', [row.id]); if (linked.length) throw Error('CUSTOMER_HAS_ORDERS'); }
          await tx.execute(`DELETE FROM ${d.table} WHERE id = ?`, [row.id]);
          await tx.execute('DELETE FROM admin_trash WHERE entity_kind = ? AND entity_id = ?', [kind, row.id]); continue;
        }
        if (action === 'restore') {
          const [saved] = await tx.query<RowDataPacket[]>('SELECT row_json FROM admin_trash WHERE entity_kind = ? AND entity_id = ?', [kind, row.id]);
          if (!saved[0]) continue;
          const previous = parse(saved[0].row_json);
          if (d.active) await tx.execute(`UPDATE ${d.table} SET ${d.active} = ? WHERE id = ?`, [previous[d.active], row.id]);
          if (row.data_json != null) { const current = parse(row.data_json); delete current.__trashed; current.isVisible = parse(previous.data_json).isVisible ?? true; current.isActive = parse(previous.data_json).isActive ?? true; await tx.execute(`UPDATE ${d.table} SET data_json = ? WHERE id = ?`, [JSON.stringify(current), row.id]); }
          await tx.execute('DELETE FROM admin_trash WHERE entity_kind = ? AND entity_id = ?', [kind, row.id]); continue;
        }
        const [archived] = await tx.query<RowDataPacket[]>('SELECT entity_id FROM admin_trash WHERE entity_kind = ? AND entity_id = ?', [kind, row.id]);
        if (archived.length && action !== 'trash') throw Error('RESTORE_REQUIRED');
        if (action === 'trash') await tx.execute('INSERT IGNORE INTO admin_trash (entity_kind, entity_id, row_json) VALUES (?, ?, ?)', [kind, row.id, JSON.stringify(row)]);
        if (d.active) await tx.execute(`UPDATE ${d.table} SET ${d.active} = ? WHERE id = ?`, [d.active === 'status' ? (action === 'activate' ? 'active' : 'inactive') : action === 'activate' ? 1 : 0, row.id]);
        if (row.data_json != null) { const data = parse(row.data_json); data.isActive = action === 'activate'; data.isVisible = action === 'activate'; if (action === 'trash') data.__trashed = true; await tx.execute(`UPDATE ${d.table} SET data_json = ? WHERE id = ?`, [JSON.stringify(data), row.id]); }
      }
      return rows.length;
    });
    res.json({ changed });
  } catch (error) { res.status(409).json({ error: String((error as Error).message) }); }
});
