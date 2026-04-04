import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orso_secret_cambiami';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'orso_refresh_secret_cambiami';

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
}

export const generateTokens = (user: any): { accessToken: string; refreshToken: string } => {
  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    isVerified: user.isVerified
  };
  
  return {
    accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '6h' }),      // ← 6 ore
    refreshToken: jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '1d' }) // ← 1 giorno
  };
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '6h' }); // ← 6 ore
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '1d' }); // ← 1 giorno
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

export const getTokenRemainingTime = (token: string): number | null => {
  try {
    const decoded: any = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    return Math.max(0, expiryTime - currentTime);
  } catch {
    return null;
  }
};