import { users, motorcycles, maintenance, modifications, type User, type InsertUser, type Motorcycle, type InsertMotorcycle, type Maintenance, type InsertMaintenance, type Modification, type InsertModification } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getMotorcycles(userId: number): Promise<Motorcycle[]>;
  getMotorcycle(id: number): Promise<Motorcycle | undefined>;
  createMotorcycle(userId: number, mc: InsertMotorcycle): Promise<Motorcycle>;
  updateMotorcycle(id: number, updates: Partial<InsertMotorcycle>): Promise<Motorcycle>;
  deleteMotorcycle(id: number): Promise<void>;

  getMaintenanceEvents(motorcycleId: number): Promise<Maintenance[]>;
  createMaintenanceEvent(motorcycleId: number, m: InsertMaintenance): Promise<Maintenance>;
  deleteMaintenanceEvent(id: number): Promise<void>;

  getModifications(motorcycleId: number): Promise<Modification[]>;
  createModification(motorcycleId: number, mod: InsertModification): Promise<Modification>;
  deleteModification(id: number): Promise<void>;

  uploadRegistrationDocument(motorcycleId: number, documentUrl: string, registrationDate: string, initialMileage: number): Promise<Motorcycle>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getMotorcycles(userId: number): Promise<Motorcycle[]> {
    return db.select().from(motorcycles).where(eq(motorcycles.userId, userId));
  }

  async getMotorcycle(id: number): Promise<Motorcycle | undefined> {
    const [mc] = await db.select().from(motorcycles).where(eq(motorcycles.id, id));
    return mc || undefined;
  }

  async createMotorcycle(userId: number, mc: InsertMotorcycle): Promise<Motorcycle> {
    const [inserted] = await db.insert(motorcycles).values({ ...mc, userId }).returning();
    return inserted;
  }

  async updateMotorcycle(id: number, updates: Partial<InsertMotorcycle>): Promise<Motorcycle> {
    const [updated] = await db.update(motorcycles).set(updates).where(eq(motorcycles.id, id)).returning();
    return updated;
  }

  async deleteMotorcycle(id: number): Promise<void> {
    await db.delete(motorcycles).where(eq(motorcycles.id, id));
  }

  async getMaintenanceEvents(motorcycleId: number): Promise<Maintenance[]> {
    return db.select().from(maintenance).where(eq(maintenance.motorcycleId, motorcycleId));
  }

  async createMaintenanceEvent(motorcycleId: number, m: InsertMaintenance): Promise<Maintenance> {
    const [inserted] = await db.insert(maintenance).values({ ...m, motorcycleId }).returning();
    return inserted;
  }

  async deleteMaintenanceEvent(id: number): Promise<void> {
    await db.delete(maintenance).where(eq(maintenance.id, id));
  }

  async getModifications(motorcycleId: number): Promise<Modification[]> {
    return db.select().from(modifications).where(eq(modifications.motorcycleId, motorcycleId));
  }

  async createModification(motorcycleId: number, mod: InsertModification): Promise<Modification> {
    const [inserted] = await db.insert(modifications).values({ ...mod, motorcycleId }).returning();
    return inserted;
  }

  async deleteModification(id: number): Promise<void> {
    await db.delete(modifications).where(eq(modifications.id, id));
  }

  async uploadRegistrationDocument(motorcycleId: number, documentUrl: string, registrationDate: string, initialMileage: number): Promise<Motorcycle> {
    const [updated] = await db.update(motorcycles)
      .set({ registrationDocumentUrl: documentUrl, registrationDate, initialMileage })
      .where(eq(motorcycles.id, motorcycleId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
