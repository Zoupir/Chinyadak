type LogMeta = Record<string, unknown>;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    };
  }
  return { message: String(error) };
};

export const logInfo = (event: string, meta: LogMeta = {}): void => {
  console.log(JSON.stringify({
    level: 'info',
    event,
    timestamp: new Date().toISOString(),
    ...meta
  }));
};

export const logError = (event: string, error: unknown, meta: LogMeta = {}): void => {
  console.error(JSON.stringify({
    level: 'error',
    event,
    timestamp: new Date().toISOString(),
    error: serializeError(error),
    ...meta
  }));
};
