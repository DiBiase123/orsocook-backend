// app_ricette_backend/src/controllers/recipe/validators/recipe.validators.ts

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valida i campi obbligatori per creazione/aggiornamento ricetta
 */
export function validateRequiredFields(title?: string, description?: string): ValidationResult {
  if (!title || !description) {
    return {
      valid: false,
      message: 'Titolo e descrizione sono obbligatori'
    };
  }
  return { valid: true };
}

/**
 * Valida i permessi dell'utente sulla ricetta
 */
export function validateRecipeOwnership(recipeAuthorId: string, userId: string, action: string): ValidationResult {
  if (recipeAuthorId !== userId) {
    return {
      valid: false,
      message: `Non hai i permessi per ${action} questa ricetta`
    };
  }
  return { valid: true };
}

/**
 * Valida i parametri numerici (prepTime, cookTime, servings)
 */
export function validateNumericFields(
  prepTime?: any, 
  cookTime?: any, 
  servings?: any
): ValidationResult {
  
  if (prepTime !== undefined && isNaN(Number(prepTime))) {
    return {
      valid: false,
      message: 'Il tempo di preparazione deve essere un numero valido'
    };
  }

  if (cookTime !== undefined && isNaN(Number(cookTime))) {
    return {
      valid: false,
      message: 'Il tempo di cottura deve essere un numero valido'
    };
  }

  if (servings !== undefined && isNaN(Number(servings))) {
    return {
      valid: false,
      message: 'Le porzioni devono essere un numero valido'
    };
  }

  return { valid: true };
}

/**
 * Valida che la ricetta esista
 */
export function validateRecipeExists(recipe: any | null): ValidationResult {
  if (!recipe) {
    return {
      valid: false,
      message: 'Ricetta non trovata'
    };
  }
  return { valid: true };
}