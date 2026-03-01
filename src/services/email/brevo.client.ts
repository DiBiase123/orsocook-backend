// Invece di @getbrevo/brevo, usa sib-api-v3-sdk
const SibApiV3Sdk = require('sib-api-v3-sdk');

export class BrevoClient {
  private static instance: any;
  private static isInitialized = false;

  static initialize(apiKey: string): any {
    if (this.isInitialized) {
      return this.instance;
    }

    try {
      console.log('📦 DEBUG - Modulo Sib caricato:', !!SibApiV3Sdk);
      
      // Configura il client come nel loro esempio
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKeyAuth = defaultClient.authentications['api-key'];
      apiKeyAuth.apiKey = apiKey;
      
      // Crea l'istanza API per le email transazionali
      this.instance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      this.isInitialized = true;
      console.log('✅ BrevoClient: Configurato con successo');
      
      return this.instance;
    } catch (error) {
      console.error('❌ BrevoClient: Errore configurazione', error);
      throw error;
    }
  }

  static getInstance(): any {
    if (!this.isInitialized || !this.instance) {
      throw new Error('BrevoClient non inizializzato. Chiamare initialize() prima.');
    }
    return this.instance;
  }
}