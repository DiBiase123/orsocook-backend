import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { 
  validateAuthenticated, 
  validateProfileAccess
} from '../validators/auth_validators';

const prisma = new PrismaClient();

export async function getUserProfileStrategy(req: AuthRequest, res: Response) {
  try {
    // Validazione autenticazione
    const authValidation = validateAuthenticated(req.user);
    if (!authValidation.valid) {
      return res.status(authValidation.statusCode || 401).json({
        success: false,
        message: authValidation.message
      });
    }

    const userId = req.params.userId;
    
    // Validazione accesso al profilo
    const accessValidation = validateProfileAccess(userId, req.user!.id);
    if (!accessValidation.valid) {
      return res.status(accessValidation.statusCode || 403).json({
        success: false,
        message: accessValidation.message
      });
    }

    const [user, recipesCount, favoritesCount, recentRecipes, recentFavorites, recipesViewsResult] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          avatarUrl: true, 
          createdAt: true, 
          updatedAt: true, 
          isVerified: true 
        }
      }),
      prisma.recipe.count({ where: { authorId: userId } }),
      prisma.favorite.count({ where: { userId } }),
      prisma.recipe.findMany({
        where: { authorId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          tags: { include: { tag: true } },
          favorites: { where: { userId }, select: { id: true } },
          _count: { select: { favorites: true, likes: true } }
        }
      }),
      prisma.favorite.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          recipe: {
            include: {
              category: true,
              tags: { include: { tag: true } },
              author: { 
                select: { 
                  id: true, 
                  username: true, 
                  email: true, 
                  avatarUrl: true, 
                  isVerified: true 
                } 
              },
              _count: { select: { favorites: true, likes: true } }
            }
          }
        }
      }),
      prisma.recipe.aggregate({ 
        where: { authorId: userId }, 
        _sum: { views: true } 
      })
    ]);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    const totalViews = recipesViewsResult._sum.views || 0;

    return res.json({
      success: true,
      data: {
        user,
        stats: {
          recipesCount,
          favoritesCount,
          totalViews,
          averageViewsPerRecipe: recipesCount > 0 ? Math.round(totalViews / recipesCount) : 0
        },
        recentRecipes: recentRecipes.map(recipe => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.imageUrl,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          views: recipe.views,
          createdAt: recipe.createdAt,
          category: recipe.category,
          tags: recipe.tags.map((t: any) => t.tag),
          favoriteCount: recipe._count.favorites,
          likeCount: recipe._count.likes,
          isFavorite: recipe.favorites.length > 0
        })),
        recentFavorites: recentFavorites.map(fav => ({
          id: fav.recipe.id,
          title: fav.recipe.title,
          description: fav.recipe.description,
          imageUrl: fav.recipe.imageUrl,
          prepTime: fav.recipe.prepTime,
          cookTime: fav.recipe.cookTime,
          difficulty: fav.recipe.difficulty,
          views: fav.recipe.views,
          createdAt: fav.recipe.createdAt,
          category: fav.recipe.category,
          tags: fav.recipe.tags.map((t: any) => t.tag),
          author: fav.recipe.author,
          favoriteCount: fav.recipe._count.favorites,
          likeCount: fav.recipe._count.likes,
          isFavorite: true
        }))
      }
    });

  } catch (error) {
    Logger.error('Get user profile strategy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero del profilo' 
    });
  }
}