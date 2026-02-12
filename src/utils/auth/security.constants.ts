// Configurazioni di sicurezza per autenticazione
export const SECURITY_CONSTANTS = {
  // Tentativi di login
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  ACCOUNT_LOCK_TIME_MINUTES: parseInt(process.env.ACCOUNT_LOCK_TIME_MINUTES || '15'),
  ACCOUNT_LOCK_TIME_MS: parseInt(process.env.ACCOUNT_LOCK_TIME_MINUTES || '15') * 60 * 1000,
  
  // Token expiration
  EMAIL_TOKEN_EXPIRY_HOURS: parseInt(process.env.EMAIL_TOKEN_EXPIRY_HOURS || '24'),
  EMAIL_TOKEN_EXPIRY_MS: parseInt(process.env.EMAIL_TOKEN_EXPIRY_HOURS || '24') * 60 * 60 * 1000,
  
  RESET_TOKEN_EXPIRY_MINUTES: parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60'),
  RESET_TOKEN_EXPIRY_MS: parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60') * 60 * 1000,
  
  // Validation
  MIN_PASSWORD_LENGTH: 8,
  
  // Response messages
  MESSAGES: {
    ACCOUNT_LOCKED: (minutes: number) => `Account temporaneamente bloccato. Riprova tra ${minutes} minuti.`,
    TOO_MANY_ATTEMPTS: (minutes: number) => `Troppi tentativi falliti. Account bloccato per ${minutes} minuti.`,
    ATTEMPTS_LEFT: (attempts: number) => `Credenziali non valide. Tentativi rimasti: ${attempts}`,
    EMAIL_NOT_VERIFIED: 'Devi verificare la tua email prima di accedere.',
    INVALID_CREDENTIALS: 'Credenziali non valide'
  }
} as const;