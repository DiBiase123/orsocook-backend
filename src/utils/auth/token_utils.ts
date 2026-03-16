import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orso_secret_cambiami';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'orso_refresh_secret_cambiami';

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
}

/**
 * Genera entrambi i token (access + refresh)
 */
export const generateTokens = (user: any): { accessToken: string; refreshToken: string } => {
  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    isVerified: user.isVerified
  };
  
  return {
    accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }),
    refreshToken: jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' })
  };
};

/**
 * Genera solo access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Genera solo refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Verifica access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Verifica refresh token
 */
export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
};

/**
 * Decodifica token senza verifica (per debugging)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

/**
 * Calcola il tempo rimanente prima della scadenza del token
 */
export const getTokenRemainingTime = (token: string): number | null => {
  try {
    const decoded: any = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    const expiryTime = decoded.exp * 1000; // Converti in millisecondi
    const currentTime = Date.now();
    
    return Math.max(0, expiryTime - currentTime);
  } catch {
    return null;
  }
};