import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { uploadImageToCloudinary } from '../../../services/cloudinary_service';
import { 
  validateAuthenticated, 
  validateAvatarFile    // <-- AGGIUNTO
} from '../validators/auth_validators';

const prisma = new PrismaClient();

export async function updateAvatarStrategy(req: AuthRequest, res: Response) {
  try {
    Logger.debug('🔄 [updateAvatar] Starting avatar update process');
    
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    // Validazione file
    const fileValidation = validateAvatarFile(req.file);
    if (!fileValidation.valid) {
      return res.status(fileValidation.statusCode || 400).json({
        success: false,
        message: fileValidation.message
      });
    }

    Logger.debug('📄 [updateAvatar] File details:', {
      originalname: req.file!.originalname,
      mimetype: req.file!.mimetype,
      size: req.file!.size,
      bufferLength: req.file!.buffer?.length || 0
    });

    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    // Upload a Cloudinary nella cartella 'orsocook/avatars'
    Logger.debug('📤 [updateAvatar] Uploading to Cloudinary...');
    const fileBuffer = req.file!.buffer;
    
    const imageUrl = await uploadImageToCloudinary(fileBuffer, 'orsocook/avatars');
    Logger.debug(`✅ [updateAvatar] Avatar uploaded to Cloudinary: ${imageUrl}`);

    // Aggiorna URL nel database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        avatarUrl: imageUrl,
        updatedAt: new Date() 
      },
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
      message: '🎉 Avatar aggiornato con successo!',
      data: { user: updatedUser }
    });

  } catch (error) {
    Logger.error('❌ [updateAvatar] Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'aggiornamento dell\'avatar',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}