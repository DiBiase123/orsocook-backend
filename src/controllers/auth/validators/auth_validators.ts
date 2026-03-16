export interface ValidationResult {
  valid: boolean;
  message?: string;
  statusCode?: number;
}

/**
 * Valida email e password per login
 */
export function validateLoginInput(email?: string, password?: string): ValidationResult {
  if (!email || !password) {
    return {
      valid: false,
      message: 'Email e password obbligatorie',
      statusCode: 400
    };
  }
  return { valid: true };
}

/**
 * Valida i campi per la registrazione
 */
export function validateRegisterInput(
  username?: string, 
  email?: string, 
  password?: string
): ValidationResult {
  if (!username || !email || !password) {
    return {
      valid: false,
      message: 'Campi obbligatori mancanti',
      statusCode: 400
    };
  }

  // Validazione email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Formato email non valido',
      statusCode: 400
    };
  }

  // Validazione password
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password deve essere di almeno 8 caratteri',
      statusCode: 400
    };
  }

  return { valid: true };
}

/**
 * Valida token (verifica email, reset password)
 */
export function validateToken(token?: string): ValidationResult {
  if (!token) {
    return {
      valid: false,
      message: 'Token mancante',
      statusCode: 400
    };
  }
  return { valid: true };
}

/**
 * Valida email per forgot password / resend verification
 */
export function validateEmail(email?: string): ValidationResult {
  if (!email) {
    return {
      valid: false,
      message: 'Email obbligatoria',
      statusCode: 400
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Formato email non valido',
      statusCode: 400
    };
  }

  return { valid: true };
}

/**
 * Valida password per reset password
 */
export function validatePasswordReset(
  password?: string, 
  confirmPassword?: string
): ValidationResult {
  if (!password || !confirmPassword) {
    return {
      valid: false,
      message: 'Password e conferma password obbligatorie',
      statusCode: 400
    };
  }

  if (password !== confirmPassword) {
    return {
      valid: false,
      message: 'Le password non corrispondono',
      statusCode: 400
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password deve essere di almeno 8 caratteri',
      statusCode: 400
    };
  }

  return { valid: true };
}

/**
 * Valida refresh token
 */
export function validateRefreshToken(refreshToken?: string): ValidationResult {
  if (!refreshToken) {
    return {
      valid: false,
      message: 'Refresh token mancante',
      statusCode: 400
    };
  }
  return { valid: true };
}

/**
 * Valida autenticazione utente
 */
export function validateAuthenticated(user: any): ValidationResult {
  if (!user || !user.id) {
    return {
      valid: false,
      message: 'Utente non autenticato',
      statusCode: 401
    };
  }
  return { valid: true };
}

/**
 * Valida permessi per accesso al profilo
 */
export function validateProfileAccess(requestedUserId: string, currentUserId: string): ValidationResult {
  if (requestedUserId !== currentUserId) {
    return {
      valid: false,
      message: 'Non autorizzato',
      statusCode: 403
    };
  }
  return { valid: true };
}

/**
 * Valida file per upload avatar
 */
export function validateAvatarFile(file?: any): ValidationResult {
  if (!file) {
    return {
      valid: false,
      message: 'Nessuna immagine fornita',
      statusCode: 400
    };
  }

  if (!file.mimetype.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      message: 'Immagine non valida o troppo grande (max 5MB)',
      statusCode: 400
    };
  }

  return { valid: true };
}