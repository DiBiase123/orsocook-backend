// app_ricette_backend/src/controllers/auth/sessions.controller.ts
import { Request, Response } from 'express';
import { sessionService } from '../../services/auth/session.service';
import { authService } from '../../services/auth/auth.service';

/**
 * Controller per la gestione delle sessioni e token
 */

export class SessionsController {
  /**
   * Refresh access token usando refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ 
          success: false, 
          message: 'Refresh token mancante' 
        });
        return;
      }

      const result = await sessionService.refreshAccessToken(refreshToken);
      
      res.status(result.statusCode || 200).json({
        success: result.success,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('SessionsController - refresh error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore interno del server' 
      });
    }
  }

  /**
   * Logout utente (elimina sessione)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await sessionService.deleteSessionByToken(refreshToken);
      }
      
      res.json({ 
        success: true, 
        message: 'Logout effettuato' 
      });
    } catch (error) {
      console.error('SessionsController - logout error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante il logout' 
      });
    }
  }

  /**
   * Recupera tutte le sessioni attive dell'utente
   */
  async getUserSessions(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      const sessions = await sessionService.getUserSessions(req.user.id);
      
      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      console.error('SessionsController - getUserSessions error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero delle sessioni' 
      });
    }
  }

  /**
   * Elimina una sessione specifica
   */
  async deleteSession(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      const { sessionId } = req.params;
      const { refreshToken } = req.body;
      
      // TODO: Implementare logica per eliminare sessione specifica
      // Per ora usiamo deleteSessionByToken se c'è refreshToken
      if (refreshToken) {
        await sessionService.deleteSessionByToken(refreshToken);
      }
      
      res.json({
        success: true,
        message: 'Sessione eliminata'
      });
    } catch (error) {
      console.error('SessionsController - deleteSession error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante l\'eliminazione della sessione' 
      });
    }
  }

  /**
   * Elimina tutte le sessioni dell'utente (logout da tutti i dispositivi)
   */
  async logoutAll(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      await sessionService.deleteAllUserSessions(req.user.id);
      
      res.json({
        success: true,
        message: 'Logout effettuato da tutti i dispositivi'
      });
    } catch (error) {
      console.error('SessionsController - logoutAll error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante il logout globale' 
      });
    }
  }
}

// Esporta un'istanza singleton
export const sessionsController = new SessionsController();