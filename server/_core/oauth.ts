import type { Express } from "express";
// Legacy OAuth provider methods were removed when local authentication was
// introduced. Do not silently create a session from an unsupported callback.
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (_req, res) => {
    res.status(410).json({ error: "This sign-in method is no longer supported. Sign in using your SaskHandy account." });
  });
}
