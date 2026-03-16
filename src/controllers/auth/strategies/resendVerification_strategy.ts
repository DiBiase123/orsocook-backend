import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Logger from '../../../utils/logger';
import { emailService } from '../../../services/email';
import { generateRandomToken } from '../utils/auth_helpers';
import { validateEmail } from '../validators/auth_validators';  

const prisma = new PrismaClient();
const EMAIL_TOKEN_EXPIRY = parseInt(process.env.EMAIL_TOKEN_EXPIRY_HOURS || '24') * 60 * 60 * 1000;

export async function resendVerificationStrategy(req: Request, res: Response) {
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

    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, username: true, email: true, isVerified: true }
    });

    if (!user) {
      // Per sicurezza, non rivelare se l'email esiste
      return res.json({
        success: true,
        message: 'Se l\'email è registrata, riceverai una nuova email di verifica',
        data: { emailSent: false }
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account già verificato' 
      });
    }

    // Genera nuovo token
    const emailToken = generateRandomToken();
    const emailTokenExpiry = new Date(Date.now() + EMAIL_TOKEN_EXPIRY);

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

    return res.json({
      success: true,
      message: 'Nuova email di verifica inviata',
      data: { emailSent }
    });

  } catch (error) {
    Logger.error('Resend verification strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'invio della nuova email di verifica' 
    });
  }
}