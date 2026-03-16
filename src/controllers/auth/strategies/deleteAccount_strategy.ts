import { Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { userService } from '../../../services/user';
import { validateAuthenticated } from '../validators/auth_validators';

export async function deleteAccountStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    // Usa userService che già esiste e ha la logica
    const deleted = await userService.deleteAccount(req.user!.id);

    if (deleted) {
      return res.json({
        success: true,
        message: 'Account eliminato con successo'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Errore durante l\'eliminazione dell\'account'
      });
    }

  } catch (error) {
    Logger.error('Delete account strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'eliminazione dell\'account' 
    });
  }
}