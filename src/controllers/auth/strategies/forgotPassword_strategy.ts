import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Logger from '../../../utils/logger';
import { emailService } from '../../../services/email';
import { generateRandomToken } from '../utils/auth_helpers';
import { validateEmail } from '../validators/auth_validators';  

const prisma = new PrismaClient();
const RESET_TOKEN_EXPIRY = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60') * 60 * 1000;

export async function forgotPasswordStrategy(req: Request, res: Response) {
  try {
    const { email } = req.body;

    // Validazione email
    const validation = validateEmail(email);
    if (!validation.valid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.message
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email non registrata',
        data: { emailNotFound: true }
      });
    }

    // Genera token di reset
    const resetToken = generateRandomToken();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);

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

    return res.json({
      success: true,
      message: 'Email inviata! Controlla la tua casella di posta.',
      data: { emailSent }
    });

  } catch (error) {
    Logger.error('Forgot password strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante la richiesta di reset password' 
    });
  }
}