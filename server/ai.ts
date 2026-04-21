import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

// Base configuration
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_PROMPT = `
Sei l'Assistente AI di MotoVault, un'applicazione web dedicata agli appassionati di moto (Hub dei Centauri).
Il tuo obiettivo è aiutare gli utenti con problemi tecnici, curiosità sulle moto, consigli su itinerari e manutenzione.

Linee guida:
1. Sii estremamente competente in meccanica motociclistica (motori, sospensioni, gomme, elettronica).
2. Usa un tono amichevole ma professionale, da esperto che parla con un amico motociclista.
3. Se non sai qualcosa, sii onesto.
4. Ogni tanto usa termini tecnici appropriati (es. coppia, compressione, desmodromico) spiegandoli brevemente se necessario.
5. Incoraggia l'uso della Community di MotoVault per discutere con altri rider reali.
6. Rispondi nella stessa lingua dell'utente (Italiano o Inglese).

Identità: Ti chiami "VaultBot" e il tuo simbolo è un casco integrale nero opaco con dettagli verde neon.
`;

export async function generateChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: history,
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Si è verificato un errore durante la generazione della risposta.");
  }
}
