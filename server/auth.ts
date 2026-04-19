import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import { type User } from "@shared/schema";

export function setupAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not defined. Google Auth will be disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          const googleId = profile.id;
          const avatarUrl = profile.photos?.[0].value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;

          if (!email) {
            return done(new Error("No email found from Google profile"));
          }

          // 1. Try to find user by Google ID
          let user = await storage.getUserByGoogleId(googleId);

          // 2. If not found, try by email
          if (!user) {
            // Check if we should link existing email accounts?
            // For security, usually better to just create or error if email exists with password.
            // Here we'll follow a simple "find or create" flow.
            
            // Generate a unique username
            let username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const existingUser = await storage.getUserByUsername(username);
            if (existingUser) {
              username = `${username}${Math.floor(Math.random() * 1000)}`;
            }

            user = await storage.createUser({
              username,
              email,
              googleId,
              avatarUrl,
              firstName,
              lastName,
              password: undefined, // No password for OAuth users
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
