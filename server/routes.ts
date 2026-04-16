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
import {
  insertCommunityPostSchema,
  insertCommunityCommentSchema,
  insertTravelLogSchema,
  insertCustomThemeSchema
} from "@shared/schema";
import { subMonths, format, parse, isValid, startOfMonth } from 'date-fns';

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

  // Helper middleware to check auth
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
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
      const hashedPassword = await bcrypt.hash(input.password, 12);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword
      });

      (req.session as any).userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
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
      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      (req.session as any).userId = user.id;
      res.status(200).json(user);
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
    res.status(200).json(user);
  });

  // Motorcycle Routes
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
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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

    res.json({
      motorcycleCount: motorcycles.length,
      totalExpenses,
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
      const input = insertCommunityCommentSchema.pick({ content: true }).parse(req.body);
      const comment = await storage.createCommunityComment(postId, userId, input.content);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
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
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  return httpServer;
}
