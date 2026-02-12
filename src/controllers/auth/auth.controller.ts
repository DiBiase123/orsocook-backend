import { Request, Response } from 'express';
import { authService } from '../../services/auth/auth.service';

/**
 * Controller per l'autenticazione (registrazione, login, verifica email, password)
 */

export class AuthController {
  /**
   * Registrazione nuovo utente con verifica email
   */
  async register(req: Request, res: Response): Promise<void> {
    const { username, email, password } = req.body;
    
    const result = await authService.registerUser({
      username,
      email,
      password
    });
    
    res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  }

  /**
   * Verifica email utente
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    
    const result = await authService.verifyEmail(token);
    
    res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  }

  /**
   * Login utente
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    
    // Estrai userAgent e ipAddress dalla request
    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    const result = await authService.loginUser({
      email,
      password,
      userAgent: userAgent as string | undefined,
      ipAddress: ipAddress as string | undefined
    });
    
    res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  }

  /**
   * Richiesta reset password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    
    const result = await authService.forgotPassword(email);
    
    res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  }

  /**
   * Reset password con token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    const result = await authService.resetPassword(token, password, confirmPassword);
    
    res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  }

  /**
   * Invia nuova email di verifica
   */
  async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    
    const result = await authService.resendVerificationEmail(email);
    
    res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  }
}

// Esporta un'istanza singleton
export const authController = new AuthController();