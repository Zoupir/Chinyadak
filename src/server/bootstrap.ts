import { randomUUID } from 'crypto';
import { hashPassword } from './auth';
import { config } from './config';
import { pool, type RowDataPacket } from './db';

interface CountRow extends RowDataPacket {
  total: number;
}

export const bootstrapAdminIfNeeded = async (): Promise<void> => {
  const [rows] = await pool.query<CountRow[]>('SELECT COUNT(*) AS total FROM admin_users');
  if ((rows[0]?.total ?? 0) > 0) return;

  if (!config.bootstrapAdmin.password || config.bootstrapAdmin.password.length < 10) {
    throw new Error(
      'No administrator exists. Set ADMIN_BOOTSTRAP_PASSWORD to a strong password (10+ chars), then run db:init again.'
    );
  }

  const passwordHash = await hashPassword(config.bootstrapAdmin.password);
  const permissions = JSON.stringify({
    canManageProducts: true,
    canManageOrders: true,
    canManageArticles: true,
    canManageSliders: true,
    canManageSettings: true,
    canManageAdmins: true,
    canAccessSandbox: false,
    canManageVehicles: true
  });

  await pool.execute(
    `INSERT INTO admin_users
      (id, username, password_hash, full_name, role, permissions_json, is_active)
     VALUES (?, ?, ?, ?, 'super_admin', ?, 1)`,
    [
      randomUUID(),
      config.bootstrapAdmin.username.trim().toLowerCase(),
      passwordHash,
      config.bootstrapAdmin.fullName,
      permissions
    ]
  );
};
