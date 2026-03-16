import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Logger from '../utils/logger'; 

const prisma = new PrismaClient();

// GET /api/categories - Tutte le categorie
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      recipeCount: cat._count.recipes,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString()
    }))
    
    // Rimuovi _count
    categoriesWithCount.forEach(cat => delete (cat as any)._count)
    
    res.json({
      success: true,
      data: categoriesWithCount
    })
    
  } catch (error) {
    Logger.error('Errore nel caricamento categorie', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    })
  }
}

// POST /api/categories - Crea una nuova categoria
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, slug, description, icon } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Nome e slug sono obbligatori'
      });
    }

    // Verifica se esiste già
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Categoria già esistente con questo nome o slug'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon
      }
    });

    Logger.info('Categoria creata', { categoryId: category.id, name: category.name });

    res.status(201).json({
      success: true,
      data: category
    });

  } catch (error) {
    Logger.error('Errore nella creazione categoria', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
}

// POST /api/categories/seed - Crea categorie di default
export async function seedCategories(req: Request, res: Response) {
  try {
    const defaultCategories = [
      { name: 'Antipasti', slug: 'antipasti', description: 'Antipasti e stuzzichini' },
      { name: 'Primi Piatti', slug: 'primi', description: 'Primi piatti di pasta, riso e zuppe' },
      { name: 'Secondi Piatti', slug: 'secondi', description: 'Secondi piatti di carne e pesce' },
      { name: 'Dolci', slug: 'dolci', description: 'Dolci e dessert' },
      { name: 'Contorni', slug: 'contorni', description: 'Contorni di verdure' },
      { name: 'Pizze e Focacce', slug: 'pizze', description: 'Pizze, focacce e lievitati' },
      { name: 'Insalate', slug: 'insalate', description: 'Insalate e piatti freddi' },
      { name: 'Vegetariane', slug: 'vegetariane', description: 'Ricette senza carne' },
      { name: 'Vegane', slug: 'vegane', description: 'Ricette senza derivati animali' },
      { name: 'Senza Glutine', slug: 'senza-glutine', description: 'Ricette senza glutine' },
    ];

    const created = [];
    for (const cat of defaultCategories) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: cat.slug }
        });
        
        if (!existing) {
          const newCat = await prisma.category.create({
            data: cat
          });
          created.push(newCat);
        }
      } catch (e) {
        // Ignora errori duplicati
      }
    }

    Logger.info(`Categorie create: ${created.length}`);

    res.json({
      success: true,
      message: `${created.length} categorie create`,
      data: created
    });

  } catch (error) {
    Logger.error('Errore nel seed categorie', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
}