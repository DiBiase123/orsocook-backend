// app_ricette_backend/src/controllers/recipe/strategies/createRecipe_strategy.ts

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { 
  processTags, 
  getRecipeWithCounts, 
  uploadImage,
  generateUniqueSlug 
} from '../recipe.helpers';
import { validateRequiredFields, validateNumericFields } from '../validators/recipe.validators';

const prisma = new PrismaClient();

export async function createRecipeStrategy(req: AuthRequest, res: Response) {
  try {
    Logger.debug('Creating recipe', { userId: req.user.id });
    
    const { 
      title, description, prepTime, cookTime, servings, difficulty,
      isPublic = true, categoryId, ingredients = [], instructions = [], tags = [],
      imageUrl
    } = req.body;

    // Validazione campi obbligatori
    const requiredValidation = validateRequiredFields(title, description);
    if (!requiredValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: requiredValidation.message 
      });
    }

    // Validazione campi numerici
    const numericValidation = validateNumericFields(prepTime, cookTime, servings);
    if (!numericValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: numericValidation.message 
      });
    }

    // Gestione immagine (legacy con file upload)
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

    // Creazione ricetta
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

    console.log('🔍 RECIPE CREATA - categoryId dal body:', categoryId);
    console.log('🔍 RECIPE CREATA - categoryId salvato:', recipe.categoryId);

    // Gestione tags
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

    // Recupero ricetta completa
    const completeRecipe = await getRecipeWithCounts(recipe.id);
    if (!completeRecipe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero della ricetta creata' 
      });
    }

    Logger.info('Recipe created', { 
      recipeId: recipe.id, 
      userId: req.user.id, 
      imageUrl: finalImageUrl 
    });
    
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