import type { Request } from 'express';

export type SupportDiagnosticKind =
  | 'api_error'
  | 'server_error'
  | 'client_error'
  | 'client_rejection'
  | 'client_fetch_error'
  | 'client_fetch_exception';

export interface SupportDiagnosticEvent {
  id: number;
  at: string;
  kind: SupportDiagnosticKind;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  message?: string;
}

const MAX_EVENTS = 250;
const events: SupportDiagnosticEvent[] = [];
let nextId = 1;

const cleanText = (value: unknown, maxLength = 600): string | undefined => {
  const text = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text ? text.slice(0, maxLength) : undefined;
};

export const safeRequestPath = (value: unknown): string | undefined => {
  const raw = cleanText(value, 1200);
  if (!raw) return undefined;
  try {
    return new URL(raw, 'http://support.local').pathname.slice(0, 500);
  } catch {
    return raw.split('?')[0].slice(0, 500);
  }
};

export const recordSupportEvent = (
  event: Omit<SupportDiagnosticEvent, 'id' | 'at'>
): void => {
  const normalized: SupportDiagnosticEvent = {
    id: nextId++,
    at: new Date().toISOString(),
    kind: event.kind,
    method: cleanText(event.method, 20),
    path: safeRequestPath(event.path),
    status: Number.isInteger(event.status) ? event.status : undefined,
    durationMs: Number.isFinite(event.durationMs) ? Math.max(0, Math.round(event.durationMs!)) : undefined,
    message: cleanText(event.message)
  };

  events.push(normalized);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
};

export const recordFailedApiResponse = (req: Request, status: number, startedAt: number): void => {
  if (status < 400) return;
  recordSupportEvent({
    kind: 'api_error',
    method: req.method,
    path: req.originalUrl || req.url,
    status,
    durationMs: Date.now() - startedAt
  });
};

export const listSupportEvents = (limit = 150): SupportDiagnosticEvent[] => {
  const normalizedLimit = Math.min(MAX_EVENTS, Math.max(1, Math.floor(limit)));
  return events.slice(-normalizedLimit).reverse();
};

export const clearSupportEvents = (): void => {
  events.splice(0, events.length);
};
