import { Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { userService } from '../../../services/user';
import { validateAuthenticated } from '../validators/auth_validators';

export async function updateProfileStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    const { username, ...otherFields } = req.body;
    
    // Usa userService che già esiste e ha la logica
    const updatedUser = await userService.updateProfile(req.user!.id, {
      username,
      ...otherFields
    });

    return res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: { user: updatedUser }
    });

  } catch (error) {
    Logger.error('Update profile strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'aggiornamento del profilo' 
    });
  }
}