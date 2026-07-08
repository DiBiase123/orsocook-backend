import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendi l'interfaccia Request di Express
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
    file?: any;
    files?: any[];
  }
}

// Definisci e esporta l'interfaccia COMPLETA
export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
  file?: any;
  files?: any[];
  body: any;
  params: any;
  query: any;
  headers: any;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  // 1. Prova header Authorization
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader.split(' ')[1];
  }

  // 2. Se non trovato, prova query parameter (per download PDF)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token di autenticazione mancante'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // NORMALIZZA I CAMPI: assicurati che ci sia sempre 'id' e 'userId'
    if (decoded && typeof decoded === 'object') {
      const userObj = decoded as any;
      req.user = {
        ...userObj,
        id: userObj.userId || userObj.userID || userObj.id,
        userId: userObj.userId || userObj.userID || userObj.id,
        email: userObj.email || '',
        role: userObj.role || 'user'
      };
    } else {
      req.user = {
        id: '',
        email: '',
        role: 'user'
      };
    }
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(403).json({
      success: false,
      message: 'Token non valido o scaduto'
    });
  }
};