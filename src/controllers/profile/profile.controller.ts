// app_ricette_backend/src/controllers/profile/profile.controller.ts
import { Request, Response } from 'express';
import { userService } from '../../services/user/user.service';

/**
 * Controller per la gestione del profilo utente
 */

export class ProfileController {
  /**
   * Recupera utente corrente (autenticato)
   */
  async getCurrentUser(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      const user = await userService.getCurrentUser(req.user.id);
      
      res.json({ 
        success: true, 
        data: user 
      });
    } catch (error) {
      console.error('ProfileController - getCurrentUser error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore interno del server' 
      });
    }
  }

  /**
   * Recupera profilo utente completo con statistiche
   */
  async getUserProfile(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      const userId = req.params.userId || req.user.id;
      
      // Controlla autorizzazione (solo il proprio profilo)
      if (req.user.id !== userId) {
        res.status(403).json({ 
          success: false, 
          message: 'Non autorizzato' 
        });
        return;
      }

      const profile = await userService.getUserProfile(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      console.error('ProfileController - getUserProfile error:', error);
      
      if (error.message === 'Utente non trovato') {
        res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Errore nel recupero del profilo' 
        });
      }
    }
  }

  /**
   * Aggiorna avatar utente
   */
  async updateAvatar(req: any, res: Response): Promise<void> {
    try {
      console.log('🔄 [ProfileController] Starting avatar update process');
      
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      if (!req.file) {
        console.log('❌ [ProfileController] No file provided by Multer');
        res.status(400).json({ 
          success: false, 
          message: 'Nessuna immagine fornita' 
        });
        return;
      }

      console.log('📄 [ProfileController] File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length || 0
      });

      const updatedUser = await userService.updateAvatar({
        userId: req.user.id,
        fileBuffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        size: req.file.size
      });

      res.json({
        success: true,
        message: '🎉 Avatar aggiornato con successo!',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('❌ [ProfileController] updateAvatar error:', error);
      
      const statusCode = error.message.includes('non valida') || 
                         error.message.includes('troppo grande') ? 400 : 500;
      
      res.status(statusCode).json({ 
        success: false, 
        message: error.message || 'Errore durante l\'aggiornamento dell\'avatar'
      });
    }
  }

  /**
   * Aggiorna profilo utente
   */
  async updateProfile(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      const { username, bio } = req.body;
      
      const updatedUser = await userService.updateProfile(req.user.id, {
        username,
        bio
      });

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('ProfileController - updateProfile error:', error);
      
      const statusCode = error.message.includes('Username già in uso') ? 400 : 500;
      
      res.status(statusCode).json({ 
        success: false, 
        message: error.message || 'Errore durante l\'aggiornamento del profilo'
      });
    }
  }

  /**
   * Elimina account utente
   */
  async deleteAccount(req: any, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          message: 'Utente non autenticato' 
        });
        return;
      }

      const { password } = req.body;
      
      if (!password) {
        res.status(400).json({ 
          success: false, 
          message: 'Password obbligatoria per eliminare l\'account' 
        });
        return;
      }

      // TODO: Verifica password prima di eliminare
      // const user = await userService.getCurrentUser(req.user.id);
      // const passwordValid = await bcrypt.compare(password, user.passwordHash);
      
      const deleted = await userService.deleteAccount(req.user.id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Account eliminato con successo'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Errore durante l\'eliminazione dell\'account'
        });
      }
    } catch (error: any) {
      console.error('ProfileController - deleteAccount error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Errore durante l\'eliminazione dell\'account'
      });
    }
  }
}

// Esporta un'istanza singleton
export const profileController = new ProfileController();