import { PrismaClient } from '@prisma/client';
import { 
  generateRefreshToken, 
  verifyRefreshToken, 
  generateAccessToken,
  TokenPayload 
} from '../../utils/auth/token.utils';

const prisma = new PrismaClient();

export interface SessionData {
  userId: string;
  refreshToken: string;
  userAgent?: string;      // <-- AGGIUNTO
  ipAddress?: string;      // <-- AGGIUNTO
}

export interface RefreshResult {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    user?: any;
  };
  statusCode?: number;
}

export class SessionService {
  /**
   * Crea o aggiorna una sessione utente
   */
  async createOrUpdateSession(sessionData: SessionData): Promise<void> {
    const { userId, refreshToken, userAgent, ipAddress } = sessionData;

    // Cerca sessione esistente per questo utente
    const existingSession = await prisma.session.findFirst({
      where: { userId }
    });

    const sessionDataToUpdate = {
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 giorni
      ...(userAgent !== undefined && { userAgent }),  // <-- AGGIUNTO
      ...(ipAddress !== undefined && { ipAddress })   // <-- AGGIUNTO
    };

    if (existingSession) {
      // Aggiorna sessione esistente
      await prisma.session.update({
        where: { id: existingSession.id },
        data: sessionDataToUpdate
      });
    } else {
      // Crea nuova sessione
      await prisma.session.create({
        data: {
          userId,
          ...sessionDataToUpdate
        }
      });
    }
  }

  /**
   * Refresh access token usando refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    try {
      if (!refreshToken) {
        return {
          success: false,
          message: 'Refresh token mancante',
          statusCode: 400
        };
      }

      // Verifica il refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Cerca la sessione nel database
      const session = await prisma.session.findFirst({
        where: { 
          refreshToken,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        return {
          success: false,
          message: 'Sessione non valida o scaduta',
          statusCode: 401
        };
      }

      // Recupera dati utente
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          username: true, 
          email: true, 
          isVerified: true 
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Utente non trovato',
          statusCode: 401
        };
      }

      // Genera nuovo access token
      const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      });

      return {
        success: true,
        message: 'Token aggiornato',
        data: { 
          accessToken,
          user 
        }
      };

    } catch (error: any) {
      console.error('SessionService - refreshAccessToken error:', error);
      
      // Se il token è scaduto o non valido, cancella la sessione
      if (error.message && error.message.includes('jwt')) {
        await this.deleteSessionByToken(refreshToken);
        return {
          success: false,
          message: 'Refresh token non valido o scaduto',
          statusCode: 401
        };
      }

      return {
        success: false,
        message: 'Errore durante il refresh del token',
        statusCode: 500
      };
    }
  }

  /**
   * Elimina sessione specifica per logout
   */
  async deleteSessionByToken(refreshToken: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { refreshToken }
      });
    } catch (error) {
      console.error('SessionService - deleteSessionByToken error:', error);
    }
  }

  /**
   * Elimina tutte le sessioni di un utente
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { userId }
      });
    } catch (error) {
      console.error('SessionService - deleteAllUserSessions error:', error);
    }
  }

  /**
   * Recupera tutte le sessioni attive di un utente
   */
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      return sessions.map(session => ({
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,    // <-- AGGIUNTO
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,    // <-- AGGIUNTO
        ipAddress: session.ipAddress     // <-- AGGIUNTO
      }));
    } catch (error) {
      console.error('SessionService - getUserSessions error:', error);
      return [];
    }
  }

  /**
   * Pulisce le sessioni scadute
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
      
      console.log(`🧹 SessionService - Pulisce ${result.count} sessioni scadute`);
      return result.count;
    } catch (error) {
      console.error('SessionService - cleanupExpiredSessions error:', error);
      return 0;
    }
  }

  /**
   * Valida se una sessione è ancora attiva
   */
  async validateSession(refreshToken: string): Promise<boolean> {
    try {
      const session = await prisma.session.findFirst({
        where: { 
          refreshToken,
          expiresAt: { gt: new Date() }
        }
      });

      return !!session;
    } catch (error) {
      console.error('SessionService - validateSession error:', error);
      return false;
    }
  }
}

// Esporta un'istanza singleton
export const sessionService = new SessionService();