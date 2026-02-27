import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import Logger from '../../utils/logger';

const prisma = new PrismaClient();

// GET /api/recipes/:id/likes/count
export async function getRecipeLikesCount(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const count = await prisma.like.count({ where: { recipeId: id } });
    res.json({ success: true, data: { count } });
  } catch (error) {
    Logger.error('Error getting likes count', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero del conteggio likes',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// GET /api/recipes/:id/liked
export async function checkRecipeLiked(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const like = await prisma.like.findUnique({
      where: { userId_recipeId: { userId: req.user.id, recipeId: id } }
    });
    res.json({ success: true, data: { liked: !!like } });
  } catch (error) {
    Logger.error('Error checking if liked', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella verifica del like',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// POST /api/recipes/:id/like
export async function addLikeToRecipe(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    try {
      await prisma.like.create({
        data: { userId: req.user.id, recipeId: id }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.json({ 
          success: true, 
          message: 'Like già presente',
          data: { liked: true } 
        });
      }
      throw error;
    }

    res.status(201).json({ 
      success: true, 
      message: 'Like aggiunto',
      data: { liked: true } 
    });
  } catch (error) {
    Logger.error('Error adding like', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiunta del like',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// DELETE /api/recipes/:id/like
export async function removeLikeFromRecipe(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    try {
      await prisma.like.delete({
        where: { userId_recipeId: { userId: req.user.id, recipeId: id } }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.json({ 
          success: true, 
          message: 'Like non presente',
          data: { liked: false } 
        });
      }
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'Like rimosso',
      data: { liked: false } 
    });
  } catch (error) {
    Logger.error('Error removing like', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella rimozione del like',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// GET /api/recipes/:recipeId/favorite/check
export async function checkRecipeFavorite(req: AuthRequest, res: Response) {
  try {
    const { recipeId } = req.params;
    const favorite = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: req.user.id, recipeId } }
    });
    res.json({ success: true, data: { isFavorite: !!favorite } });
  } catch (error) {
    Logger.error('Error checking favorite', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella verifica del preferito',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}
