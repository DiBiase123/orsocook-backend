export const getResetPasswordEmailHtml = (
  username: string,
  resetUrl: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reimposta la tua password OrsoCook</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f4f4f7; 
          }
          .container { 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #E65100 0%, #ff6b35 100%); 
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
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
            background: linear-gradient(135deg, #E65100 0%, #ff6b35 100%); 
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 50px; 
            font-weight: 600; 
            box-shadow: 0 4px 10px rgba(230, 81, 0, 0.3); 
          }
          .warning-box { 
            background-color: #fff3e0; 
            border-left: 4px solid #E65100; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 8px; 
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            color: #666; 
            font-size: 13px; 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reimposta Password</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Ciao ${username}!</h2>
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
};