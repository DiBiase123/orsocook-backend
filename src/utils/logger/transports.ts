import winston from 'winston';
const { transports } = winston;
import { consoleFormat, fileFormat } from './formats';
import path from 'path';
import fs from 'fs';

// Crea cartella logs se non esiste
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const consoleTransport = new transports.Console({
  format: consoleFormat,
});

export const getFileTransports = () => [
  new transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
  new transports.File({
    filename: path.join(logsDir, 'error.log'),
    format: fileFormat,
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
  new transports.File({
    filename: path.join(logsDir, 'api.log'),
    format: fileFormat,
    level: 'info',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
];