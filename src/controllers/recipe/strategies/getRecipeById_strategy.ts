// app_ricette_backend/src/controllers/recipe/strategies/getRecipeById_strategy.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Logger from '../../../utils/logger';
import { getRecipeWithCounts } from '../recipe_helpers';

const prisma = new PrismaClient();

export async function getRecipeByIdStrategy(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Incrementa le visualizzazioni
    await prisma.recipe.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    // Recupera la ricetta con tutti i conteggi
    const recipe = await getRecipeWithCounts(id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ricetta non trovata' 
      });
    }

    res.json({ 
      success: true, 
      data: recipe 
    });

  } catch (error) {
    Logger.error('Error fetching recipe by id', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel caricamento della ricetta',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}