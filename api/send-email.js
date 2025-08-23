// api/send-email.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { template, name, phone, email, message } = req.body;
  if (!email || !template) return res.status(400).json({ error: "Email et template requis" });

  const visitorName = name && name.trim() !== "" ? name.trim() : "Visiteur";

  const payloadAdmin = {
    sender: { name: '01Marketing', email: 'contact@01marketing.fr' },
    to: [{ email: 'contact@01marketing.fr', name: '01Marketing' }],
    subject: `📩 Nouvelle demande : ${template}`,
    htmlContent: `<h3>Nouvelle demande reçue</h3>
                  <p><strong>Nom:</strong> ${name || 'N/A'}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Téléphone:</strong> ${phone || 'N/A'}</p>
                  <p><strong>Message:</strong> ${message || 'N/A'}</p>`
  };

  const payloadUser = {
    sender: { name: '01Marketing', email: 'contact@01marketing.fr' },
    to: [{ email, name: visitorName }],
    subject: "✅ Votre demande a bien été reçue",
    htmlContent: `<p>Bonjour ${visitorName},</p>
                  <p>Merci d’avoir choisi <strong>01MARKETING</strong>.</p>
                  <p>Nous avons bien reçu votre demande concernant le template <strong>${template}</strong>.</p>`
  };

  try {
    const [resAdmin, resUser] = await Promise.all([
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify(payloadAdmin)
      }),
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify(payloadUser)
      })
    ]);

    return res.status(200).json({ admin: await resAdmin.json(), user: await resUser.json() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
