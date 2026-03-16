import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Logger from '../../../utils/logger';
import { emailService } from '../../../services/email';
import { generateRandomToken } from '../utils/auth_helpers';
import { validateRegisterInput } from '../validators/auth_validators';

const prisma = new PrismaClient();
const EMAIL_TOKEN_EXPIRY = parseInt(process.env.EMAIL_TOKEN_EXPIRY_HOURS || '24') * 60 * 60 * 1000;

export async function registerStrategy(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    // Validazione input
    const validation = validateRegisterInput(username, email, password);
    if (!validation.valid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.message
      });
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
      return res.status(400).json({ 
        success: false, 
        message 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Genera token di verifica
    const emailToken = generateRandomToken();
    const emailTokenExpiry = new Date(Date.now() + EMAIL_TOKEN_EXPIRY);

    // Crea utente NON verificato
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
      Logger.warn(`Email di verifica non inviata per ${email}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Registrazione completata! Verifica la tua email per attivare l\'account.',
      requiresVerification: true,
      data: { 
        user,
        requiresVerification: true,
        emailSent
      }
    });

  } catch (error) {
    Logger.error('Register strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante la registrazione' 
    });
  }
}