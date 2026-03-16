import { Request, Response } from 'express';
import Logger from '../../../utils/logger';
import { sessionService } from '../../../services/auth/session_service';

export async function logoutStrategy(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await sessionService.deleteSessionByToken(refreshToken);
    }
    
    return res.json({ 
      success: true, 
      message: 'Logout effettuato' 
    });

  } catch (error) {
    Logger.error('Logout strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore durante il logout' 
    });
  }
}