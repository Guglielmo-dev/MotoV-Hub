import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import PgSessionStore from "connect-pg-simple";
import { pool } from "./db";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import { supabase } from "./supabase";
import { rateLimit } from "express-rate-limit";
import passport from "passport";
import { setupAuth } from "./auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  insertCommunityPostSchema,
  insertCommunityCommentSchema,
  insertTravelLogSchema,
  insertCustomThemeSchema,
  insertNotificationSchema,
  insertGameReleaseSchema,
  updateUsernameSchema,
  updateProfileSchema
} from "@shared/schema";
import { subMonths, format, parse, isValid, startOfMonth } from 'date-fns';
import { generateChatResponse } from "./ai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const PostgresStore = PgSessionStore(session);

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Troppi tentativi, riprova tra 15 minuti" }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { message: "Troppe richieste" }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Enforce session secret
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET non definita. Impostala nelle variabili d'ambiente.");
  }

  // Set up basic session middleware for auth
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Initialize Passport
  setupAuth();
  app.use(passport.initialize());
  app.use(passport.session());

  // Helper middleware to check auth
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ message: "Forbidden: Admin access required" });
    next();
  };

  // Funzione di utilità per rimuovere dati sensibili prima di inviare al client
  const sanitizeUser = (user: any) => {
    const { password, googleId, ...rest } = user;
    return rest;
  };


  // Multi-type upload endpoint (Images & Audio)
  app.post("/api/upload", authLimiter, requireAuth, upload.single("image"), async (req, res) => {
    console.log(`[Upload] Received request: ${req.file?.originalname} (${req.file?.mimetype})`);

    if (!req.file) {
      console.warn("[Upload] No file provided");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isAudio = req.file.mimetype.startsWith('audio/');
    const isImage = req.file.mimetype.startsWith('image/');

    // MIME type validation
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedAudioMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];

    if (isImage && !allowedImageMimes.includes(req.file.mimetype)) {
      console.warn(`[Upload] Image mime type not allowed: ${req.file.mimetype}`);
      return res.status(400).json({ message: "Formato immagine non supportato" });
    }

    if (isAudio && !allowedAudioMimes.includes(req.file.mimetype)) {
      console.warn(`[Upload] Audio mime type not allowed: ${req.file.mimetype}`);
      return res.status(400).json({ message: "Formato audio non supportato" });
    }

    if (!isImage && !isAudio) {
      console.warn(`[Upload] File type not allowed: ${req.file.mimetype}`);
      return res.status(400).json({ message: "Tipo di file non consentito" });
    }

    // Size limits check
    const sizeLimit = isAudio ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (req.file.size > sizeLimit) {
      console.warn(`[Upload] File size too large: ${req.file.size} bytes`);
      return res.status(400).json({
        message: `Il file supera il limite di ${isAudio ? '2MB' : '5MB'}`
      });
    }

    try {
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const bucketPath = isAudio ? `audio/${filename}` : filename;

      console.log(`[Upload] Uploading to Supabase: bucket=motorcycle-images, path=${bucketPath}`);

      const { error } = await supabase.storage
        .from("motorcycle-images")
        .upload(bucketPath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("[Upload] Supabase error:", error);
        return res.status(500).json({ message: "Errore durante l'upload su Supabase" });
      }

      const { data } = supabase.storage
        .from("motorcycle-images")
        .getPublicUrl(bucketPath);

      console.log(`[Upload] Success! Public URL: ${data.publicUrl}`);
      res.json({ url: data.publicUrl });
    } catch (err) {
      console.error("[Upload] Handler exception:", err);
      res.status(500).json({ message: "Internal server error during upload" });
    }
  });

  // Auth Routes
  app.post(api.auth.register.path, authLimiter, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists", field: "username" });
      }

      // Password Hashing (SICUREZZA 1)
      if (!input.password) {
        return res.status(400).json({ message: "La password è obbligatoria per la registrazione manuale", field: "password" });
      }
      const hashedPassword = await bcrypt.hash(input.password, 12);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword
      });

      (req.session as any).userId = user.id;
      res.status(201).json(sanitizeUser(user));
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message, field: err.issues[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, authLimiter, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);

      // Secure Password Comparison (SICUREZZA 1)
      if (!user || !user.password || !(await bcrypt.compare(input.password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      (req.session as any).userId = user.id;
      res.status(200).json(sanitizeUser(user));
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(200).json(sanitizeUser(user));
  });

  // Motorcycle Routes
  // Motorcycle Routes
  app.post('/api/scan-libretto-and-save', requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessuna immagine fornita" });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY non definita nelle variabili d'ambiente");
      }
      
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest"
      });

      const base64Image = req.file.buffer.toString('base64');

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: req.file.mimetype as string,
            data: base64Image,
          }
        },
        {
          text: `Sei un esperto di documenti di registrazione veicoli 
italiani e internazionali (libretti, carte di circolazione, 
vehicle registration documents).

Analizza attentamente questo documento ed estrai i dati 
del veicolo/motociclo.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido.
Zero testo aggiuntivo, zero markdown, zero backtick.
Solo il JSON grezzo.

{
  "brand": "marca del veicolo (es. Kawasaki, Ducati, BMW, Honda)",
  "model": "modello esatto (es. Z900, Panigale V4, R1250GS)",
  "year": anno come numero intero (es. 2021),
  "engineSize": "cilindrata solo in numeri (es. 948)",
  "mileage": 0,
  "registrationDate": "data formato YYYY-MM-DD oppure null",
  "description": null
}

Regole importanti:
- year deve essere numero intero, mai stringa
- mileage è sempre 0 (non presente sul libretto)
- engineSize: solo cifre, niente unità (no "cc" no "cm3")
- registrationDate: formato YYYY-MM-DD oppure null
- Se un campo non è leggibile o non presente: null
- Se il documento NON è un documento veicolo:
  {"error": "non_vehicle_document"}`
        }
      ]);

      const responseText = result.response.text().trim();

      let extractedData;
      try {
        // Rimuovi eventuali backtick o markdown rimasti
        const cleanJson = responseText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        extractedData = JSON.parse(cleanJson);
      } catch {
        console.error("Gemini response non parsabile:", responseText);
        return res.status(500).json({ 
          message: "Risposta AI non valida, riprova" 
        });
      }

      if (extractedData.error === 'non_vehicle_document') {
        return res.status(422).json({ 
          message: "non_vehicle_document" 
        });
      }

      // Applica valori default per i campi null
      const motorcycleData = {
        brand: extractedData.brand || "Sconosciuto",
        model: extractedData.model || "Sconosciuto",
        year: extractedData.year || new Date().getFullYear(),
        engineSize: extractedData.engineSize || "",
        mileage: 0,
        registrationDate: extractedData.registrationDate || null,
        description: null,
        photos: null,
      };

      const userId = (req.session as any).userId;
      const motorcycle = await storage.createMotorcycle(userId, motorcycleData as any);
      return res.status(201).json(motorcycle);
    } catch (err: any) {
      console.error("[ScanLibretto] Error:", err.stack || err.message || err);
      
      if (err.status === 429 || 
          err.message?.includes('quota') ||
          err.message?.includes('rate limit') ||
          err.message?.includes('Too Many Requests')) {
        return res.status(429).json({
          message: "Servizio temporaneamente occupato. Attendi 10 secondi e riprova."
        });
      }
      if (err.status === 408 || err.type === 'timeout') {
        return res.status(504).json({ message: "Servizio lento, riprova" });
      }
      res.status(500).json({ message: "Errore durante la scansione" });
    }
  });

  app.get(api.motorcycles.list.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const motorcycles = await storage.getMotorcycles(userId);
    res.json(motorcycles);
  });

  app.post(api.motorcycles.create.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const input = api.motorcycles.create.input.parse(req.body);
      const motorcycle = await storage.createMotorcycle(userId, input);
      res.status(201).json(motorcycle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message, field: err.issues[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.motorcycles.get.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const motorcycle = await storage.getMotorcycle(Number(req.params.id));
    if (!motorcycle || motorcycle.userId !== userId) {
      return res.status(404).json({ message: "Motorcycle not found" });
    }
    res.json(motorcycle);
  });

  app.put(api.motorcycles.update.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const id = Number(req.params.id);
      const motorcycle = await storage.getMotorcycle(id);
      if (!motorcycle || motorcycle.userId !== userId) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      const input = api.motorcycles.update.input.parse(req.body);
      const updated = await storage.updateMotorcycle(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.motorcycles.delete.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const id = Number(req.params.id);
    const motorcycle = await storage.getMotorcycle(id);
    if (!motorcycle || motorcycle.userId !== userId) {
      return res.status(404).json({ message: "Motorcycle not found" });
    }
    await storage.deleteMotorcycle(id);
    res.status(204).send();
  });

  // Maintenance Routes
  app.get(api.maintenance.list.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const motorcycleId = Number(req.params.motorcycleId);
    const motorcycle = await storage.getMotorcycle(motorcycleId);
    if (!motorcycle || motorcycle.userId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const events = await storage.getMaintenanceEvents(motorcycleId);
    res.json(events);
  });

  app.post(api.maintenance.create.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const motorcycleId = Number(req.params.motorcycleId);
      const motorcycle = await storage.getMotorcycle(motorcycleId);
      if (!motorcycle || motorcycle.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const inputSchema = api.maintenance.create.input.extend({
        cost: z.coerce.number().or(z.string()),
      });
      const input = inputSchema.parse(req.body);
      const event = await storage.createMaintenanceEvent(motorcycleId, {
        ...input,
        motorcycleId,
        cost: String(input.cost), // Store as string for numeric in pg
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.maintenance.delete.path, requireAuth, async (req, res) => {
    await storage.deleteMaintenanceEvent(Number(req.params.id));
    res.status(204).send();
  });

  // Modifications Routes
  app.get(api.modifications.list.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const motorcycleId = Number(req.params.motorcycleId);
    const motorcycle = await storage.getMotorcycle(motorcycleId);
    if (!motorcycle || motorcycle.userId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const mods = await storage.getModifications(motorcycleId);
    res.json(mods);
  });

  app.post(api.modifications.create.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const motorcycleId = Number(req.params.motorcycleId);
      const motorcycle = await storage.getMotorcycle(motorcycleId);
      if (!motorcycle || motorcycle.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const inputSchema = api.modifications.create.input.extend({
        price: z.coerce.number().or(z.string()),
      });
      const input = inputSchema.parse(req.body);
      const mod = await storage.createModification(motorcycleId, {
        ...input,
        motorcycleId,
        price: String(input.price),
      });
      res.status(201).json(mod);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.modifications.delete.path, requireAuth, async (req, res) => {
    await storage.deleteModification(Number(req.params.id));
    res.status(204).send();
  });

  // Dashboard Summary Route
  app.get(api.dashboard.summary.path, requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const motorcycles = await storage.getMotorcycles(userId);
    let totalExpenses = 0;
    const recentActivity = [];
    const maintenanceSoon = [];

    // Initialize monthly expenses for last 6 months using date-fns for robustness
    const monthlyExpensesMap = new Map<string, number>();
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(startOfMonth(now), i);
      const monthKey = format(d, 'yyyy-MM');
      monthlyExpensesMap.set(monthKey, 0);
    }

    const parseFlexibleDate = (dateStr: string) => {
      if (!dateStr) return null;
      // Try ISO first
      let d = new Date(dateStr);
      if (isValid(d)) return d;

      // Try M/D/YYYY (common in the app's current display)
      d = parse(dateStr, 'M/d/yyyy', new Date());
      if (isValid(d)) return d;

      // Try D/M/YYYY
      d = parse(dateStr, 'd/M/yyyy', new Date());
      if (isValid(d)) return d;

      return null;
    };

    for (const mc of motorcycles) {
      const maintenance = await storage.getMaintenanceEvents(mc.id);
      const mods = await storage.getModifications(mc.id);

      for (const m of maintenance) {
        const cost = Number(m.cost);
        totalExpenses += cost;

        const date = parseFlexibleDate(m.date);
        if (date) {
          const monthKey = format(date, 'yyyy-MM');
          if (monthlyExpensesMap.has(monthKey)) {
            monthlyExpensesMap.set(monthKey, (monthlyExpensesMap.get(monthKey) || 0) + cost);
          }
        }

        recentActivity.push({
          type: 'maintenance',
          date: m.date,
          title: m.title,
          description: `${m.title} on ${mc.brand} ${mc.model}`,
          cost: m.cost
        });
      }

      for (const m of mods) {
        const price = Number(m.price);
        totalExpenses += price;

        const date = parseFlexibleDate(m.installDate);
        if (date) {
          const monthKey = format(date, 'yyyy-MM');
          if (monthlyExpensesMap.has(monthKey)) {
            monthlyExpensesMap.set(monthKey, (monthlyExpensesMap.get(monthKey) || 0) + price);
          }
        }

        recentActivity.push({
          type: 'modification',
          date: m.installDate,
          title: `Mod: ${m.title}`,
          description: `Installed ${m.title} on ${mc.brand} ${mc.model}`,
          cost: m.price
        });
      }
    }

    recentActivity.sort((a, b) => {
      const dateA = parseFlexibleDate(a.date);
      const dateB = parseFlexibleDate(b.date);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    const formattedMonthlyExpenses = Array.from(monthlyExpensesMap.entries())
      .map(([key, amount]) => {
        const date = parse(key, 'yyyy-MM', new Date());
        return {
          month: format(date, 'MMM'),
          amount
        };
      });

    const totalMileage = motorcycles.reduce((sum, mc) => sum + (mc.mileage || 0), 0);

    res.json({
      motorcycleCount: motorcycles.length,
      totalExpenses,
      totalMileage,
      recentActivity: recentActivity.slice(0, 5),
      monthlyExpenses: formattedMonthlyExpenses,
      maintenanceSoon: recentActivity.filter(a => a.type === 'maintenance').slice(0, 3) // Placeholder for UI
    });
  });

  // Registration Document Upload Route
  app.post(api.documents.uploadRegistration.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const motorcycleId = Number(req.params.motorcycleId);
      const motorcycle = await storage.getMotorcycle(motorcycleId);
      if (!motorcycle || motorcycle.userId !== userId) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      const input = api.documents.uploadRegistration.input.parse(req.body);
      const updated = await storage.uploadRegistrationDocument(motorcycleId, input.documentUrl, input.registrationDate, input.initialMileage);

      let maintenanceCreated = false;
      if (input.createMaintenanceRecord) {
        await storage.createMaintenanceEvent(motorcycleId, {
          title: `Vehicle Registration - Initial Service Record`,
          date: input.registrationDate,
          mileage: input.initialMileage,
          motorcycleId,
          cost: "0",
          notes: `Initial maintenance record created from registration document. Registered on ${input.registrationDate} with initial mileage of ${input.initialMileage} km.`,
        });
        maintenanceCreated = true;
      }

      res.json({ motorcycle: updated, maintenanceCreated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Add Historical Maintenance Route
  app.post(api.documents.addHistoricalMaintenance.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const motorcycleId = Number(req.params.motorcycleId);
      const motorcycle = await storage.getMotorcycle(motorcycleId);
      if (!motorcycle || motorcycle.userId !== userId) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      const input = api.documents.addHistoricalMaintenance.input.parse(req.body);
      const record = await storage.createMaintenanceEvent(motorcycleId, {
        title: input.title,
        date: input.date,
        mileage: input.mileage,
        motorcycleId,
        cost: input.cost || "0",
        notes: input.notes,
      });
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // ── Community Routes ──────────────────────────────────────────────────────

  app.get('/api/community/posts', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const posts = await storage.getCommunityPosts(userId);
    res.json(posts);
  });

  app.post('/api/community/posts', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const input = insertCommunityPostSchema.parse(req.body);
      const post = await storage.createCommunityPost(userId, input);
      const withMeta = await storage.getCommunityPost(post.id, userId);
      res.status(201).json(withMeta);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.patch('/api/community/posts/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const id = Number(req.params.id);
      const input = insertCommunityPostSchema.partial().parse(req.body);
      const post = await storage.updateCommunityPost(id, userId, input);
      const withMeta = await storage.getCommunityPost(post.id, userId);
      res.json(withMeta);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        const msg = err instanceof Error ? err.message : "Internal server error";
        res.status(msg === "Post not found or unauthorized" ? 403 : 500).json({ message: msg });
      }
    }
  });

  app.get('/api/community/posts/:id', requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id as string);
      const userId = (req.session as any).userId;

      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await storage.getCommunityPost(postId, userId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/community/posts/:id', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteCommunityPost(Number(req.params.id), userId);
    res.status(204).send();
  });

  app.get('/api/community/posts/:id/comments', requireAuth, async (req, res) => {
    const comments = await storage.getCommunityComments(Number(req.params.id as string));
    res.json(comments);
  });

  app.post('/api/community/posts/:id/comments', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const postId = Number(req.params.id as string);
      const { content, parentId } = z.object({ 
        content: z.string().min(1),
        parentId: z.number().optional()
      }).parse(req.body);
      const comment = await storage.createCommunityComment(postId, userId, content, parentId);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.delete('/api/community/comments/:id', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteCommunityComment(Number(req.params.id), userId);
    res.status(204).send();
  });

  app.post('/api/community/posts/:id/like', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const result = await storage.toggleCommunityLike(Number(req.params.id), userId);
    res.json(result);
  });

  // ── Travel Log Routes ─────────────────────────────────────────────────────

  app.get('/api/travel', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const logs = await storage.getTravelLogs(userId);
    res.json(logs);
  });

  app.post('/api/travel', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const input = insertTravelLogSchema.parse(req.body);
      const log = await storage.createTravelLog(userId, input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.put('/api/travel/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const id = Number(req.params.id);
      const input = insertTravelLogSchema.partial().parse(req.body);
      const log = await storage.updateTravelLog(id, userId, input);
      res.json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.delete('/api/travel/:id', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteTravelLog(Number(req.params.id), userId);
    res.status(204).send();
  });

  // ── Custom Theme Routes ───────────────────────────────────────────────────

  app.get('/api/themes', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const themes = await storage.getCustomThemes(userId);
    res.json(themes);
  });

  app.post('/api/themes', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const input = insertCustomThemeSchema.parse(req.body);
      const theme = await storage.createCustomTheme(userId, input);
      res.status(201).json(theme);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(400).json({ message: err instanceof Error ? err.message : 'Internal server error' });
      }
    }
  });

  app.delete('/api/themes/:id', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteCustomTheme(Number(req.params.id), userId);
    res.status(204).send();
  });

  app.patch('/api/user/username', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { username } = updateUsernameSchema.parse(req.body);

      // Verifica unicità username
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Username già occupato" });
      }

      const updated = await storage.updateUserPreferences(userId, { username });
      res.json(sanitizeUser(updated));
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  // ── User Preferences Routes ───────────────────────────────────────────────

  app.patch('/api/user/preferences', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const schema = z.object({
        audioEnabled: z.boolean().optional(),
        customAudioData: z.string().optional(),
        customAudioName: z.string().optional(),
        activeBrandId: z.string().optional().nullable(),
        activeCustomColor: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const updated = await storage.updateUserPreferences(userId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.delete('/api/user', requireAuth, async (req, res, next) => {
    try {
      const userId = (req.session as any).userId;
      await storage.deleteUser(userId);
      
      // Cleanup session and passport auth
      req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
          if (err) return next(err);
          res.clearCookie('connect.sid');
          res.status(204).send();
        });
      });
    } catch (e) {
      next(e);
    }
  });

  app.patch('/api/user', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = updateProfileSchema.parse(req.body);
      
      // Se lo username cambia, verifica che non sia già preso
      if (data.username) {
        const existing = await storage.getUserByUsername(data.username);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "Username già occupato" });
        }
      }

      const updated = await storage.updateUserPreferences(userId, data);
      res.json(sanitizeUser(updated));
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.post('/api/user/avatar', requireAuth, uploadLimiter, upload.single('avatar'), async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!req.file) return res.status(400).json({ message: "Nessun file caricato" });

      const fileExt = path.extname(req.file.originalname);
      const fileName = `avatar_${userId}_${Date.now()}${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('motorcycle-photos') // Riutilizziamo lo stesso bucket
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('motorcycle-photos')
        .getPublicUrl(filePath);

      const updated = await storage.updateUserPreferences(userId, { avatarUrl: publicUrl });
      res.json(sanitizeUser(updated));
    } catch (err) {
      console.error("Avatar Upload Error:", err);
      res.status(500).json({ message: 'Errore durante l\'upload dell\'avatar' });
    }
  });

  // ── Ratings Routes ───────────────────────────────────────────────────────

  app.post(api.ratings.submit.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const input = api.ratings.submit.input.parse(req.body);
      const rating = await storage.upsertRating(userId, input);
      res.json(rating);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.get(api.ratings.get.path, async (req, res) => {
    const { targetType, targetId } = req.params;
    const userId = (req.session as any).userId;
    
    const stats = await storage.getAverageRating(targetType, targetId);
    let userRating = null;
    if (userId) {
      userRating = await storage.getUserRating(userId, targetType, targetId);
    }
    
    res.json({
      ...stats,
      userRating
    });
  });

  // ── Game Releases Routes ────────────────────────────────────────────────
  app.get('/api/game-releases', async (req, res) => {
    try {
      const releases = await storage.getGameReleases();
      res.json(releases);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/game-releases', requireAdmin, async (req, res) => {
    try {
      const input = insertGameReleaseSchema.parse(req.body);
      const release = await storage.createGameRelease(input);
      res.status(201).json(release);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.delete('/api/game-releases/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteGameRelease(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ── Notification Routes ──────────────────────────────────────────────────
  app.get('/api/notifications', requireAuth, async (req, res) => {
    const notifications = await storage.getNotifications();
    res.json(notifications);
  });

  app.post('/api/notifications', requireAdmin, async (req, res) => {
    try {
      const input = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(input);
      res.status(201).json(notification);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.delete('/api/notifications/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteNotification(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications/read', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.updateUserLastRead(userId);
    res.status(200).json({ success: true });
  });

  // ── Game Scores Routes ──────────────────────────────────────────────────
  app.get('/api/games/:gameId/scores', requireAuth, async (req, res) => {
    try {
      const gameId = req.params.gameId as string;
      const userId = (req.session as any).userId;
      const scores = await storage.getGameScores(gameId, userId);
      res.json(scores);
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/games/:gameId/scores', requireAuth, async (req, res) => {
    try {
      const gameId = req.params.gameId as string;
      const userId = (req.session as any).userId;
      const { score } = z.object({ score: z.number() }).parse(req.body);
      const gameScore = await storage.submitGameScore(userId, gameId, score);
      
      // Return updated bests
      const bests = await storage.getGameScores(req.params.gameId as string, userId);
      res.status(201).json(bests);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  // ── Google Auth Routes ──────────────────────────────────────────────────

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/login?error=oauth" }),
    (req, res) => {
      // Sync Passport user with existing manual session logic
      if (req.user) {
        (req.session as any).userId = (req.user as any).id;
      }
      res.redirect("/");
    }
  );

  // ── AI Chat Route ───────────────────────────────────────────────────────
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) return res.status(400).json({ message: "Messaggio mancante" });
      
      const response = await generateChatResponse(message, history);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
