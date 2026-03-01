import dotenv from 'dotenv';

dotenv.config();

// Usa require invece di import per Brevo
const brevo = require('@getbrevo/brevo');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private fromEmail: string;
  private frontendUrl: string;
  private backendUrl: string;
  private isConfigured: boolean;
  private apiInstance: any;

  constructor() {
    // Configurazione Brevo API
    const brevoApiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.SMTP_FROM || 'noreply@orsocook.us.ci';

    // Validazione configurazione
    if (!brevoApiKey) {
      console.warn('⚠️  Configurazione Brevo incompleta. Email non saranno inviate.');
      console.warn('   Imposta: BREVO_API_KEY');
      this.isConfigured = false;
    } else {
      try {
        // Configurazione API Brevo con require
        const apiClient = brevo.ApiClient.instance;
        apiClient.authentications['api-key'].apiKey = brevoApiKey;
        
        this.apiInstance = new brevo.TransactionalEmailsApi(apiClient);
        this.isConfigured = true;
        console.log('✅ Brevo API configurata con successo');
      } catch (error) {
        console.error('❌ Errore configurazione Brevo:', error);
        this.isConfigured = false;
      }
    }

    this.fromEmail = `"OrsoCook 🐻" <${fromEmail}>`;
    
    // Configurazione URL dinamiche per ambiente
    this.backendUrl = this.getBackendUrl();
    this.frontendUrl = this.getFrontendUrl();
    
    console.log('🌐 URL Configurazione:');
    console.log(`   Backend: ${this.backendUrl}`);
    console.log(`   Frontend: ${this.frontendUrl}`);
  }

  /**
   * Ottiene URL backend in base all'ambiente
   */
  private getBackendUrl(): string {
    const customBackendUrl = process.env.BACKEND_URL;
    
    if (customBackendUrl) {
      return customBackendUrl;
    }
    
    if (process.env.RENDER_EXTERNAL_URL) {
      return process.env.RENDER_EXTERNAL_URL;
    }
    
    const port = process.env.PORT || '5000';
    return `http://localhost:${port}`;
  }

  /**
   * Ottiene URL frontend in base all'ambiente
   */
  private getFrontendUrl(): string {
    const customFrontendUrl = process.env.FRONTEND_URL;
    
    if (customFrontendUrl) {
      return customFrontendUrl;
    }
    
    return 'https://dibiase123.github.io/orsocook';
  }

  /**
   * Invia email di verifica account
   */
  async sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    
    const html = this.getVerificationEmailHtml(username, verificationUrl);
    const text = this.getVerificationEmailText(username, verificationUrl);

    return this.sendEmail({
      to: email,
      subject: '🐻 Conferma la tua email per OrsoCook',
      html,
      text,
    });
  }

  /**
   * Invia email per reset password
   */
  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    const html = this.getResetPasswordEmailHtml(username, resetUrl);
    const text = `Reimposta la tua password: ${resetUrl}`;

    return this.sendEmail({
      to: email,
      subject: '🔐 Reimposta la tua password OrsoCook',
      html,
      text,
    });
  }

  /**
   * Metodo generico per inviare email via Brevo API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('📧 Email non inviata (Brevo non configurato):', {
        to: options.to,
        subject: options.subject,
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Contenuto email (sviluppo):');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Text:', options.text);
        console.log('URL nel testo:', this.extractUrls(options.text || options.html));
        console.log('---');
      }
      
      return true;
    }

    try {
      // Crea oggetto email
      const sendSmtpEmail = {
        sender: {
          name: 'OrsoCook 🐻',
          email: this.fromEmail.match(/<(.+)>/)?.[1] || 'noreply@orsocook.us.ci'
        },
        to: [{
          email: options.to,
          name: options.to.split('@')[0]
        }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text || options.html.replace(/<[^>]*>/g, '')
      };

      // Invia email
      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('📧 Email inviata con successo via Brevo API:', {
        to: options.to,
        subject: options.subject,
        messageId: data.messageId
      });
      
      return true;
    } catch (error) {
      console.error('❌ Errore invio email via Brevo API:', {
        to: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : error,
        response: error.response?.body || 'No response body'
      });
      return false;
    }
  }

  /**
   * Template HTML per email di verifica
   */
  private getVerificationEmailHtml(username: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Conferma la tua registrazione su OrsoCook</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 0;
              background-color: #f4f4f7;
            }
            .container {
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              margin: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #7E69AB 0%, #9b87f5 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px; 
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #7E69AB 0%, #9b87f5 100%);
              color: white; 
              text-decoration: none; 
              padding: 16px 32px; 
              border-radius: 50px; 
              font-weight: 600; 
              font-size: 16px;
              box-shadow: 0 4px 10px rgba(126, 105, 171, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 15px rgba(126, 105, 171, 0.4);
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              color: #666; 
              font-size: 13px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #7E69AB;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .text-muted {
              color: #718096;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐻 OrsoCook</h1>
              <p style="margin-top: 10px; opacity: 0.9;">Benvenuto nella community!</p>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Ciao ${username}! 👋</h2>
              <p style="font-size: 16px;">Grazie per esserti registrato su <strong>OrsoCook</strong>, la tua nuova casa per ricette deliziose.</p>
              
              <div class="info-box">
                <p style="margin: 0;">Per completare la registrazione e iniziare a cucinare, conferma il tuo indirizzo email cliccando sul pulsante qui sotto:</p>
              </div>
              
              <div class="button-container">
                <a href="${verificationUrl}" class="button" style="color: white;">🔓 CONFERMA EMAIL</a>
              </div>
              
              <p style="color: #666; font-size: 15px;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 14px; word-break: break-all; margin: 15px 0;">
                <code style="color: #7E69AB;">${verificationUrl}</code>
              </div>
              
              <p><strong>⏰ Attenzione:</strong> Questo link scadrà tra <strong>24 ore</strong> per motivi di sicurezza.</p>
              
              <p style="margin-top: 30px;">Se non hai richiesto questa registrazione, ignora semplicemente questa email.</p>
              
              <p style="margin-top: 30px;">
                Buona cucina! 🍳<br>
                <strong>Il team di OrsoCook</strong>
              </p>
            </div>
            <div class="footer">
              <p>OrsoCook - La tua community di ricette preferita</p>
              <p>© ${new Date().getFullYear()} OrsoCook. Tutti i diritti riservati.</p>
              <p class="text-muted">
                <a href="${this.frontendUrl}/privacy" style="color: #7E69AB; text-decoration: none;">Privacy</a> • 
                <a href="${this.frontendUrl}/terms" style="color: #7E69AB; text-decoration: none;">Termini</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template testo per email di verifica
   */
  private getVerificationEmailText(username: string, verificationUrl: string): string {
    return `
      Conferma la tua registrazione su OrsoCook
      
      Ciao ${username},
      
      Grazie per esserti registrato su OrsoCook!
      
      Per completare la registrazione, conferma il tuo indirizzo email cliccando sul link qui sotto:
      
      ${verificationUrl}
      
      Il link scadrà tra 24 ore.
      
      Se non ti sei registrato su OrsoCook, ignora questa email.
      
      Buona cucina!
      Il team di OrsoCook
    `;
  }

  /**
   * Template HTML per email reset password
   */
  private getResetPasswordEmailHtml(username: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reimposta la tua password OrsoCook</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f7; }
            .container { background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #E65100 0%, #ff6b35 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #E65100 0%, #ff6b35 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 600; box-shadow: 0 4px 10px rgba(230, 81, 0, 0.3); }
            .warning-box { background-color: #fff3e0; border-left: 4px solid #E65100; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 13px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reimposta Password</h1>
            </div>
            <div class="content">
              <h2>Ciao ${username}!</h2>
              <p>Abbiamo ricevuto una richiesta per reimpostare la password del tuo account OrsoCook.</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">🔑 REIMPOSTA PASSWORD</a>
              </div>
              
              <div class="warning-box">
                <p style="margin: 0;"><strong>⚠️ Non hai richiesto questo reset?</strong> Ignora questa email. Il tuo account è al sicuro.</p>
              </div>
              
              <p>Il link scadrà tra <strong>1 ora</strong> per motivi di sicurezza.</p>
              
              <p style="margin-top: 30px;">Buona cucina! 🐻👨‍🍳</p>
            </div>
            <div class="footer">
              <p>OrsoCook - La tua community di ricette</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Estrae URL dal testo per logging in sviluppo
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }
}

// Esporta un'istanza singleton
export const emailService = new EmailService();