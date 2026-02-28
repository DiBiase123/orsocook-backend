import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import Logger from '../../utils/logger';
import { 
  processTags, 
  getRecipeWithCounts, 
  uploadImage, 
  addCountsToRecipes,
  generateUniqueSlug 
} from './recipe.helpers';

const prisma = new PrismaClient();

// GET /api/recipes
export async function getRecipes(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isPublic: true };
    if (category) where.category = { slug: String(category) };
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, recipes] = await Promise.all([
      prisma.recipe.count({ where }),
      prisma.recipe.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          author: { select: { id: true, username: true, email: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

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
    Logger.error('Error fetching recipes', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel caricamento delle ricette',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// GET /api/recipes/:id
export async function getRecipeById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.recipe.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    const recipe = await getRecipeWithCounts(id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Ricetta non trovata' });
    }

    res.json({ success: true, data: recipe });
  } catch (error) {
    Logger.error('Error fetching recipe', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel caricamento della ricetta',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// POST /api/recipes
export async function createRecipe(req: AuthRequest, res: Response) {
  try {
    Logger.debug('Creating recipe', { userId: req.user.id });
    
    const { 
      title, description, prepTime, cookTime, servings, difficulty,
      isPublic = true, categoryId, ingredients = [], instructions = [], tags = [],
      imageUrl
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Titolo e descrizione sono obbligatori' 
      });
    }

    let finalImageUrl: string | undefined = imageUrl;
    
    if (!finalImageUrl && req.file?.buffer) {
      try {
        Logger.debug('Uploading image for recipe (legacy method)');
        finalImageUrl = await uploadImage(
          req.file.buffer, 
          req.file.mimetype, 
          req.file.originalname
        );
      } catch (error) {
        Logger.error('Error uploading image', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Errore nel caricamento dell\'immagine',
          details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        });
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        slug: generateUniqueSlug(title),
        imageUrl: finalImageUrl,
        prepTime: Number(prepTime) || 0,
        cookTime: Number(cookTime) || 0,
        servings: Number(servings) || 1,
        difficulty,
        isPublic: isPublic === 'true' || isPublic === true,
        ingredients,
        instructions,
        author: { connect: { id: req.user.id } },
        category: categoryId ? { connect: { id: categoryId } } : undefined
      }
    });

    // 👈 AGGIUNGI QUI I LOG
console.log('🔍 RECIPE CREATA - categoryId dal body:', categoryId);
console.log('🔍 RECIPE CREATA - categoryId salvato:', recipe.categoryId);
console.log('🔍 RECIPE CREATA - ricetta completa:', recipe);

    if (tags?.length) {
      const processedTags = await processTags(tags);
      if (processedTags.length) {
        await prisma.recipeTag.createMany({
          data: processedTags.map(tag => ({
            recipeId: recipe.id,
            tagId: tag.id
          }))
        });
      }
    }

    const completeRecipe = await getRecipeWithCounts(recipe.id);
    if (!completeRecipe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero della ricetta creata' 
      });
    }

    Logger.info('Recipe created', { recipeId: recipe.id, userId: req.user.id, imageUrl: finalImageUrl });
    
    res.status(201).json({
      success: true,
      message: 'Ricetta creata con successo',
      data: completeRecipe
    });
  } catch (error) {
    Logger.error('Error creating recipe', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella creazione della ricetta',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// PUT /api/recipes/:id
export async function updateRecipe(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    Logger.debug('Updating recipe', { recipeId: id, userId: req.user.id });
    
    const { 
      title, description, prepTime, cookTime, servings, difficulty,
      isPublic, categoryId, ingredients, instructions, tags,
      imageUrl
    } = req.body;

    // 👈 PRIMO LOG - COSA ARRIVA DAL FRONTEND
    console.log('🔍 RECIPE UPDATE - categoryId dal body:', categoryId);

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!existingRecipe) {
      return res.status(404).json({ success: false, message: 'Ricetta non trovata' });
    }

    if (existingRecipe.authorId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non hai i permessi per modificare questa ricetta' 
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (prepTime !== undefined) updateData.prepTime = Number(prepTime);
    if (cookTime !== undefined) updateData.cookTime = Number(cookTime);
    if (servings !== undefined) updateData.servings = Number(servings);
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    if (categoryId !== undefined) {
      updateData.category = categoryId 
        ? { connect: { id: categoryId } }
        : { disconnect: true };
    }
    
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (instructions !== undefined) updateData.instructions = instructions;

    if (req.file?.buffer) {
      try {
        Logger.debug('Uploading new image for recipe (legacy)', { recipeId: id });
        updateData.imageUrl = await uploadImage(
          req.file.buffer, 
          req.file.mimetype, 
          req.file.originalname
        );
      } catch (error) {
        Logger.error('Error uploading image', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Errore nel caricamento dell\'immagine',
          details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        });
      }
    }

    // 👈 SECONDO LOG - PRIMA DI SALVARE
    console.log('🔍 RECIPE UPDATE - updateData prima del salvataggio:', updateData);

    await prisma.recipe.update({ where: { id }, data: updateData });

    // 👈 TERZO LOG - DOPO IL SALVATAGGIO
    const recipeDopo = await prisma.recipe.findUnique({
      where: { id },
      select: { id: true, title: true, categoryId: true }
    });
    console.log('🔍 RECIPE UPDATE - dopo salvataggio categoryId:', recipeDopo?.categoryId);

    if (tags !== undefined) {
      await prisma.recipeTag.deleteMany({ where: { recipeId: id } });
      
      if (tags?.length) {
        const processedTags = await processTags(tags);
        if (processedTags.length) {
          await prisma.recipeTag.createMany({
            data: processedTags.map(tag => ({
              recipeId: id,
              tagId: tag.id
            }))
          });
        }
      }
    }

    const updatedRecipe = await getRecipeWithCounts(id);
    if (!updatedRecipe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero della ricetta aggiornata' 
      });
    }

    Logger.info('Recipe updated', { recipeId: id, userId: req.user.id, imageUrl: updateData.imageUrl });
    
    res.json({
      success: true,
      message: 'Ricetta aggiornata con successo',
      data: updatedRecipe
    });
  } catch (error) {
    Logger.error('Error updating recipe', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento della ricetta',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// DELETE /api/recipes/:id
export async function deleteRecipe(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!existingRecipe) {
      return res.status(404).json({ success: false, message: 'Ricetta non trovata' });
    }

    if (existingRecipe.authorId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non hai i permessi per eliminare questa ricetta' 
      });
    }

    await prisma.recipe.delete({ where: { id } });

    Logger.info('Recipe deleted', { recipeId: id, userId: req.user.id });
    
    res.json({ success: true, message: 'Ricetta eliminata con successo' });
  } catch (error) {
    Logger.error('Error deleting recipe', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'eliminazione della ricetta',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// GET /api/recipes/user/:userId
export async function getUserRecipes(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [total, recipes] = await Promise.all([
      prisma.recipe.count({ where: { authorId: userId } }),
      prisma.recipe.findMany({
        where: { authorId: userId },
        skip,
        take: limitNum,
        include: {
          author: { select: { id: true, username: true, email: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

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
