import winston from 'winston';
import { consoleTransport, getFileTransports } from './transports';
import { LogContext, LogMeta } from './types';

// Crea il logger Winston
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transports: [
    consoleTransport,
    ...getFileTransports(),
  ],
  exitOnError: false,
});

// Logger principale con la stessa API del vecchio
export class Logger {
  // Metodi principali
  static debug(message: string, meta?: LogMeta): void {
    const context = meta?.context || 'APP';
    winstonLogger.debug(`🔧 [${context}] ${message}`, meta);
  }

  static info(message: string, meta?: LogMeta): void {
    const context = meta?.context || 'APP';
    winstonLogger.info(`📗 [${context}] ${message}`, meta);
  }

  static warn(message: string, meta?: LogMeta): void {
    const context = meta?.context || 'APP';
    winstonLogger.warn(`📒 [${context}] ${message}`, meta);
  }

  static error(message: string, error?: any, meta?: LogMeta): void {
    const context = meta?.context || 'APP';
    const fullMessage = error ? `${message}: ${error}` : message;
    winstonLogger.error(`📕 [${context}] ${fullMessage}`, meta);
  }

  // Metodi specializzati
  static api(method: string, endpoint: string, statusCode?: number, userId?: string, durationMs?: number): void {
    // Log solo per errori (4xx, 5xx) e successi in development
    const shouldLog = statusCode 
      ? (statusCode >= 400 || process.env.NODE_ENV === 'development')
      : true;
    
    if (shouldLog) {
      const message = `${method} ${endpoint} ${statusCode || ''}`.trim();
      const meta: any = {};
      if (statusCode) meta.statusCode = statusCode;
      if (userId) meta.userId = userId;
      if (durationMs) meta.durationMs = durationMs;
      
      if (statusCode && statusCode >= 400) {
        winstonLogger.error(`📡 [API] ${message}`, meta);
      } else {
        winstonLogger.info(`📡 [API] ${message}`, meta);
      }
    }
  }

  static db(operation: string, table?: string, data?: any): void {
    // Log DB solo se esplicitamente abilitato
    if (process.env.DEBUG_DB === 'true') {
      const meta: any = {};
      if (table) meta.table = table;
      if (data) meta.data = data;
      winstonLogger.debug(`🗄️ [DB] ${operation}`, meta);
    }
  }

  static auth(action: string, userId?: string, data?: any): void {
    // Log auth sempre, ma con livello diverso
    const meta: any = {};
    if (userId) meta.userId = userId;
    if (data) meta.data = data;
    
    if (process.env.NODE_ENV === 'development') {
      winstonLogger.debug(`🔐 [AUTH] ${action}`, meta);
    } else {
      winstonLogger.info(`🔐 [AUTH] ${action}`, meta);
    }
  }

  // Crea un logger con contesto predefinito (manteniamo la stessa API)
  static create(context: LogContext) {
    return {
      debug: (message: string, meta?: Omit<LogMeta, 'context'>) => 
        Logger.debug(message, { ...meta, context }),
      
      info: (message: string, meta?: Omit<LogMeta, 'context'>) => 
        Logger.info(message, { ...meta, context }),
      
      warn: (message: string, meta?: Omit<LogMeta, 'context'>) => 
        Logger.warn(message, { ...meta, context }),
      
      error: (message: string, error?: any, meta?: Omit<LogMeta, 'context'>) => 
        Logger.error(message, error, { ...meta, context }),
    };
  }
}

// Esporta il logger principale COME DEFAULT
export default Logger;

// Logger preconfigurati (compatibilità con vecchio codice)
export const ApiLogger = Logger.create('API');
export const DbLogger = Logger.create('DB');
export const AuthLogger = Logger.create('AUTH');
export const RecipeLogger = Logger.create('RECIPE');
export const FavoriteLogger = Logger.create('FAVORITE');
export const UserLogger = Logger.create('USER');