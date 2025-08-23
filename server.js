// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();
console.log('Clé API Brevo:', process.env.BREVO_API_KEY);
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route POST pour envoyer l'email via Brevo
app.post('/send-email', async (req, res) => {
  const { template, name, phone, email, message } = req.body;

  if (!email || !template) {
    return res.status(400).json({ error: "Le champ email et template sont requis." });
  }

  // Sécuriser le nom du visiteur
  const visitorName = name && name.trim() !== "" ? name.trim() : "Visiteur";

  // Payload Admin
  const payloadAdmin = {
    sender: { name: '01Marketing', email: 'contact@01marketing.fr' },
    to: [{ email: 'contact@01marketing.fr', name: '01Marketing' }],
    subject: `📩 Nouvelle demande : ${template}`,
    htmlContent: `<h3>Nouvelle demande reçue</h3>
                  <p><strong>Nom:</strong> ${name || 'N/A'}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Téléphone:</strong> ${phone || 'N/A'}</p>
                  <p><strong>Message:</strong> ${message || 'N/A'}</p>
                  <br><p>⚡ Depuis le formulaire du site.</p>`
  };

  // Payload Visiteur
  const payloadUser = {
    sender: { name: '01Marketing', email: 'contact@01marketing.fr' },
    to: [{ email, name: visitorName }],
    subject: "✅ Votre demande a bien été reçue",
    htmlContent: `<p>Bonjour ${visitorName} 👋,</p>
                  <p>Merci d’avoir choisi <strong>01MARKETING</strong> 🎯</p>
                  <p>Nous avons bien reçu votre demande concernant le template <strong>${template}</strong>.</p>
                  <p>Notre équipe vous répondra très rapidement avec tous les détails nécessaires 🚀</p>
                  <br>
                  <p>À très vite,</p>
                  <p><strong>Équipe 01MARKETING - Tanger</strong></p>`
  };

  // Logs pour debug
  console.log('Payload Admin:', payloadAdmin);
  console.log('Payload User:', payloadUser);
  console.log('Clé API Brevo:', process.env.BREVO_API_KEY);

  try {
    // Envoi en parallèle
    const [resAdmin, resUser] = await Promise.all([
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify(payloadAdmin)
      }),
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify(payloadUser)
      })
    ]);

    if (!resAdmin.ok || !resUser.ok) {
      const errAdmin = await resAdmin.json();
      const errUser = await resUser.json();
      console.error("❌ Erreur API Brevo:", errAdmin, errUser);
      return res.status(500).json({ error: "Erreur API Brevo", details: { admin: errAdmin, user: errUser } });
    }

    console.log("✅ Email envoyé à l’admin :", payloadAdmin.to[0].email);
    console.log("📩 Email de confirmation envoyé au visiteur :", email);

    res.status(200).json({ message: 'Emails envoyés avec succès' });

  } catch (error) {
    console.error("🔥 Erreur serveur :", error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
