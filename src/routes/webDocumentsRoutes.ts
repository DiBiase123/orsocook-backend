import express from 'express';
import { webDocumentsController } from '@controllers';
import { authenticateToken } from '@middleware';

const router = express.Router();

// Tutte le route sono protette
router.use(authenticateToken);

router.get('/', (req: any, res: express.Response) => 
  webDocumentsController.getDocuments(req, res));

router.get('/:id', (req: any, res: express.Response) => 
  webDocumentsController.getDocumentById(req, res));

export default router;