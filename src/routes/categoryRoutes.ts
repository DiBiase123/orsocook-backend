import express from 'express'
import { 
  getCategories, 
  createCategory,
  seedCategories 
} from '../controllers/category.controller'

const router = express.Router()

// GET /api/categories - Tutte le categorie
router.get('/', getCategories)

// POST /api/categories - Crea una nuova categoria
router.post('/', createCategory)

// POST /api/categories/seed - Crea categorie di default
router.post('/seed', seedCategories)

export default router