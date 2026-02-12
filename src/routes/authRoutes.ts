// app_ricette_backend/src/routes/authRoutes.ts
import express from 'express';
import multer from 'multer';
import { 
  authController,
  profileController,
  sessionsController 
} from '../controllers';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ==================== CONFIGURAZIONE MULTER AVATAR ====================
const avatarUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per avatar
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 [MULTER FILTER] Checking file:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// ==================== PUBLIC ROUTES ====================

// Registrazione con verifica email
router.post('/register', (req: express.Request, res: express.Response) => 
  authController.register(req, res));
router.post('/register-with-verification', (req: express.Request, res: express.Response) => 
  authController.register(req, res));

// Login
router.post('/login', (req: express.Request, res: express.Response) => 
  authController.login(req, res));

// Refresh token
router.post('/refresh', (req: express.Request, res: express.Response) => 
  sessionsController.refresh(req, res));

// Logout
router.post('/logout', (req: express.Request, res: express.Response) => 
  sessionsController.logout(req, res));

// Verifica email
router.get('/verify-email/:token', (req: express.Request, res: express.Response) => 
  authController.verifyEmail(req, res));

// Richiesta reset password
router.post('/forgot-password', (req: express.Request, res: express.Response) => 
  authController.forgotPassword(req, res));

// Reset password con token
router.post('/reset-password/:token', (req: express.Request, res: express.Response) => 
  authController.resetPassword(req, res));

// Rinvia email di verifica
router.post('/resend-verification', (req: express.Request, res: express.Response) => 
  authController.resendVerificationEmail(req, res));

// ==================== PROTECTED ROUTES ====================

// Get current user
router.get('/me', authenticateToken, (req: any, res: express.Response) => 
  profileController.getCurrentUser(req, res));

// Get user profile
router.get('/profile/:userId', authenticateToken, (req: any, res: express.Response) => 
  profileController.getUserProfile(req, res));

// Session management
router.get('/sessions', authenticateToken, (req: any, res: express.Response) => 
  sessionsController.getUserSessions(req, res));
router.delete('/sessions/:sessionId', authenticateToken, (req: any, res: express.Response) => 
  sessionsController.deleteSession(req, res));
router.post('/logout-all', authenticateToken, (req: any, res: express.Response) => 
  sessionsController.logoutAll(req, res));

// Update profile
router.put('/profile', authenticateToken, (req: any, res: express.Response) => 
  profileController.updateProfile(req, res));

// Delete account
router.delete('/account', authenticateToken, (req: any, res: express.Response) => 
  profileController.deleteAccount(req, res));

// Avatar upload
router.put(
  '/avatar', 
  authenticateToken,
  
  // MIDDLEWARE DEBUG 1
  (req: any, res: any, next: any) => {
    console.log('🔍 [MULTER DEBUG 1] Avatar upload request received');
    console.log('🔍 [MULTER DEBUG 1] Headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
    });
    console.log('🔍 [MULTER DEBUG 1] Method:', req.method);
    console.log('🔍 [MULTER DEBUG 1] URL:', req.url);
    next();
  },
  
  avatarUpload.single('avatar'),
  
  // MIDDLEWARE DEBUG 2
  (req: any, res: any, next: any) => {
    console.log('🔍 [MULTER DEBUG 2] After Multer processing');
    console.log('🔍 [MULTER DEBUG 2] req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer ${req.file.buffer.length} bytes` : 'No buffer',
      path: req.file.path || 'No path (memory storage)'
    } : 'NO FILE - Multer did not process file');
    console.log('🔍 [MULTER DEBUG 2] req.body:', req.body);
    
    if (!req.file) {
      console.log('❌ [MULTER DEBUG 2] Multer did not process any file');
    }
    
    next();
  },
  
  (req: any, res: express.Response) => profileController.updateAvatar(req, res)
);

export default router;