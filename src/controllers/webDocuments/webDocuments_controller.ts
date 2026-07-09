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

// GET - Singolo documento (metadati)
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

// GET - Download/visualizzazione file PDF dal DB
export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.webDocument.findFirst({
      where: { id, uploadedBy: req.user.id },
    });

    if (!document || !document.fileData) {
      res.status(404).json({ success: false, message: 'Documento non trovato' });
      return;
    }

    const buffer = Buffer.from(document.fileData, 'base64');
    const isDownload = req.query.download === 'true';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', isDownload
      ? `attachment; filename="${document.fileName}"`
      : `inline; filename="${document.fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ success: false, message: 'Errore nel download documento' });
  }
};

// POST - Upload nuovo documento (base64 salvato nel DB)
export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, documentDate, ente, fileName, fileData } = req.body;

    if (!fileData) {
      res.status(400).json({ success: false, message: 'File PDF richiesto' });
      return;
    }

    if (!description || !documentDate || !ente || !fileName) {
      res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori' });
      return;
    }

    // Controlla duplicato
    const existing = await prisma.webDocument.findFirst({
      where: { fileName, uploadedBy: req.user.id },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'File già presente' });
      return;
    }

    const buffer = Buffer.from(fileData, 'base64');

    const document = await prisma.webDocument.create({
      data: {
        description,
        documentDate: new Date(documentDate),
        ente,
        fileUrl: '',
        fileName,
        fileSize: buffer.length,
        fileData: fileData,
        uploadedBy: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ success: false, message: 'Errore nella creazione del documento' });
  }
};

// PUT - Modifica documento (solo metadati)
export const updateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, documentDate, ente } = req.body;

    const existing = await prisma.webDocument.findFirst({
      where: { id, uploadedBy: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Documento non trovato' });
      return;
    }

    const document = await prisma.webDocument.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(documentDate && { documentDate: new Date(documentDate) }),
        ...(ente && { ente }),
      },
    });

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ success: false, message: 'Errore nella modifica del documento' });
  }
};

// DELETE - Elimina documento
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.webDocument.findFirst({
      where: { id, uploadedBy: req.user.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Documento non trovato' });
      return;
    }

    await prisma.webDocument.delete({ where: { id } });

    res.json({ success: true, message: 'Documento eliminato' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione del documento' });
  }
};

export default {
  getDocuments,
  getDocumentById,
  downloadDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};