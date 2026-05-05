import {
  users, motorcycles, maintenance, modifications,
  communityPosts, communityComments, communityLikes, travelLogs, customThemes, ratings, notifications, gameReleases, gameScores,
  type User, type InsertUser,
  type Motorcycle, type InsertMotorcycle,
  type Maintenance, type InsertMaintenance,
  type Modification, type InsertModification,
  type CommunityPost, type InsertCommunityPost,
  type CommunityComment, type InsertCommunityComment,
  type TravelLog, type InsertTravelLog,
  type CustomTheme, type InsertCustomTheme,
  type Rating, type InsertRating,
  type Notification, type InsertNotification,
  type GameRelease, type InsertGameRelease,
  type GameScore, type InsertGameScore,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  updateResetToken(userId: number, token: string | null, expires: Date | null): Promise<void>;
  updatePassword(userId: number, passwordHash: string): Promise<void>;

  getMotorcycles(userId: number): Promise<Motorcycle[]>;
  getMotorcycle(id: number): Promise<Motorcycle | undefined>;
  createMotorcycle(userId: number, mc: InsertMotorcycle): Promise<Motorcycle>;
  updateMotorcycle(id: number, updates: Partial<InsertMotorcycle>): Promise<Motorcycle>;
  deleteMotorcycle(id: number): Promise<void>;

  getMaintenanceEvents(motorcycleId: number): Promise<Maintenance[]>;
  getMaintenanceEvent(id: number): Promise<Maintenance | undefined>;
  createMaintenanceEvent(motorcycleId: number, m: InsertMaintenance): Promise<Maintenance>;
  deleteMaintenanceEvent(id: number): Promise<void>;

  getModifications(motorcycleId: number): Promise<Modification[]>;
  getModification(id: number): Promise<Modification | undefined>;
  createModification(motorcycleId: number, mod: InsertModification): Promise<Modification>;
  deleteModification(id: number): Promise<void>;

  uploadRegistrationDocument(motorcycleId: number, documentUrl: string, registrationDate: string, initialMileage: number): Promise<Motorcycle>;

  getCommunityPosts(currentUserId: number): Promise<CommunityPostWithMeta[]>;
  getCommunityPost(id: number, currentUserId: number): Promise<CommunityPostWithMeta | undefined>;
  createCommunityPost(userId: number, data: InsertCommunityPost): Promise<CommunityPost>;
  updateCommunityPost(id: number, userId: number, data: Partial<InsertCommunityPost>): Promise<CommunityPost>;
  deleteCommunityPost(id: number, userId: number): Promise<void>;

  getCommunityComments(postId: number): Promise<CommentWithAuthor[]>;
  createCommunityComment(postId: number, userId: number, content: string, parentId?: number): Promise<CommentWithAuthor>;
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

  // Ratings
  getAverageRating(targetType: string, targetId: string): Promise<{ average: number; count: number }>;
  getUserRating(userId: number, targetType: string, targetId: string): Promise<number | null>;
  upsertRating(userId: number, rating: InsertRating): Promise<Rating>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  updateUserLastRead(userId: number): Promise<void>;
  markNotificationAsRead(userId: number, notificationId: number): Promise<void>;
  dismissNotification(userId: number, notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // AI Scan Credit Management
  incrementAiScansCount(userId: number, amount: number): Promise<void>;
  useAiScan(userId: number): Promise<void>;
  updateUserSlots(userId: number, slots: number): Promise<void>;
  incrementMotorcycleSlots(userId: number, amount: number): Promise<void>;
  updateUserProStatus(userId: number, isPro: boolean): Promise<void>;

  // Game Releases
  getGameReleases(): Promise<GameRelease[]>;
  createGameRelease(release: InsertGameRelease): Promise<GameRelease>;
  deleteGameRelease(id: number): Promise<void>;

  // Game Scores
  getGameScores(gameId: string, userId?: number): Promise<{ personalBest: number; globalBest: number }>;
  submitGameScore(userId: number, gameId: string, score: number): Promise<GameScore>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = lower(${username})`);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = lower(${email})`);
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateResetToken(userId: number, token: string | null, expires: Date | null): Promise<void> {
    await db.update(users)
      .set({ resetToken: token, resetTokenExpires: expires })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await db.update(users)
      .set({ password: passwordHash, resetToken: null, resetTokenExpires: null })
      .where(eq(users.id, userId));
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

  async getMaintenanceEvent(id: number): Promise<Maintenance | undefined> {
    const [m] = await db.select().from(maintenance).where(eq(maintenance.id, id));
    return m || undefined;
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

  async getModification(id: number): Promise<Modification | undefined> {
    const [m] = await db.select().from(modifications).where(eq(modifications.id, id));
    return m || undefined;
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

  async createCommunityComment(postId: number, userId: number, content: string, parentId?: number): Promise<CommentWithAuthor> {
    const [inserted] = await db.insert(communityComments).values({ postId, userId, content, parentId }).returning();
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

  // Ratings Implementation
  async getAverageRating(targetType: string, targetId: string): Promise<{ average: number; count: number }> {
    const results = await db.select().from(ratings).where(
      and(
        eq(ratings.targetType, targetType),
        eq(ratings.targetId, targetId)
      )
    );

    if (results.length === 0) return { average: 0, count: 0 };

    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return {
      average: Number((sum / results.length).toFixed(1)),
      count: results.length
    };
  }

  async getUserRating(userId: number, targetType: string, targetId: string): Promise<number | null> {
    const [rating] = await db.select().from(ratings).where(
      and(
        eq(ratings.userId, userId),
        eq(ratings.targetType, targetType),
        eq(ratings.targetId, targetId)
      )
    );
    return rating ? rating.score : null;
  }

  async upsertRating(userId: number, insertRating: InsertRating): Promise<Rating> {
    const [existing] = await db.select().from(ratings).where(
      and(
        eq(ratings.userId, userId),
        eq(ratings.targetType, insertRating.targetType),
        eq(ratings.targetId, insertRating.targetId)
      )
    );

    if (existing) {
      const [updated] = await db.update(ratings)
        .set({ score: insertRating.score })
        .where(eq(ratings.id, existing.id))
        .returning();
      return updated;
    }

    const [newRating] = await db.insert(ratings)
      .values({ ...insertRating, userId })
      .returning();
    return newRating;
  }

  // Notifications Implementation
  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [inserted] = await db.insert(notifications).values(data).returning();
    return inserted;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async updateUserLastRead(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastReadNotificationsAt: new Date() })
      .where(eq(users.id, userId));
  }
  
  async markNotificationAsRead(userId: number, notificationId: number): Promise<void> {
    await db.update(users)
      .set({ 
        readNotificationIds: sql`array_append(COALESCE(${users.readNotificationIds}, ARRAY[]::integer[]), ${notificationId})`
      })
      .where(eq(users.id, userId));
  }

  async dismissNotification(userId: number, notificationId: number): Promise<void> {
    await db.update(users)
      .set({ 
        dismissedNotificationIds: sql`array_append(COALESCE(${users.dismissedNotificationIds}, ARRAY[]::integer[]), ${notificationId})`
      })
      .where(eq(users.id, userId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const notifications = await this.getNotifications();
    const notificationIds = notifications.map(n => n.id);
    await db.update(users)
      .set({ readNotificationIds: notificationIds })
      .where(eq(users.id, userId));
  }

  async incrementAiScansCount(userId: number, amount: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    
    await db.update(users)
      .set({ aiScansCount: (user.aiScansCount || 0) + amount })
      .where(eq(users.id, userId));
  }

  async useAiScan(userId: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    
    await db.update(users)
      .set({ aiScansUsed: (user.aiScansUsed || 0) + 1 })
      .where(eq(users.id, userId));
  }

  async updateUserSlots(userId: number, slots: number): Promise<void> {
    await db.update(users).set({ motorcycleSlots: slots }).where(eq(users.id, userId));
  }

  async incrementMotorcycleSlots(userId: number, amount: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    
    await db.update(users)
      .set({ motorcycleSlots: (user.motorcycleSlots || 2) + amount })
      .where(eq(users.id, userId));
  }

  async updateUserProStatus(userId: number, isPro: boolean): Promise<void> {
    await db.update(users).set({ isPro }).where(eq(users.id, userId));
  }

  async getGameReleases(): Promise<GameRelease[]> {
    return db.select().from(gameReleases).orderBy(desc(gameReleases.createdAt));
  }

  async createGameRelease(data: InsertGameRelease): Promise<GameRelease> {
    const [inserted] = await db.insert(gameReleases).values(data).returning();
    return inserted;
  }

  async deleteGameRelease(id: number): Promise<void> {
    await db.delete(gameReleases).where(eq(gameReleases.id, id));
  }

  async getGameScores(gameId: string, userId?: number): Promise<{ personalBest: number; globalBest: number }> {
    // Global Best
    const [globalBestRes] = await db
      .select({ maxScore: sql<number>`max(${gameScores.score})` })
      .from(gameScores)
      .where(eq(gameScores.gameId, gameId));
    
    const globalBest = globalBestRes?.maxScore || 0;

    // Personal Best
    let personalBest = 0;
    if (userId) {
      const [personalBestRes] = await db
        .select({ maxScore: sql<number>`max(${gameScores.score})` })
        .from(gameScores)
        .where(
          and(
            eq(gameScores.gameId, gameId),
            eq(gameScores.userId, userId)
          )
        );
      personalBest = personalBestRes?.maxScore || 0;
    }

    return { personalBest, globalBest };
  }

  async submitGameScore(userId: number, gameId: string, score: number): Promise<GameScore> {
    const [gameScore] = await db
      .insert(gameScores)
      .values({ userId, gameId, score })
      .returning();
    return gameScore;
  }
}

export const storage = new DatabaseStorage();
