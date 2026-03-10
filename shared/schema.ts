import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const motorcycles = pgTable("motorcycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  engineSize: text("engine_size"),
  mileage: integer("mileage").notNull(),
  photos: text("photos"),
  description: text("description"),
  nftContractAddress: text("nft_contract_address"),
  nftTokenId: text("nft_token_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  motorcycleId: integer("motorcycle_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  mileage: integer("mileage").notNull(),
  cost: numeric("cost").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modifications = pgTable("modifications", {
  id: serial("id").primaryKey(),
  motorcycleId: integer("motorcycle_id").notNull(),
  title: text("title").notNull(),
  price: numeric("price").notNull(),
  installDate: text("install_date").notNull(),
  description: text("description"),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  motorcycles: many(motorcycles),
}));

export const motorcyclesRelations = relations(motorcycles, ({ one, many }) => ({
  user: one(users, {
    fields: [motorcycles.userId],
    references: [users.id],
  }),
  maintenance: many(maintenance),
  modifications: many(modifications),
}));

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
  motorcycle: one(motorcycles, {
    fields: [maintenance.motorcycleId],
    references: [motorcycles.id],
  }),
}));

export const modificationsRelations = relations(modifications, ({ one }) => ({
  motorcycle: one(motorcycles, {
    fields: [modifications.motorcycleId],
    references: [motorcycles.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMotorcycleSchema = createInsertSchema(motorcycles).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({
  id: true,
  createdAt: true,
});

export const insertModificationSchema = createInsertSchema(modifications).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Motorcycle = typeof motorcycles.$inferSelect;
export type InsertMotorcycle = z.infer<typeof insertMotorcycleSchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Modification = typeof modifications.$inferSelect;
export type InsertModification = z.infer<typeof insertModificationSchema>;
