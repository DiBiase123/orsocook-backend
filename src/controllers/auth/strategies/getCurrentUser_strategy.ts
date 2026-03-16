import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { validateAuthenticated } from '../validators/auth_validators';

const prisma = new PrismaClient();

export async function getCurrentUserStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        avatarUrl: true, 
        isVerified: true,
        createdAt: true, 
        updatedAt: true 
      }
    });

    return res.json({ 
      success: true, 
      data: user 
    });

  } catch (error) {
    Logger.error('Get current user strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
}