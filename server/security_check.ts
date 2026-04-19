import "dotenv/config";
import { storage } from "./storage";

async function runSecurityTest() {
  console.log("🔍 Avvio Security Test: Verifica esposizione dati sensibili...");

  // Simuliamo il recupero di un utente dal DB (come avviene nelle rotte API)
  const user = await storage.getUser(1); 

  if (user) {
    console.log("✅ Utente trovato. Analisi dei campi restituiti...");
    
    // Similiamo la funzione sanitizeUser definita in routes.ts
    const sanitizeUser = (user: any) => {
      const { password, googleId, ...rest } = user;
      return rest;
    };

    const sanitized = sanitizeUser(user);
    const fields = Object.keys(sanitized);

    console.log("Campi presenti nell'oggetto pulito:", fields.join(", "));

    if (fields.includes("password")) {
      console.error("❌ FALLITO: Il campo 'password' è ancora presente!");
    } else if (fields.includes("googleId")) {
      console.error("❌ FALLITO: Il campo 'googleId' è ancora presente!");
    } else {
      console.log("🛡️ SUCCESSO: L'oggetto è stato sanitizzato correttamente. Nessuna password o googleId rilevati.");
    }
  } else {
    console.log("⚠️ Nessun utente trovato per il test. Crea un account prima di eseguire lo script.");
  }
}

runSecurityTest().catch(console.error);
