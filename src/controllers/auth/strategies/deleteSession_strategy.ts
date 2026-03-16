import { Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { sessionService } from '../../../services/auth/session_service';
import { validateAuthenticated } from '../validators/auth_validators';

export async function deleteSessionStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    const { sessionId } = req.params;
    const { refreshToken } = req.body;
    
    // TODO: Implementare logica per eliminare sessione specifica
    // Per ora usiamo deleteSessionByToken se c'è refreshToken
    if (refreshToken) {
      await sessionService.deleteSessionByToken(refreshToken);
    }
    
    return res.json({
      success: true,
      message: 'Sessione eliminata'
    });

  } catch (error) {
    Logger.error('Delete session strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'eliminazione della sessione' 
    });
  }
}