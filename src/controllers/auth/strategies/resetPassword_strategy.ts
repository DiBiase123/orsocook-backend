import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Logger from '../../../utils/logger';
import { 
  validateToken, 
  validatePasswordReset 
} from '../validators/auth_validators';

const prisma = new PrismaClient();

export async function resetPasswordStrategy(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validazione token
    const tokenValidation = validateToken(token);
    if (!tokenValidation.valid) {
      return res.status(tokenValidation.statusCode || 400).json({
        success: false,
        message: tokenValidation.message
      });
    }

    // Validazione password
    const passwordValidation = validatePasswordReset(password, confirmPassword);
    if (!passwordValidation.valid) {
      return res.status(passwordValidation.statusCode || 400).json({
        success: false,
        message: passwordValidation.message
      });
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
      return res.status(400).json({ 
        success: false, 
        message: 'Token di reset non valido o scaduto' 
      });
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

    return res.json({
      success: true,
      message: '🎉 Password reimpostata con successo! Ora puoi accedere con la nuova password.'
    });

  } catch (error) {
    Logger.error('Reset password strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante il reset della password' 
    });
  }
}