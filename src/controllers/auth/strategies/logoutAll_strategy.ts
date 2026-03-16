import { Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { sessionService } from '../../../services/auth/session_service';
import { validateAuthenticated } from '../validators/auth_validators';

export async function logoutAllStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    await sessionService.deleteAllUserSessions(req.user!.id);
    
    return res.json({
      success: true,
      message: 'Logout effettuato da tutti i dispositivi'
    });

  } catch (error) {
    Logger.error('Logout all strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante il logout globale' 
    });
  }
}