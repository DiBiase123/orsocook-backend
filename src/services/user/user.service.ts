import { PrismaClient } from '@prisma/client';
import { uploadImageToCloudinary } from '../cloudinary.service';
import { sanitizeUser } from '../../utils/auth/sanitize.utils';

const prisma = new PrismaClient();

export interface UpdateAvatarData {
  userId: string;
  fileBuffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface UserProfile {
  user: any;
  stats: {
    recipesCount: number;
    favoritesCount: number;
    totalViews: number;
    averageViewsPerRecipe: number;
  };
  recentRecipes: any[];
  recentFavorites: any[];
}

export class UserService {
  /**
   * Recupera utente corrente
   */
  async getCurrentUser(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          avatarUrl: true, 
          isVerified: true,
          createdAt: true, 
          updatedAt: true 
        }
      });

      return user;
    } catch (error) {
      console.error('UserService - getCurrentUser error:', error);
      throw new Error('Errore nel recupero dell\'utente');
    }
  }

  /**
   * Recupera profilo utente completo con statistiche
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const [
        user,
        recipesCount,
        favoritesCount,
        recentRecipes,
        recentFavorites,
        recipesViewsResult
      ] = await Promise.all([
        // Utente
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
        
        // Conteggi
        prisma.recipe.count({ where: { authorId: userId } }),
        prisma.favorite.count({ where: { userId } }),
        
        // Ricette recenti
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
        
        // Preferiti recenti
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
        
        // Visualizzazioni totali
        prisma.recipe.aggregate({ 
          where: { authorId: userId }, 
          _sum: { views: true } 
        })
      ]);

      if (!user) {
        throw new Error('Utente non trovato');
      }

      const totalViews = recipesViewsResult._sum.views || 0;

      // Formatta le ricette recenti
      const formattedRecentRecipes = recentRecipes.map(recipe => ({
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
      }));

      // Formatta i preferiti recenti
      const formattedRecentFavorites = recentFavorites.map(fav => ({
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
      }));

      return {
        user,
        stats: {
          recipesCount,
          favoritesCount,
          totalViews,
          averageViewsPerRecipe: recipesCount > 0 ? Math.round(totalViews / recipesCount) : 0
        },
        recentRecipes: formattedRecentRecipes,
        recentFavorites: formattedRecentFavorites
      };

    } catch (error) {
      console.error('UserService - getUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Aggiorna l'avatar dell'utente
   */
  async updateAvatar(data: UpdateAvatarData): Promise<any> {
    try {
      console.log('🔄 [UserService] Starting avatar update process');

      const { userId, fileBuffer, mimetype, size } = data;

      // Validazione
      if (!mimetype.startsWith('image/') || size > 5 * 1024 * 1024) {
        throw new Error('Immagine non valida o troppo grande (max 5MB)');
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('File buffer è vuoto');
      }

      // Upload a Cloudinary
      console.log('📤 [UserService] Uploading to Cloudinary...');
      const imageUrl = await uploadImageToCloudinary(fileBuffer, 'orsocook/avatars');
      console.log('✅ [UserService] Avatar uploaded to Cloudinary:', imageUrl);

      // Aggiorna URL nel database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          avatarUrl: imageUrl,
          updatedAt: new Date() 
        },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          avatarUrl: true, 
          isVerified: true, 
          createdAt: true, 
          updatedAt: true 
        }
      });

      return updatedUser;

    } catch (error) {
      console.error('❌ [UserService] updateAvatar error:', error);
      throw error;
    }
  }

  /**
   * Recupera l'utente per ID (solo dati pubblici)
   */
  async getPublicUserProfile(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          username: true, 
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              recipes: true,
              favorites: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      return {
        ...user,
        recipesCount: user._count.recipes,
        favoritesCount: user._count.favorites
      };

    } catch (error) {
      console.error('UserService - getPublicUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Aggiorna i dati del profilo utente
   */
  async updateProfile(userId: string, data: Partial<{
    username: string;
    bio?: string;
  }>): Promise<any> {
    try {
      // Verifica se username è già in uso da un altro utente
      if (data.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: data.username,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          throw new Error('Username già in uso');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date()
        },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          avatarUrl: true, 
          isVerified: true,
          createdAt: true, 
          updatedAt: true 
        }
      });

      return updatedUser;

    } catch (error) {
      console.error('UserService - updateProfile error:', error);
      throw error;
    }
  }

  /**
   * Elimina account utente
   */
  async deleteAccount(userId: string): Promise<boolean> {
    try {
      // Prima elimina le dipendenze (sessioni, ricette, etc.)
      await prisma.$transaction([
        // Elimina sessioni
        prisma.session.deleteMany({
          where: { userId }
        }),
        
        // Elimina commenti
        prisma.comment.deleteMany({
          where: { userId }
        }),
        
        // Elimina likes
        prisma.like.deleteMany({
          where: { userId }
        }),
        
        // Elimina favorites
        prisma.favorite.deleteMany({
          where: { userId }
        }),
        
        // Per le ricette, potresti volerle mantenere ma disassociare
        // O eliminarle completamente
        prisma.recipe.deleteMany({
          where: { authorId: userId }
        }),
        
        // Infine elimina l'utente
        prisma.user.delete({
          where: { id: userId }
        })
      ]);

      return true;

    } catch (error) {
      console.error('UserService - deleteAccount error:', error);
      throw new Error('Errore durante l\'eliminazione dell\'account');
    }
  }
}

// Esporta un'istanza singleton
export const userService = new UserService();