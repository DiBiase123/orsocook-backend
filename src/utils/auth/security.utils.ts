import { PrismaClient } from '@prisma/client';
import { SECURITY_CONSTANTS } from './security.constants';

const prisma = new PrismaClient();

/**
 * Controlla se l'account è bloccato
 */
export const isAccountLocked = (user: any): boolean => {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil) > new Date();
};

/**
 * Calcola il tempo rimanente di blocco in minuti
 */
export const getRemainingLockTime = (lockedUntil: Date): number => {
  const lockTime = new Date(lockedUntil).getTime() - Date.now();
  return Math.ceil(lockTime / (60 * 1000));
};

/**
 * Resetta i tentativi di login dopo un login riuscito
 */
export const resetLoginAttempts = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { 
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date()
    }
  });
};

/**
 * Incrementa i tentativi di login e blocca se necessario
 * Restituisce informazioni sullo stato di blocco
 */
export const incrementLoginAttempts = async (user: any): Promise<{
  locked: boolean;
  lockUntil: Date | null;
  attemptsLeft: number;
}> => {
  const newAttempts = (user.loginAttempts || 0) + 1;
  const lockUntil = newAttempts >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS 
    ? new Date(Date.now() + SECURITY_CONSTANTS.ACCOUNT_LOCK_TIME_MS)
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      loginAttempts: newAttempts,
      lockedUntil: lockUntil
    }
  });

  return { 
    locked: lockUntil !== null, 
    lockUntil,
    attemptsLeft: SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS - newAttempts
  };
};

/**
 * Genera un token casuale per email o reset password
 */
export const generateRandomToken = (bytes: number = 32): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Valida il formato email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida la complessità password
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `La password deve essere di almeno ${SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH} caratteri`
    };
  }
  
  // Aggiungere altri criteri se necessario
  // if (!/[A-Z]/.test(password)) ...
  // if (!/[0-9]/.test(password)) ...
  
  return { valid: true };
};