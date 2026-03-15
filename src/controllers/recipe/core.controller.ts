import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  getRecipesStrategy,
  getRecipeByIdStrategy,
  createRecipeStrategy,
  updateRecipeStrategy,
  deleteRecipeStrategy,
  getUserRecipesStrategy
} from './strategies';

// GET /api/recipes
export async function getRecipes(req: Request, res: Response) {
  return getRecipesStrategy(req, res);
}

// GET /api/recipes/:id
export async function getRecipeById(req: Request, res: Response) {
  return getRecipeByIdStrategy(req, res);
}

// POST /api/recipes
export async function createRecipe(req: AuthRequest, res: Response) {
  return createRecipeStrategy(req, res);
}

// PUT /api/recipes/:id
export async function updateRecipe(req: AuthRequest, res: Response) {
  return updateRecipeStrategy(req, res);
}

// DELETE /api/recipes/:id
export async function deleteRecipe(req: AuthRequest, res: Response) {
  return deleteRecipeStrategy(req, res);
}

// GET /api/recipes/user/:userId
export async function getUserRecipes(req: AuthRequest, res: Response) {
  return getUserRecipesStrategy(req, res);
}