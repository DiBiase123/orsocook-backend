export const getVerificationEmailText = (
  username: string,
  verificationUrl: string
): string => {
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
};