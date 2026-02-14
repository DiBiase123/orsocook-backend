import { Request, Response } from 'express';
import { generateUploadSignature } from '../services/cloudinaryUpload.service';

export const getUploadSignature = (req: Request, res: Response) => {
  try {
    const folder = req.query.folder as string || 'orsocook/recipes';
    const signatureData = generateUploadSignature(folder);
    
    res.json({
      success: true,
      data: signatureData
    });
  } catch (error) {
    console.error('Errore generazione firma upload:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella generazione della firma upload'
    });
  }
};

