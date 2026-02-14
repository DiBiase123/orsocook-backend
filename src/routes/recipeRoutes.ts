import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getUserRecipes,
  // LIKE FUNCTIONS
  getRecipeLikesCount,
  checkRecipeLiked,
  addLikeToRecipe,
  removeLikeFromRecipe,
  // UPLOAD IMAGE FUNCTION
  uploadRecipeImage,
  // NEW: COMMENT FUNCTIONS
  getRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  removeRecipeImage 
} from '../controllers/recipe.controller';

// @ts-ignore - Ignora errore tipo multer
import multer from 'multer';

// ✅ CONFIGURAZIONE MULTER CON LIMITI AUMENTATI
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per i file
    fieldSize: 50 * 1024 * 1024, // 50MB per i campi
  },
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse'));
    }
  }
});

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get('/', getRecipes);
router.get('/:id', getRecipeById);
router.get('/:id/likes', getRecipeLikesCount);
router.get('/:id/comments', getRecipeComments);

// ==================== UPLOAD IMMAGINE - VERSIONE FINALE ====================
router.post('/:id/upload-image', 
  (req, res, next) => {
    upload.single('image')(req, res, async (err: any) => {
      if (err) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }

      // 🔥 Estrai token dall'header e verifica manualmente
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token mancante' 
        });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        (req as any).user = decoded;
        next();
      } catch (error) {
        return res.status(403).json({ 
          success: false, 
          message: 'Token non valido' 
        });
      }
    });
  },
  uploadRecipeImage
);

// ==================== RIMOZIONE IMMAGINE ====================
router.delete('/:id/remove-image', authenticateToken, removeRecipeImage);

// ==================== LIKES ====================
router.get('/:id/liked', authenticateToken, checkRecipeLiked);
router.post('/:id/like', authenticateToken, addLikeToRecipe);
router.delete('/:id/like', authenticateToken, removeLikeFromRecipe);

// ==================== COMMENTI ====================
router.post('/:id/comments', authenticateToken, createComment);

export default router;