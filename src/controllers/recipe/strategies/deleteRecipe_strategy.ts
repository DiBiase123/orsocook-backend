import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../middleware/auth';
import Logger from '../../../utils/logger';
import { 
  validateRecipeExists, 
  validateRecipeOwnership 
} from '../validators/recipe.validators';

const prisma = new PrismaClient();

export async function deleteRecipeStrategy(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

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
      'eliminare'
    );
    if (!ownershipValidation.valid) {
      return res.status(403).json({ 
        success: false, 
        message: ownershipValidation.message 
      });
    }

    // Eliminazione ricetta (cascade grazie a Prisma)
    await prisma.recipe.delete({ 
      where: { id } 
    });

    Logger.info('Recipe deleted', { 
      recipeId: id, 
      userId: req.user.id 
    });
    
    res.json({ 
      success: true, 
      message: 'Ricetta eliminata con successo' 
    });

  } catch (error) {
    Logger.error('Error deleting recipe', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'eliminazione della ricetta',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}