import { Request, Response } from 'express';
import Logger from '../../../utils/logger';
import { sessionService } from '../../../services/auth/session_service';
import { generateRefreshToken } from '../utils/auth_helpers';
import { validateRefreshToken } from '../validators/auth_validators';  // <-- IMPORT CORRETTO

export async function refreshTokenStrategy(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    // Validazione refresh token
    const validation = validateRefreshToken(refreshToken);
    if (!validation.valid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        message: validation.message
      });
    }

    const result = await sessionService.refreshAccessToken(refreshToken);
    
    if (result.success && result.data) {
      // Genera un NUOVO refresh token (rotazione)
      const newRefreshToken = generateRefreshToken(result.data.user.id);
      
      // Aggiorna la sessione con il nuovo refresh token
      await sessionService.updateSessionRefreshToken(
        result.data.user.id,
        newRefreshToken
      );
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          token: result.data.accessToken,
          refreshToken: newRefreshToken,
          user: result.data.user
        }
      });
    } else {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    Logger.error('Refresh token strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante il refresh del token' 
    });
  }
}