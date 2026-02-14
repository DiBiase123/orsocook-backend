import express from 'express';
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

// ==================== PROTECTED ROUTES ====================
// CRUD Ricette
router.post('/', authenticateToken, upload.single('image'), createRecipe);
router.put('/:id', authenticateToken, upload.single('image'), updateRecipe);
router.delete('/:id', authenticateToken, deleteRecipe);
router.get('/user/:userId', authenticateToken, getUserRecipes);

router.post('/:id/upload-image', 
  (req, res, next) => {
    // ⬅️ Prima Multer, POI authenticateToken
    upload.single('image')(req, res, function (err: any) {
      if (err) {
        console.error('❌ MULTER ERROR:', err);
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  authenticateToken,  // ✅ AUTENTICAZIONE DOPO MULTER!
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