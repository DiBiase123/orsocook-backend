import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Logger from '../../../utils/logger';
import { generateTokens } from '../utils/auth_helpers';
import { validateToken } from '../validators/auth_validators';

const prisma = new PrismaClient();

export async function verifyEmailStrategy(req: Request, res: Response) {
  try {
    const { token } = req.params;

    // Validazione token
    const validation = validateToken(token);
    if (!validation.valid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.message
      });
    }

    // Trova utente con token valido e non scaduto
    const user = await prisma.user.findFirst({
      where: {
        emailToken: token,
        emailTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token di verifica non valido o scaduto' 
      });
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

    // Genera token per login automatico dopo verifica
    const tokens = generateTokens(verifiedUser);

    return res.json({
      success: true,
      message: '🎉 Account verificato con successo! Ora puoi accedere.',
      data: { 
        user: verifiedUser,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });

  } catch (error) {
    Logger.error('Verify email strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante la verifica dell\'email' 
    });
  }
}