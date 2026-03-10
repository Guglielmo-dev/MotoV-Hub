import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up basic session middleware for auth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'moto-vault-secret',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { secure: process.env.NODE_ENV === "production" }
  }));

  // Helper middleware to check auth
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists", field: "username" });
      }
      // Simple text password for demo, usually we'd hash this
      const user = await storage.createUser(input);
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

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);
      if (!user || user.password !== input.password) {
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

  return httpServer;
}
