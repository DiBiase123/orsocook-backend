import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import Logger from '../../utils/logger';
import { uploadImage } from './recipe.helpers';

const prisma = new PrismaClient();

// DELETE /api/recipes/:id/remove-image
export const removeRecipeImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorizzato' 
      });
    }

    const recipe = await prisma.recipe.findFirst({
      where: { 
        id, 
        authorId: userId 
      }
    });

    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ricetta non trovata' 
      });
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: { imageUrl: null }
    });

    return res.json({
      success: true,
      message: 'Immagine rimossa con successo',
      data: updatedRecipe
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Errore rimozione immagine' 
    });
  }
};

// POST /api/recipes/:id/upload-image
export async function uploadRecipeImage(req: AuthRequest, res: Response) {
  try {
    console.log('🔥🔥🔥 uploadRecipeImage CALLED');
    console.log('🔥 req.file:', req.file);
    console.log('🔥 req.body:', req.body);
    console.log('🔥 req.headers["content-type"]:', req.headers['content-type']);
    
    const { id } = req.params;
    
    if (!req.file?.buffer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file immagine fornito' 
      });
    }

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

    Logger.debug('Uploading recipe image', { recipeId: id, userId: req.user.id });
    
    const imageUrl = await uploadImage(
      req.file.buffer, 
      req.file.mimetype, 
      req.file.originalname
    );
    
    await prisma.recipe.update({
      where: { id },
      data: { imageUrl }
    });

    Logger.info('Recipe image uploaded', { recipeId: id, userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Immagine caricata con successo',
      data: { imageUrl }
    });
  } catch (error) {
    Logger.error('Error uploading recipe image', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel caricamento dell\'immagine',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}
