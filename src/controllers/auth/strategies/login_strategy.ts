import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Logger from '../../../utils/logger';
import { sessionService } from '../../../services/auth/session_service';
import { 
  generateTokens, 
  sanitizeUser, 
  isAccountLocked, 
  getLockTimeMinutes 
} from '../utils/auth_helpers';
import { validateLoginInput } from '../validators/auth_validators';

const prisma = new PrismaClient();
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const ACCOUNT_LOCK_TIME = parseInt(process.env.ACCOUNT_LOCK_TIME_MINUTES || '15') * 60 * 1000;

export async function loginStrategy(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    // Validazione input
    const validation = validateLoginInput(email, password);
    if (!validation.valid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.message
      });
    }

    // Cerca utente
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { sessions: true }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }

    // Controlla se l'account è bloccato
    if (isAccountLocked(user)) {
      const minutesLeft = getLockTimeMinutes(user.lockedUntil!);
      return res.status(423).json({ 
        success: false, 
        message: `Account temporaneamente bloccato. Riprova tra ${minutesLeft} minuti.`,
        locked: true,
        lockTime: minutesLeft
      });
    }

    // Controlla se l'email è verificata
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Devi verificare la tua email prima di accedere.',
        requiresVerification: true,
        data: {
          requiresVerification: true,
          email: user.email
        }
      });
    }

    // Verifica password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordValid) {
      // Incrementa tentativi falliti
      const newAttempts = (user.loginAttempts || 0) + 1;
      const lockUntil = newAttempts >= MAX_LOGIN_ATTEMPTS 
        ? new Date(Date.now() + ACCOUNT_LOCK_TIME)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          loginAttempts: newAttempts,
          lockedUntil: lockUntil
        }
      });

      if (lockUntil) {
        const minutesLeft = getLockTimeMinutes(lockUntil);
        return res.status(423).json({ 
          success: false, 
          message: `Troppi tentativi falliti. Account bloccato per ${minutesLeft} minuti.`,
          locked: true,
          lockTime: minutesLeft
        });
      } else {
        const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;
        return res.status(401).json({ 
          success: false, 
          message: `Credenziali non valide. Tentativi rimasti: ${attemptsLeft}`,
          attemptsLeft
        });
      }
    }

    // Login riuscito - reset tentativi
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Genera token
    const tokens = generateTokens(user);
    const userData = sanitizeUser(user);

    // Crea/aggiorna sessione usando sessionService
    await sessionService.createOrUpdateSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      userAgent,
      ipAddress
    });

    return res.json({
      success: true,
      message: 'Login effettuato',
      data: { 
        user: userData, 
        token: tokens.accessToken, 
        refreshToken: tokens.refreshToken 
      }
    });

  } catch (error) {
    Logger.error('Login strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante il login' 
    });
  }
}