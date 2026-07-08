import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents');

// Assicura che la cartella esista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

// GET - Download/visualizzazione file PDF (protetto)
export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.webDocument.findFirst({
      where: { id, uploadedBy: req.user.id },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Documento non trovato' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, document.fileName);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File non trovato su disco' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ success: false, message: 'Errore nel download documento' });
  }
};

// POST - Upload nuovo documento
export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
        console.log('📤 Upload ricevuto - file:', !!req.file, 'body:', req.body);

    const { description, documentDate, ente } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'File PDF richiesto' });
      return;
    }

    if (!description || !documentDate || !ente) {
      res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori: description, documentDate, ente' });
      return;
    }

    // Genera nome file univoco
    const uniqueFileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    // Salva file su disco
    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `/api/webdocuments/download/${uniqueFileName}`;

    const document = await prisma.webDocument.create({
      data: {
        description,
        documentDate: new Date(documentDate),
        ente,
        fileUrl,
        fileName: uniqueFileName,
        fileSize: file.size,
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

    // Elimina file da disco
    const filePath = path.join(UPLOADS_DIR, existing.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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