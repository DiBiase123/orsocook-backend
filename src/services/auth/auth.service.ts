import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SECURITY_CONSTANTS } from '../../utils/auth/security.constants';
import {
  isValidEmail,
  validatePassword,
  generateRandomToken,
  isAccountLocked,
  resetLoginAttempts,
  incrementLoginAttempts
} from '../../utils/auth/security.utils';
import { sanitizeUser } from '../../utils/auth/sanitize.utils';
import { generateTokens } from '../../utils/auth/token.utils';
import { emailService } from '../email';
import { sessionService } from './session.service';  // <-- AGGIUNTA IMPORT

const prisma = new PrismaClient();

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  userAgent?: string;  // <-- AGGIUNTO
  ipAddress?: string;  // <-- AGGIUNTO
}

export interface AuthResult {
  success: boolean;
  message: string;
  data?: any;
  statusCode?: number;
}

export class AuthService {
  /**
   * Registra un nuovo utente con verifica email
   */
  async registerUser(data: RegisterData): Promise<AuthResult> {
    try {
      const { username, email, password } = data;

      // Validazione input
      if (!username || !email || !password) {
        return {
          success: false,
          message: 'Campi obbligatori mancanti',
          statusCode: 400
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          message: 'Formato email non valido',
          statusCode: 400
        };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message!,
          statusCode: 400
        };
      }

      // Verifica se utente esiste già
      const existingUser = await prisma.user.findFirst({
        where: { 
          OR: [{ email }, { username }] 
        }
      });

      if (existingUser) {
        const message = existingUser.email === email 
          ? 'Email già registrata' 
          : 'Username già in uso';
        return {
          success: false,
          message,
          statusCode: 400
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Genera token di verifica
      const emailToken = generateRandomToken();
      const emailTokenExpiry = new Date(Date.now() + SECURITY_CONSTANTS.EMAIL_TOKEN_EXPIRY_MS);

      // Crea utente non verificato
      const user = await prisma.user.create({
        data: { 
          username, 
          email, 
          passwordHash: hashedPassword,
          emailToken,
          emailTokenExpiry,
          isVerified: false
        },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          avatarUrl: true, 
          isVerified: true,
          createdAt: true 
        }
      });

      // Invia email di verifica
      const emailSent = await emailService.sendVerificationEmail(
        email, 
        emailToken, 
        username
      );

      if (!emailSent) {
        console.warn(`⚠️  Email di verifica non inviata per ${email}`);
      }

      return {
        success: true,
        message: 'Registrazione completata! Verifica la tua email per attivare l\'account.',
        data: { 
          user,
          requiresVerification: true,
          emailSent
        },
        statusCode: 201
      };

    } catch (error) {
      console.error('AuthService - registerUser error:', error);
      return {
        success: false,
        message: 'Errore durante la registrazione',
        statusCode: 500
      };
    }
  }

  /**
   * Verifica l'email di un utente
   */
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      if (!token) {
        return {
          success: false,
          message: 'Token mancante',
          statusCode: 400
        };
      }

      // Trova utente con token valido
      const user = await prisma.user.findFirst({
        where: {
          emailToken: token,
          emailTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Token di verifica non valido o scaduto',
          statusCode: 400
        };
      }

      // Verifica l'account
      const verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: { 
          isVerified: true,
          emailToken: null,
          emailTokenExpiry: null
        },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          avatarUrl: true, 
          isVerified: true,
          createdAt: true 
        }
      });

      // Genera token per login automatico
      const tokens = generateTokens(verifiedUser);

      return {
        success: true,
        message: '🎉 Account verificato con successo! Ora puoi accedere.',
        data: { 
          user: verifiedUser,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      };

    } catch (error) {
      console.error('AuthService - verifyEmail error:', error);
      return {
        success: false,
        message: 'Errore durante la verifica dell\'email',
        statusCode: 500
      };
    }
  }

  /**
   * Login utente con sicurezza
   */
  async loginUser(data: LoginData): Promise<AuthResult> {
    try {
      const { email, password, userAgent, ipAddress } = data;

      if (!email || !password) {
        return {
          success: false,
          message: 'Email e password obbligatorie',
          statusCode: 400
        };
      }

      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { sessions: true }
      });

      if (!user) {
        return {
          success: false,
          message: 'Credenziali non valide',
          statusCode: 401
        };
      }

      // Controlla se l'account è bloccato
      if (isAccountLocked(user)) {
        const lockTime = new Date(user.lockedUntil!).getTime() - Date.now();
        const minutesLeft = Math.ceil(lockTime / (60 * 1000));
        
        return {
          success: false,
          message: SECURITY_CONSTANTS.MESSAGES.ACCOUNT_LOCKED(minutesLeft),
          statusCode: 423,
          data: { locked: true, lockTime: minutesLeft }
        };
      }

      // Controlla se l'email è verificata
      if (!user.isVerified) {
        return {
          success: false,
          message: SECURITY_CONSTANTS.MESSAGES.EMAIL_NOT_VERIFIED,
          statusCode: 403,
          data: { 
            requiresVerification: true,
            email: user.email
          }
        };
      }

      // Verifica password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!passwordValid) {
        // Incrementa tentativi falliti
        const { locked, lockUntil, attemptsLeft } = await incrementLoginAttempts(user);
        
        if (locked) {
          const lockTime = new Date(lockUntil!).getTime() - Date.now();
          const minutesLeft = Math.ceil(lockTime / (60 * 1000));
          
          return {
            success: false,
            message: SECURITY_CONSTANTS.MESSAGES.TOO_MANY_ATTEMPTS(minutesLeft),
            statusCode: 423,
            data: { locked: true, lockTime: minutesLeft }
          };
        } else {
          return {
            success: false,
            message: SECURITY_CONSTANTS.MESSAGES.ATTEMPTS_LEFT(attemptsLeft),
            statusCode: 401,
            data: { attemptsLeft }
          };
        }
      }

      // Login riuscito - reset tentativi
      await resetLoginAttempts(user.id);

      const tokens = generateTokens(user);
      const userData = sanitizeUser(user);

      // Usa SessionService per gestire la sessione (CON NUOVI CAMPI)
      await sessionService.createOrUpdateSession({
        userId: user.id,
        refreshToken: tokens.refreshToken,
        userAgent,
        ipAddress
      });

      return {
        success: true,
        message: 'Login effettuato',
        data: { 
          user: userData, 
          token: tokens.accessToken, 
          refreshToken: tokens.refreshToken 
        }
      };

    } catch (error) {
      console.error('AuthService - loginUser error:', error);
      return {
        success: false,
        message: 'Errore durante il login',
        statusCode: 500
      };
    }
  }

  /**
   * Richiesta reset password
   */
  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      if (!email) {
        return {
          success: false,
          message: 'Email obbligatoria',
          statusCode: 400
        };
      }

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Per sicurezza, non rivelare se l'email esiste
        return {
          success: true,
          message: 'Se l\'email è registrata, riceverai istruzioni per il reset',
          data: { emailSent: false }
        };
      }

      // Genera token di reset
      const resetToken = generateRandomToken();
      const resetTokenExpiry = new Date(Date.now() + SECURITY_CONSTANTS.RESET_TOKEN_EXPIRY_MS);

      // Salva token nel database
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
      });

      // Invia email di reset
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.username
      );

      return {
        success: true,
        message: 'Se l\'email è registrata, riceverai istruzioni per il reset',
        data: { emailSent }
      };

    } catch (error) {
      console.error('AuthService - forgotPassword error:', error);
      return {
        success: false,
        message: 'Errore durante la richiesta di reset password',
        statusCode: 500
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResult> {
    try {
      if (!token || !password || !confirmPassword) {
        return {
          success: false,
          message: 'Token, password e conferma password obbligatori',
          statusCode: 400
        };
      }

      if (password !== confirmPassword) {
        return {
          success: false,
          message: 'Le password non corrispondono',
          statusCode: 400
        };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message!,
          statusCode: 400
        };
      }

      // Trova utente con token valido
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Token di reset non valido o scaduto',
          statusCode: 400
        };
      }

      // Hash nuova password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Aggiorna password e pulisci token
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          loginAttempts: 0,
          lockedUntil: null
        }
      });

      return {
        success: true,
        message: '🎉 Password reimpostata con successo! Ora puoi accedere con la nuova password.'
      };

    } catch (error) {
      console.error('AuthService - resetPassword error:', error);
      return {
        success: false,
        message: 'Errore durante il reset della password',
        statusCode: 500
      };
    }
  }

  /**
   * Invia nuova email di verifica
   */
  async resendVerificationEmail(email: string): Promise<AuthResult> {
    try {
      if (!email) {
        return {
          success: false,
          message: 'Email obbligatoria',
          statusCode: 400
        };
      }

      const user = await prisma.user.findUnique({ 
        where: { email },
        select: { id: true, username: true, email: true, isVerified: true }
      });

      if (!user) {
        // Per sicurezza, non rivelare se l'email esiste
        return {
          success: true,
          message: 'Se l\'email è registrata, riceverai una nuova email di verifica',
          data: { emailSent: false }
        };
      }

      if (user.isVerified) {
        return {
          success: false,
          message: 'Account già verificato',
          statusCode: 400
        };
      }

      // Genera nuovo token
      const emailToken = generateRandomToken();
      const emailTokenExpiry = new Date(Date.now() + SECURITY_CONSTANTS.EMAIL_TOKEN_EXPIRY_MS);

      // Aggiorna token nel database
      await prisma.user.update({
        where: { id: user.id },
        data: { emailToken, emailTokenExpiry }
      });

      // Invia email
      const emailSent = await emailService.sendVerificationEmail(
        email,
        emailToken,
        user.username
      );

      return {
        success: true,
        message: 'Nuova email di verifica inviata',
        data: { emailSent }
      };

    } catch (error) {
      console.error('AuthService - resendVerificationEmail error:', error);
      return {
        success: false,
message: 'Errore durante l\'invio della nuova email di verifica',
        statusCode: 500
      };
    }
  }
}

// Esporta un'istanza singleton
export const authService = new AuthService();