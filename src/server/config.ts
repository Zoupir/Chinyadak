const requireValue = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const asPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: asPositiveInt(process.env.PORT, 3000),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  trustProxy: asPositiveInt(process.env.TRUST_PROXY, 1),
  db: {
    host: requireValue('DB_HOST', 'localhost'),
    port: asPositiveInt(process.env.DB_PORT, 3306),
    name: requireValue('DB_NAME'),
    user: requireValue('DB_USER'),
    password: requireValue('DB_PASSWORD'),
    connectionLimit: asPositiveInt(process.env.DB_CONNECTION_LIMIT, 10)
  },
  jwtSecret: requireValue('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'chinpart_session',
  bootstrapAdmin: {
    username: process.env.ADMIN_BOOTSTRAP_USER || 'admin',
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
    fullName: process.env.ADMIN_BOOTSTRAP_NAME || 'مدیر سیستم'
  }
};

if (config.nodeEnv === 'production' && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}
