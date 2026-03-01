export const getVerificationEmailHtml = (
  username: string, 
  verificationUrl: string,
  frontendUrl: string
): string => {
  const currentYear = new Date().getFullYear();
  
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
            <p>© ${currentYear} OrsoCook. Tutti i diritti riservati.</p>
            <p class="text-muted">
              <a href="${frontendUrl}/privacy" style="color: #7E69AB; text-decoration: none;">Privacy</a> • 
              <a href="${frontendUrl}/terms" style="color: #7E69AB; text-decoration: none;">Termini</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};