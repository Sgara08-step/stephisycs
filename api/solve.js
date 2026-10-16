export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chiave API non configurata su Vercel' });
  }

  try {
    const { prompt, image } = req.body;

    const parts = [];

    if (prompt) {
      parts.push({ text: prompt });
    }

    if (image) {
      // Rimuove l'eventuale prefisso data:image/...;base64,
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    const systemInstruction = `Sei un tutor esperto di fisica. Risolvi il problema mostrato o descritto in modo chiaro, preciso e passo-passo in lingua italiana. 
Usa il formato Markdown per la risposta. Per le formule matematiche usa il formato LaTeX con $ per le formule inline e $$ per quelle su riga singola.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            parts: parts
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini Error:', data);
      return res.status(500).json({ error: data.error?.message || 'Errore durante la chiamata a Gemini' });
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna risposta generata.';

    return res.status(200).json({ result: textResult });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
