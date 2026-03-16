import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { addCountsToRecipes } from '../recipe_helpers';

const prisma = new PrismaClient();

export async function getUserRecipesStrategy(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Ottieni totale e ricette in parallelo
    const [total, recipes] = await Promise.all([
      prisma.recipe.count({ 
        where: { authorId: userId } 
      }),
      prisma.recipe.findMany({
        where: { authorId: userId },
        skip,
        take: limitNum,
        include: {
          author: { 
            select: { 
              id: true, 
              username: true, 
              email: true, 
              avatarUrl: true 
            } 
          },
          category: { 
            select: { 
              id: true, 
              name: true, 
              slug: true 
            } 
          },
          tags: { 
            include: { 
              tag: true 
            } 
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Aggiungi conteggi (like, favorite, comment)
    const recipesWithCounts = await addCountsToRecipes(recipes);

    res.json({
      success: true,
      data: {
        recipes: recipesWithCounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    Logger.error('Error fetching user recipes', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel caricamento delle ricette dell\'utente',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}