import { Request, Response } from 'express';
import Logger from '../../../utils/logger';
import { getRecipesWithFilters } from '../queries/recipe.queries';
import { addCountsToRecipes } from '../recipe.helpers';

export async function getRecipesStrategy(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    // Usa la query dal file dedicato
    const result = await getRecipesWithFilters({
      page: Number(page),
      limit: Number(limit),
      category: category as string | null,
      search: search as string | null
    });

    // Aggiungi conteggi (like, favorite, comment)
    const recipesWithCounts = await addCountsToRecipes(result.recipes);

    res.json({
      success: true,
      data: {
        recipes: recipesWithCounts,
        pagination: result.pagination
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