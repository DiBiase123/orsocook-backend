import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  registerStrategy,
  loginStrategy,
  verifyEmailStrategy,
  forgotPasswordStrategy,
  resetPasswordStrategy,
  resendVerificationStrategy,
  refreshTokenStrategy,
  logoutStrategy,
  getCurrentUserStrategy,
  getUserProfileStrategy,
  updateAvatarStrategy,
  getUserSessionsStrategy,
  deleteSessionStrategy,
  logoutAllStrategy,
  updateProfileStrategy,   
  deleteAccountStrategy  
} from './strategies';

// ==================== AUTH ====================
export const register = (req: Request, res: Response) => registerStrategy(req, res);
export const login = (req: Request, res: Response) => loginStrategy(req, res);
export const verifyEmail = (req: Request, res: Response) => verifyEmailStrategy(req, res);
export const forgotPassword = (req: Request, res: Response) => forgotPasswordStrategy(req, res);
export const resetPassword = (req: Request, res: Response) => resetPasswordStrategy(req, res);
export const resendVerification = (req: Request, res: Response) => resendVerificationStrategy(req, res);
export const refresh = (req: Request, res: Response) => refreshTokenStrategy(req, res);
export const logout = (req: Request, res: Response) => logoutStrategy(req, res);

// ==================== PROFILO ====================
export const getCurrentUser = (req: AuthRequest, res: Response) => getCurrentUserStrategy(req, res);
export const getUserProfile = (req: AuthRequest, res: Response) => getUserProfileStrategy(req, res);
export const updateAvatar = (req: AuthRequest, res: Response) => updateAvatarStrategy(req, res);
export const updateProfile = (req: AuthRequest, res: Response) => updateProfileStrategy(req, res);
export const deleteAccount = (req: AuthRequest, res: Response) => deleteAccountStrategy(req, res);

// ==================== SESSIONI ====================
export const getUserSessions = (req: AuthRequest, res: Response) => getUserSessionsStrategy(req, res);
export const deleteSession = (req: AuthRequest, res: Response) => deleteSessionStrategy(req, res);
export const logoutAll = (req: AuthRequest, res: Response) => logoutAllStrategy(req, res);

// ==================== EXPORT COMPATTO ====================
export default {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  refresh,
  logout,
  getCurrentUser,
  getUserProfile,
  updateAvatar,
  updateProfile,      // <-- NUOVO
  deleteAccount,       // <-- NUOVO
  getUserSessions,
  deleteSession,
  logoutAll
};