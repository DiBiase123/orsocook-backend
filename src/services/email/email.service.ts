import dotenv from 'dotenv';
import { BrevoClient } from './brevo.client';
import { getVerificationEmailHtml } from './templates/verification.html';
import { getVerificationEmailText } from './templates/verification.text';
import { getResetPasswordEmailHtml } from './templates/reset-password.html';

dotenv.config();

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
    const brevoApiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.SMTP_FROM || 'noreply@orsocook.us.ci';

    // 🔍 DEBUG: verifica chiave API
    console.log('🔑 DEBUG - API Key presente:', !!brevoApiKey);
    console.log('🔑 DEBUG - API Key (primi 10 caratteri):', brevoApiKey?.substring(0, 10) + '...');
    console.log('🔑 DEBUG - API Key inizia con xkeysib?', brevoApiKey?.startsWith('xkeysib'));

    if (!brevoApiKey) {
      console.warn('⚠️ Configurazione Brevo incompleta. Email non saranno inviate.');
      console.warn('   Imposta: BREVO_API_KEY');
      this.isConfigured = false;
    } else {
      try {
        this.apiInstance = BrevoClient.initialize(brevoApiKey);
        this.isConfigured = true;
        console.log('✅ Brevo API configurata con successo');
      } catch (error) {
        console.error('❌ Errore configurazione Brevo:', error);
        this.isConfigured = false;
      }
    }

    this.fromEmail = `"OrsoCook 🐻" <${fromEmail}>`;
    this.backendUrl = this.getBackendUrl();
    this.frontendUrl = this.getFrontendUrl();
    
    console.log('🌐 URL Configurazione:');
    console.log(`   Backend: ${this.backendUrl}`);
    console.log(`   Frontend: ${this.frontendUrl}`);
  }

  private getBackendUrl(): string {
    const customBackendUrl = process.env.BACKEND_URL;
    if (customBackendUrl) return customBackendUrl;
    if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
    const port = process.env.PORT || '5000';
    return `http://localhost:${port}`;
  }

  private getFrontendUrl(): string {
    const customFrontendUrl = process.env.FRONTEND_URL;
    if (customFrontendUrl) return customFrontendUrl;
    return 'https://dibiase123.github.io/orsocook';
  }

  async sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    
    const html = getVerificationEmailHtml(username, verificationUrl, this.frontendUrl);
    const text = getVerificationEmailText(username, verificationUrl);

    return this.sendEmail({
      to: email,
      subject: '🐻 Conferma la tua email per OrsoCook',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    const html = getResetPasswordEmailHtml(username, resetUrl);
    const text = `Reimposta la tua password: ${resetUrl}`;

    return this.sendEmail({
      to: email,
      subject: '🔐 Reimposta la tua password OrsoCook',
      html,
      text,
    });
  }

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

      console.log('📤 DEBUG - Tentativo invio email a Brevo:', {
        to: options.to,
        subject: options.subject,
        sender: this.fromEmail.match(/<(.+)>/)?.[1] || 'noreply@orsocook.us.ci'
      });

      const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('📧 Email inviata con successo via Brevo API:', {
        to: options.to,
        subject: options.subject,
        messageId: data.messageId
      });
      
      return true;
    } catch (error) {
      console.error('❌ DEBUG - Errore dettagliato:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data || error.response?.body || 'Nessuna risposta',
        status: error.response?.status
      });
      return false;
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }
}

export const emailService = new EmailService();