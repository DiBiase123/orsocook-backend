import { Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { sessionService } from '../../../services/auth/session_service';
import { validateAuthenticated } from '../validators/auth_validators';

export async function getUserSessionsStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    const sessions = await sessionService.getUserSessions(req.user!.id);
    
    return res.json({
      success: true,
      data: { sessions }
    });

  } catch (error) {
    Logger.error('Get user sessions strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle sessioni' 
    });
  }
}