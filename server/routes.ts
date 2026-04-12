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
import fs from "fs";
import bcrypt from "bcrypt";
import { rateLimit } from "express-rate-limit";
import { 
  insertCommunityPostSchema, 
  insertCommunityCommentSchema, 
  insertTravelLogSchema 
} from "@shared/schema";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: diskStorage, limits: { fileSize: 10 * 1024 * 1024 } });

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

  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadDir));

  // Image upload endpoint
  app.post("/api/upload", authLimiter, requireAuth, upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    // MIME type validation
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Formato file non supportato" });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
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

    for (const mc of motorcycles) {
      const maintenance = await storage.getMaintenanceEvents(mc.id);
      const mods = await storage.getModifications(mc.id);

      for (const m of maintenance) {
        totalExpenses += Number(m.cost);
        recentActivity.push({ type: 'maintenance', date: m.date, description: `${m.title} on ${mc.brand} ${mc.model}`, cost: m.cost });
      }
      for (const m of mods) {
        totalExpenses += Number(m.price);
        recentActivity.push({ type: 'modification', date: m.installDate, description: `Installed ${m.title} on ${mc.brand} ${mc.model}`, cost: m.price });
      }
    }

    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      motorcycleCount: motorcycles.length,
      totalExpenses,
      recentActivity: recentActivity.slice(0, 10), // Top 10 recent
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

  app.delete('/api/community/posts/:id', requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.deleteCommunityPost(Number(req.params.id), userId);
    res.status(204).send();
  });

  app.get('/api/community/posts/:id/comments', requireAuth, async (req, res) => {
    const comments = await storage.getCommunityComments(Number(req.params.id));
    res.json(comments);
  });

  app.post('/api/community/posts/:id/comments', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const postId = Number(req.params.id);
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

  return httpServer;
}
