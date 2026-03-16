import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';

/**
 * Genera access token e refresh token per un utente
 */
export const generateTokens = (user: any) => ({
  accessToken: jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      isVerified: user.isVerified 
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  ),
  refreshToken: jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  )
});

/**
 * Genera un nuovo refresh token (rotazione)
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Sanitizza l'oggetto utente rimuovendo dati sensibili
 */
export const sanitizeUser = (user: any) => {
  const { 
    passwordHash, 
    emailToken, 
    emailTokenExpiry, 
    resetToken, 
    resetTokenExpiry, 
    loginAttempts, 
    lockedUntil, 
    ...safeUser 
  } = user;
  return safeUser;
};

/**
 * Verifica se l'account è bloccato
 */
export const isAccountLocked = (user: any): boolean => {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil) > new Date();
};

/**
 * Calcola i minuti rimanenti di blocco
 */
export const getLockTimeMinutes = (lockedUntil: Date): number => {
  const lockTime = new Date(lockedUntil).getTime() - Date.now();
  return Math.ceil(lockTime / (60 * 1000));
};

/**
 * Genera un token casuale per verifica email/reset password
 */
export const generateRandomToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};