export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    try {
        const { problemText } = req.body;

        if (!problemText) {
            return res.status(400).json({ error: 'Testo del problema mancante' });
        }

        const systemPrompt = `Sei il motore di calcolo e tutor intelligente di StepPhysics. Il tuo compito è analizzare il problema di fisica fornito e risolverlo seguendo rigorosamente questa struttura in 4 passaggi, formattato con sintassi LaTeX ($...$ per inline e $$...$$ per staccate):
- STEP 1: Dati & Conversione S.I. -> Estrai grandezze note e ignote ed esprimi le conversioni nel Sistema Internazionale.
- STEP 2: Formula & Passaggi Algebrici -> Indica la legge fisica e spiega come ricavare l'eventuale formula inversa.
- STEP 3: Calcolo Numerico -> Sostituisci i valori ed esprimi il risultato finale evidente.
- STEP 4: Il Trabocchetto da Evitare -> Scrivi un breve avviso sull'errore o la distrazione più comune.
Vai dritto al punto, partendo direttamente dallo STEP 1.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Risolvi questo problema di fisica: ${problemText}` }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI Error:", data);
            return res.status(500).json({ success: false, error: data.error?.message || 'Errore OpenAI' });
        }

        const aiSolution = data.choices[0].message.content;
        return res.status(200).json({ success: true, solution: aiSolution });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
