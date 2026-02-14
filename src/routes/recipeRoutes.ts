import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getUserRecipes,
  getRecipeLikesCount,
  checkRecipeLiked,
  addLikeToRecipe,
  removeLikeFromRecipe,
  uploadRecipeImage,
  getRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  removeRecipeImage 
} from '../controllers/recipe.controller';

import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
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

// ==================== PROTECTED ROUTES (CRUD) ====================
router.post('/', authenticateToken, upload.single('image'), createRecipe);
router.put('/:id', authenticateToken, upload.single('image'), updateRecipe);
router.delete('/:id', authenticateToken, deleteRecipe);
router.get('/user/:userId', authenticateToken, getUserRecipes);

// ==================== UPLOAD IMMAGINE (semplificata come le altre) ====================
router.post('/:id/upload-image', authenticateToken, upload.single('image'), uploadRecipeImage);

// ==================== RIMOZIONE IMMAGINE ====================
router.delete('/:id/remove-image', authenticateToken, removeRecipeImage);

// ==================== LIKES ====================
router.get('/:id/liked', authenticateToken, checkRecipeLiked);
router.post('/:id/like', authenticateToken, addLikeToRecipe);
router.delete('/:id/like', authenticateToken, removeLikeFromRecipe);

// ==================== COMMENTI ====================
router.post('/:id/comments', authenticateToken, createComment);

export default router;