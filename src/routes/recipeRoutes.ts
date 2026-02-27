import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { getUploadSignature } from '../controllers/upload.controller';
import {
  // Core
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getUserRecipes,
  
  // Likes
  getRecipeLikesCount,
  checkRecipeLiked,
  addLikeToRecipe,
  removeLikeFromRecipe,
  checkRecipeFavorite,
  
  // Comments
  getRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  
  // Images
  uploadRecipeImage,
  removeRecipeImage
} from '../controllers/recipe';

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

// ==================== DEBUG RAW BODY ====================
router.use('/:id/upload-image', (req, res, next) => {
  let data: Buffer[] = [];
  req.on('data', chunk => {
    data.push(chunk);
    console.log(`📦 Chunk ricevuto: ${chunk.length} bytes`);
  });
  req.on('end', () => {
    const total = Buffer.concat(data).length;
    console.log(`📦📦📦 TOTALE BYTES RICEVUTI: ${total}`);
    if (total === 0) {
      console.error('❌❌❌ BODY VUOTO!');
    }
    next();
  });
});

// ==================== UPLOAD IMMAGINE ====================
router.post('/:id/upload-image', authenticateToken, upload.single('image'), uploadRecipeImage);

// ==================== RIMOZIONE IMMAGINE ====================
router.delete('/:id/remove-image', authenticateToken, removeRecipeImage);

// ==================== LIKES ====================
router.get('/:id/liked', authenticateToken, checkRecipeLiked);
router.post('/:id/like', authenticateToken, addLikeToRecipe);
router.delete('/:id/like', authenticateToken, removeLikeFromRecipe);
router.get('/:id/favorite/check', authenticateToken, checkRecipeFavorite);

// ==================== COMMENTI ====================
router.post('/:id/comments', authenticateToken, createComment);
router.put('/comments/:commentId', authenticateToken, updateComment);
router.delete('/comments/:commentId', authenticateToken, deleteComment);

export default router;