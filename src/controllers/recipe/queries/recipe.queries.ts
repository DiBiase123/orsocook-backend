import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GetRecipesQueryParams {
  page?: number;
  limit?: number;
  category?: string | null;
  search?: string | null;
}

export interface GetRecipesQueryResult {
  recipes: any[]; // Puoi raffinare questo tipo se hai un'interfaccia Recipe
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Esegue la query complessa per ottenere ricette con filtri
 * @returns Ricette processate e conteggio totale
 */
export async function getRecipesWithFilters(params: GetRecipesQueryParams): Promise<GetRecipesQueryResult> {
  const { page = 1, limit = 10, category, search } = params;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Costruisci la query SQL base
  let sqlQuery = `
    SELECT r.*, 
           row_to_json(a) as author,
           row_to_json(c) as category,
           COALESCE(
             json_agg(
               json_build_object('tag', row_to_json(t.*))
             ) FILTER (WHERE t.id IS NOT NULL), 
             '[]'
           ) as tags
    FROM recipes r
    LEFT JOIN users a ON r."authorId" = a.id
    LEFT JOIN categories c ON r."categoryId" = c.id
    LEFT JOIN recipe_tags rt ON r.id = rt."recipeId"
    LEFT JOIN tags t ON rt."tagId" = t.id
    WHERE r."isPublic" = true
  `;

  const queryParams: any[] = [];
  let paramIndex = 1;

  // Aggiungi filtro categoria
  if (category) {
    sqlQuery += ` AND c.slug = $${paramIndex}`;
    queryParams.push(String(category));
    paramIndex++;
  }

  // Aggiungi ricerca
  if (search) {
    const searchString = String(search);
    console.log('🔍 BACKEND - Ricerca per:', searchString);
    
    sqlQuery += ` AND (
      r.title ILIKE $${paramIndex} OR
      r.description ILIKE $${paramIndex} OR
      EXISTS (
        SELECT 1 FROM recipe_tags rt2
        JOIN tags t2 ON rt2."tagId" = t2.id
        WHERE rt2."recipeId" = r.id AND t2.name ILIKE $${paramIndex}
      ) OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(r.ingredients) AS ing
        WHERE ing->>'name' ILIKE $${paramIndex}
      )
    )`;
    queryParams.push(`%${searchString}%`);
    paramIndex++;
  }

  // Aggiungi GROUP BY e ORDER BY
  sqlQuery += ` GROUP BY r.id, a.id, c.id ORDER BY r."createdAt" DESC`;

  // Query per il conteggio totale
  let countQuery = `SELECT COUNT(DISTINCT r.id) as total FROM recipes r WHERE r."isPublic" = true`;
  
  if (category) {
    countQuery += ` AND EXISTS (SELECT 1 FROM categories c WHERE r."categoryId" = c.id AND c.slug = $1)`;
  }
  
  if (search) {
    const searchParam = category ? 2 : 1;
    countQuery += ` AND (
      r.title ILIKE $${searchParam} OR
      r.description ILIKE $${searchParam} OR
      EXISTS (
        SELECT 1 FROM recipe_tags rt2
        JOIN tags t2 ON rt2."tagId" = t2.id
        WHERE rt2."recipeId" = r.id AND t2.name ILIKE $${searchParam}
      ) OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(r.ingredients) AS ing
        WHERE ing->>'name' ILIKE $${searchParam}
      )
    )`;
  }

  // Esegui le query
  const [recipes, totalResult] = await Promise.all([
    prisma.$queryRawUnsafe(sqlQuery + ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, 
      ...queryParams, limitNum, skip),
    prisma.$queryRawUnsafe(countQuery, ...queryParams)
  ]);

  const total = Number(totalResult[0]?.total || 0);

  // Processa le ricette per formattare i tags
  const processedRecipes = (recipes as any[]).map(recipe => ({
    ...recipe,
    tags: recipe.tags?.filter((t: any) => t.tag).map((t: any) => t.tag) || []
  }));

  return {
    recipes: processedRecipes,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  };
}