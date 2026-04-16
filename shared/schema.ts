import { pgTable, text, serial, integer, timestamp, numeric, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // User Preferences
  audioEnabled: boolean("audio_enabled").default(true),
  customAudioData: text("custom_audio_data"),
  customAudioName: text("custom_audio_name"),
  activeBrandId: text("active_brand_id").default('kawasaki'),
  activeCustomColor: text("active_custom_color"), // If set, activeBrandId should be treated as null
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
  registrationDocumentUrl: text("registration_document_url"),
  registrationDate: text("registration_date"),
  initialMileage: integer("initial_mileage"),
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

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull().default('general'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityLikes = pgTable("community_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const travelLogs = pgTable("travel_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  visitDate: text("visit_date").notNull(),
  description: text("description").notNull(),
  highlights: text("highlights"),
  imageUrl: text("image_url"),
  isUpcoming: boolean("is_upcoming").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customThemes = pgTable("custom_themes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  brandName: text("brand_name").notNull(),
  primaryColor: text("primary_color").notNull(), // hex es. #FFD700
  createdAt: timestamp("created_at").defaultNow(),
});

export type CustomTheme = typeof customThemes.$inferSelect;
export type InsertCustomTheme = z.infer<typeof insertCustomThemeSchema>;

export const usersRelations = relations(users, ({ many }) => ({
  motorcycles: many(motorcycles),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
  travelLogs: many(travelLogs),
  customThemes: many(customThemes),
}));

export const motorcyclesRelations = relations(motorcycles, ({ one, many }) => ({
  user: one(users, { fields: [motorcycles.userId], references: [users.id] }),
  maintenance: many(maintenance),
  modifications: many(modifications),
}));

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
  motorcycle: one(motorcycles, { fields: [maintenance.motorcycleId], references: [motorcycles.id] }),
}));

export const modificationsRelations = relations(modifications, ({ one }) => ({
  motorcycle: one(motorcycles, { fields: [modifications.motorcycleId], references: [motorcycles.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, { fields: [communityPosts.userId], references: [users.id] }),
  comments: many(communityComments),
  likes: many(communityLikes),
}));

export const communityCommentsRelations = relations(communityComments, ({ one }) => ({
  post: one(communityPosts, { fields: [communityComments.postId], references: [communityPosts.id] }),
  user: one(users, { fields: [communityComments.userId], references: [users.id] }),
}));

export const travelLogsRelations = relations(travelLogs, ({ one }) => ({
  user: one(users, { fields: [travelLogs.userId], references: [users.id] }),
}));

export const customThemesRelations = relations(customThemes, ({ one }) => ({
  user: one(users, { fields: [customThemes.userId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertMotorcycleSchema = createInsertSchema(motorcycles).omit({ id: true, userId: true, createdAt: true });
export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({ id: true, createdAt: true });
export const insertModificationSchema = createInsertSchema(modifications).omit({ id: true, createdAt: true });

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, userId: true, createdAt: true });
export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({ id: true, userId: true, createdAt: true });
export const insertTravelLogSchema = createInsertSchema(travelLogs).omit({ id: true, userId: true, createdAt: true });
export const insertCustomThemeSchema = createInsertSchema(customThemes)
  .omit({ id: true, userId: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Motorcycle = typeof motorcycles.$inferSelect;
export type InsertMotorcycle = z.infer<typeof insertMotorcycleSchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Modification = typeof modifications.$inferSelect;
export type InsertModification = z.infer<typeof insertModificationSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

export type CommunityLike = typeof communityLikes.$inferSelect;

export type TravelLog = typeof travelLogs.$inferSelect;
export type InsertTravelLog = z.infer<typeof insertTravelLogSchema>;
