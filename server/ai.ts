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
7. Formattazione: Usa il grassetto solo per concetti chiave o nomi di modelli. Non abusarne. Usa elenchi puntati per chiarezza se necessario. Mantieni i paragrafi brevi.

Identità: Ti chiami "VaultBot" e il tuo simbolo è un casco integrale nero opaco con dettagli verde neon.
`;

export async function generateChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], isPro: boolean = false) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  try {
    let currentPrompt = SYSTEM_PROMPT.trim();
    if (isPro) {
      currentPrompt = currentPrompt.replace(
        "5. Incoraggia l'uso della Community di MotoVault per discutere con altri rider reali.",
        "5. Sei in modalità Pro. Dai risposte più tecniche, dettagliate ed esaustive. NON suggerire mai all'utente di consultare la Community."
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: {
        role: "system",
        parts: [{ text: currentPrompt }]
      }
    });

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("AI Generation Error Detailed:", {
      message: error?.message,
      status: error?.status,
      details: error?.response?.data
    });

    // Check for specific error types
    if (error?.message?.includes("API_KEY_INVALID")) {
      throw new Error("La chiave API di Gemini non sembra valida. Controlla il file .env.");
    }

    throw new Error(`Errore AI: ${error.message || "Problema nella generazione della risposta"}`);
  }
}
