import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();

// GET - Lista documenti (solo i propri)
export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const documents = await prisma.webDocument.findMany({
      where: { uploadedBy: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        documentDate: true,
        ente: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero documenti' });
  }
};

// GET - Singolo documento (con URL per download)
export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.webDocument.findFirst({
      where: { id, uploadedBy: req.user.id },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Documento non trovato' });
      return;
    }

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero documento' });
  }
};

export default {
  getDocuments,
  getDocumentById,
};