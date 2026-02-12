/**
 * Rimuove i campi sensibili dall'oggetto utente
 */
export const sanitizeUser = (user: any) => {
  if (!user) return null;
  
  const { 
    passwordHash, 
    emailToken, 
    emailTokenExpiry, 
    resetToken, 
    resetTokenExpiry, 
    loginAttempts, 
    lockedUntil,
    // Altri campi sensibili da escludere
    ...safeUser 
  } = user;
  
  return safeUser;
};

/**
 * Sanitizza la risposta per il client
 */
export const sanitizeAuthResponse = (user: any, tokens?: { accessToken: string; refreshToken: string }) => {
  const sanitizedUser = sanitizeUser(user);
  
  const response: any = {
    user: sanitizedUser
  };
  
  if (tokens) {
    response.token = tokens.accessToken;
    response.refreshToken = tokens.refreshToken;
  }
  
  return response;
};

/**
 * Sanitizza l'errore per non esporre dettagli sensibili in produzione
 */
export const sanitizeError = (error: any, isProduction: boolean = process.env.NODE_ENV === 'production') => {
  if (!isProduction) {
    return error;
  }
  
  // In produzione, restituisci solo messaggi generici
  return {
    message: 'Si è verificato un errore interno',
    code: 'INTERNAL_ERROR'
  };
};