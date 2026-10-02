import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from './config';

interface PaymentTokenPayload extends JwtPayload {
  orderId: string;
  orderNumber: string;
  purpose: 'payment';
}

export const issuePaymentToken = (orderId: string, orderNumber: string): string =>
  jwt.sign(
    { orderId, orderNumber, purpose: 'payment' } satisfies Omit<PaymentTokenPayload, keyof JwtPayload>,
    config.jwtSecret,
    {
      expiresIn: '30m',
      issuer: 'chinpart',
      audience: 'chinpart-payment'
    }
  );

export const verifyPaymentToken = (
  token: string,
  orderId: string,
  orderNumber?: string
): boolean => {
  if (!token) return false;
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: 'chinpart',
      audience: 'chinpart-payment'
    }) as PaymentTokenPayload;
    return (
      payload.purpose === 'payment' &&
      payload.orderId === orderId &&
      (!orderNumber || payload.orderNumber === orderNumber)
    );
  } catch {
    return false;
  }
};
