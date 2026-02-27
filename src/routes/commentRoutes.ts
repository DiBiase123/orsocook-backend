import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getRecipeComments,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/recipe';

const router = express.Router();

// ==================== COMMENT ROUTES ====================
router.get('/:recipeId/comments', getRecipeComments);
router.post('/:recipeId/comments', authenticateToken, createComment);
router.put('/:commentId', authenticateToken, updateComment);
router.delete('/:commentId', authenticateToken, deleteComment);

export default router;