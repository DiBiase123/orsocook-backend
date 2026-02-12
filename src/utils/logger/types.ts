export type LogContext = 
  | 'APP' 
  | 'API' 
  | 'DB' 
  | 'AUTH' 
  | 'RECIPE' 
  | 'FAVORITE' 
  | 'USER'
  | string;

export interface LogMeta {
  context?: LogContext;
  userId?: string;
  requestId?: string;
  durationMs?: number;
  data?: any;
  [key: string]: any;
}