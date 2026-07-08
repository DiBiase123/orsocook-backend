import express from 'express';
import multer from 'multer';
import { webDocumentsController } from '@controllers';
import { authenticateToken } from '@middleware';

const router = express.Router();

// Configurazione multer per PDF
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per PDF
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Tutte le route sono protette
router.use(authenticateToken);

// GET - Lista documenti
router.get('/', (req: any, res: express.Response) =>
  webDocumentsController.getDocuments(req, res));

// GET - Download file PDF (protetto)
router.get('/download/:fileName', (req: any, res: express.Response) =>
  webDocumentsController.downloadDocument(req, res));

// GET - Singolo documento (metadati)
router.get('/:id', (req: any, res: express.Response) =>
  webDocumentsController.getDocumentById(req, res));

// POST - Upload nuovo documento
router.post('/', upload.single('file'), (req: any, res: express.Response) =>
  webDocumentsController.createDocument(req, res));

// PUT - Modifica documento
router.put('/:id', (req: any, res: express.Response) =>
  webDocumentsController.updateDocument(req, res));

// DELETE - Elimina documento
router.delete('/:id', (req: any, res: express.Response) =>
  webDocumentsController.deleteDocument(req, res));

export default router;