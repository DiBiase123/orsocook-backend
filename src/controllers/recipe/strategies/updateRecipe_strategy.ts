// app_ricette_backend/src/controllers/recipe/strategies/updateRecipe_strategy.ts

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { 
  processTags, 
  getRecipeWithCounts, 
  uploadImage 
} from '../recipe.helpers';
import { 
  validateRecipeExists, 
  validateRecipeOwnership,
  validateRequiredFields,
  validateNumericFields 
} from '../validators/recipe.validators';

const prisma = new PrismaClient();

export async function updateRecipeStrategy(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    Logger.debug('Updating recipe', { recipeId: id, userId: req.user.id });
    
    const { 
      title, description, prepTime, cookTime, servings, difficulty,
      isPublic, categoryId, ingredients, instructions, tags,
      imageUrl
    } = req.body;

    console.log('🔍 RECIPE UPDATE - categoryId dal body:', categoryId);

    // Validazione campi obbligatori se presenti
    if (title !== undefined || description !== undefined) {
      const requiredValidation = validateRequiredFields(
        title || 'placeholder', 
        description || 'placeholder'
      );
      if (!requiredValidation.valid) {
        return res.status(400).json({ 
          success: false, 
          message: requiredValidation.message 
        });
      }
    }

    // Validazione campi numerici
    const numericValidation = validateNumericFields(prepTime, cookTime, servings);
    if (!numericValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: numericValidation.message 
      });
    }

    // Verifica esistenza ricetta
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: { author: true }
    });

    const existsValidation = validateRecipeExists(existingRecipe);
    if (!existsValidation.valid) {
      return res.status(404).json({ 
        success: false, 
        message: existsValidation.message 
      });
    }

    // Verifica permessi
    const ownershipValidation = validateRecipeOwnership(
      existingRecipe!.authorId, 
      req.user.id, 
      'modificare'
    );
    if (!ownershipValidation.valid) {
      return res.status(403).json({ 
        success: false, 
        message: ownershipValidation.message 
      });
    }

    // Preparazione dati aggiornamento
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (prepTime !== undefined) updateData.prepTime = Number(prepTime);
    if (cookTime !== undefined) updateData.cookTime = Number(cookTime);
    if (servings !== undefined) updateData.servings = Number(servings);
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    // Gestione categoria
    if (categoryId !== undefined) {
      updateData.category = categoryId 
        ? { connect: { id: categoryId } }
        : { disconnect: true };
    }
    
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (instructions !== undefined) updateData.instructions = instructions;

    // Gestione nuova immagine (legacy)
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

    console.log('🔍 RECIPE UPDATE - updateData prima del salvataggio:', updateData);

    // Aggiornamento ricetta
    await prisma.recipe.update({ 
      where: { id }, 
      data: updateData 
    });

    // Debug post-salvataggio
    const recipeDopo = await prisma.recipe.findUnique({
      where: { id },
      select: { id: true, title: true, categoryId: true }
    });
    console.log('🔍 RECIPE UPDATE - dopo salvataggio categoryId:', recipeDopo?.categoryId);

    // Gestione tags
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

    // Recupero ricetta aggiornata
    const updatedRecipe = await getRecipeWithCounts(id);
    if (!updatedRecipe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero della ricetta aggiornata' 
      });
    }

    Logger.info('Recipe updated', { 
      recipeId: id, 
      userId: req.user.id, 
      imageUrl: updateData.imageUrl 
    });
    
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