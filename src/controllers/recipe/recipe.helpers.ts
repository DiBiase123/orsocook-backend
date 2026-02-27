import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { uploadImageToCloudinary } from '../../services/cloudinary.service';
import Logger from '../../utils/logger';

const prisma = new PrismaClient();

// Process tags
export async function processTags(tags: any[]): Promise<{ id: string }[]> {
  if (!tags?.length) return [];

  const tagNames = tags
    .map(tag => {
      if (typeof tag === 'string') return tag.trim().toLowerCase();
      if (tag?.name) return tag.name.trim().toLowerCase();
      if (tag?.tag?.name) return tag.tag.name.trim().toLowerCase();
      if (tag?.tag && typeof tag.tag === 'string') return tag.tag.trim().toLowerCase();
      return '';
    })
    .filter(name => name);

  const processedTags = [];
  for (const name of tagNames) {
    try {
      let tag = await prisma.tag.findFirst({ where: { name } });
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name, slug: slugify(name, { lower: true }) }
        });
      }
      processedTags.push({ id: tag.id });
    } catch (error) {
      Logger.error(`Error processing tag "${name}"`, error);
    }
  }
  return processedTags;
}

// Get recipe with counts
export async function getRecipeWithCounts(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, email: true, avatarUrl: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: true } }
    }
  });

  if (!recipe) return null;

  const [favoriteCount, likeCount] = await Promise.all([
    prisma.favorite.count({ where: { recipeId: id } }),
    prisma.like.count({ where: { recipeId: id } })
  ]);

  return {
    ...recipe,
    favoriteCount,
    likeCount,
    isFavorite: false,
    isLiked: false
  };
}

// Upload image
export async function uploadImage(
  fileBuffer: Buffer, 
  mimetype?: string, 
  filename?: string
): Promise<string> {
  return await uploadImageToCloudinary(
    fileBuffer, 
    'orsocook/recipes', 
    mimetype, 
    filename
  );
}

// Add counts to recipes array
export async function addCountsToRecipes(recipes: any[]) {
  return await Promise.all(
    recipes.map(async recipe => {
      const [favoriteCount, likeCount] = await Promise.all([
        prisma.favorite.count({ where: { recipeId: recipe.id } }),
        prisma.like.count({ where: { recipeId: recipe.id } })
      ]);

      return {
        ...recipe,
        favoriteCount,
        likeCount,
        isFavorite: false,
        isLiked: false
      };
    })
  );
}

// Generate unique slug
export function generateUniqueSlug(title: string): string {
  const baseSlug = slugify(title, { lower: true });
  return `${baseSlug}-${Date.now()}`;
}
