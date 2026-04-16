import {
  users, motorcycles, maintenance, modifications,
  communityPosts, communityComments, communityLikes, travelLogs, customThemes,
  type User, type InsertUser,
  type Motorcycle, type InsertMotorcycle,
  type Maintenance, type InsertMaintenance,
  type Modification, type InsertModification,
  type CommunityPost, type InsertCommunityPost,
  type CommunityComment, type InsertCommunityComment,
  type TravelLog, type InsertTravelLog,
  type CustomTheme, type InsertCustomTheme,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface CommunityPostWithMeta extends CommunityPost {
  authorUsername: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface CommentWithAuthor extends CommunityComment {
  authorUsername: string;
}

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

  getCommunityPosts(currentUserId: number): Promise<CommunityPostWithMeta[]>;
  getCommunityPost(id: number, currentUserId: number): Promise<CommunityPostWithMeta | undefined>;
  createCommunityPost(userId: number, data: InsertCommunityPost): Promise<CommunityPost>;
  updateCommunityPost(id: number, userId: number, data: Partial<InsertCommunityPost>): Promise<CommunityPost>;
  deleteCommunityPost(id: number, userId: number): Promise<void>;

  getCommunityComments(postId: number): Promise<CommentWithAuthor[]>;
  createCommunityComment(postId: number, userId: number, content: string): Promise<CommentWithAuthor>;
  deleteCommunityComment(id: number, userId: number): Promise<void>;

  toggleCommunityLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }>;

  getTravelLogs(userId: number): Promise<TravelLog[]>;
  createTravelLog(userId: number, data: InsertTravelLog): Promise<TravelLog>;
  updateTravelLog(id: number, userId: number, data: Partial<InsertTravelLog>): Promise<TravelLog>;
  deleteTravelLog(id: number, userId: number): Promise<void>;

  getCustomThemes(userId: number): Promise<CustomTheme[]>;
  createCustomTheme(userId: number, data: InsertCustomTheme): Promise<CustomTheme>;
  deleteCustomTheme(id: number, userId: number): Promise<void>;

  updateUserPreferences(userId: number, prefs: Partial<Pick<User, 'audioEnabled' | 'customAudioData' | 'customAudioName' | 'activeBrandId' | 'activeCustomColor'>>): Promise<User>;
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

  private async buildPostMeta(post: CommunityPost, currentUserId: number): Promise<CommunityPostWithMeta> {
    const [author, likes, comments] = await Promise.all([
      db.select().from(users).where(eq(users.id, post.userId)),
      db.select().from(communityLikes).where(eq(communityLikes.postId, post.id)),
      db.select({ id: communityComments.id }).from(communityComments).where(eq(communityComments.postId, post.id)),
    ]);
    return {
      ...post,
      authorUsername: author[0]?.username ?? 'Unknown',
      likeCount: likes.length,
      commentCount: comments.length,
      likedByMe: likes.some(l => l.userId === currentUserId),
    };
  }

  async getCommunityPosts(currentUserId: number): Promise<CommunityPostWithMeta[]> {
    const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
    return Promise.all(posts.map(p => this.buildPostMeta(p, currentUserId)));
  }

  async getCommunityPost(id: number, currentUserId: number): Promise<CommunityPostWithMeta | undefined> {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    if (!post) return undefined;
    return this.buildPostMeta(post, currentUserId);
  }

  async createCommunityPost(userId: number, data: InsertCommunityPost): Promise<CommunityPost> {
    const [inserted] = await db.insert(communityPosts).values({ ...data, userId }).returning();
    return inserted;
  }

  async updateCommunityPost(id: number, userId: number, data: Partial<InsertCommunityPost>): Promise<CommunityPost> {
    const [updated] = await db.update(communityPosts)
      .set(data)
      .where(and(eq(communityPosts.id, id), eq(communityPosts.userId, userId)))
      .returning();
    if (!updated) throw new Error("Post not found or unauthorized");
    return updated;
  }

  async deleteCommunityPost(id: number, userId: number): Promise<void> {
    await db.delete(communityComments).where(eq(communityComments.postId, id));
    await db.delete(communityLikes).where(eq(communityLikes.postId, id));
    await db.delete(communityPosts).where(and(eq(communityPosts.id, id), eq(communityPosts.userId, userId)));
  }

  async getCommunityComments(postId: number): Promise<CommentWithAuthor[]> {
    const comments = await db.select().from(communityComments)
      .where(eq(communityComments.postId, postId))
      .orderBy(communityComments.createdAt);
    return Promise.all(comments.map(async (c) => {
      const [author] = await db.select().from(users).where(eq(users.id, c.userId));
      return { ...c, authorUsername: author?.username ?? 'Unknown' };
    }));
  }

  async createCommunityComment(postId: number, userId: number, content: string): Promise<CommentWithAuthor> {
    const [inserted] = await db.insert(communityComments).values({ postId, userId, content }).returning();
    const [author] = await db.select().from(users).where(eq(users.id, userId));
    return { ...inserted, authorUsername: author?.username ?? 'Unknown' };
  }

  async deleteCommunityComment(id: number, userId: number): Promise<void> {
    await db.delete(communityComments).where(and(eq(communityComments.id, id), eq(communityComments.userId, userId)));
  }

  async toggleCommunityLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const existing = await db.select().from(communityLikes)
      .where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
    if (existing.length > 0) {
      await db.delete(communityLikes).where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
    } else {
      await db.insert(communityLikes).values({ postId, userId });
    }
    const likes = await db.select().from(communityLikes).where(eq(communityLikes.postId, postId));
    return { liked: existing.length === 0, likeCount: likes.length };
  }

  async getTravelLogs(userId: number): Promise<TravelLog[]> {
    return db.select().from(travelLogs)
      .where(eq(travelLogs.userId, userId))
      .orderBy(desc(travelLogs.createdAt));
  }

  async createTravelLog(userId: number, data: InsertTravelLog): Promise<TravelLog> {
    const [inserted] = await db.insert(travelLogs).values({ ...data, userId }).returning();
    return inserted;
  }

  async updateTravelLog(id: number, userId: number, data: Partial<InsertTravelLog>): Promise<TravelLog> {
    const [updated] = await db.update(travelLogs).set(data)
      .where(and(eq(travelLogs.id, id), eq(travelLogs.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTravelLog(id: number, userId: number): Promise<void> {
    await db.delete(travelLogs).where(and(eq(travelLogs.id, id), eq(travelLogs.userId, userId)));
  }

  async getCustomThemes(userId: number): Promise<CustomTheme[]> {
    return db.select().from(customThemes).where(eq(customThemes.userId, userId)).orderBy(desc(customThemes.createdAt));
  }

  async createCustomTheme(userId: number, data: InsertCustomTheme): Promise<CustomTheme> {
    const existing = await this.getCustomThemes(userId);
    if (existing.length >= 10) {
      throw new Error("Limite di 10 temi raggiunto");
    }
    const [inserted] = await db.insert(customThemes).values({ ...data, userId }).returning();
    return inserted;
  }

  async deleteCustomTheme(id: number, userId: number): Promise<void> {
    await db.delete(customThemes).where(and(eq(customThemes.id, id), eq(customThemes.userId, userId)));
  }

  async updateUserPreferences(userId: number, prefs: Partial<User>): Promise<User> {
    const [updated] = await db.update(users)
      .set(prefs)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
