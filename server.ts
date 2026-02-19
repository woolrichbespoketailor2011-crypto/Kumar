import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Robust APP_URL handling
const getAppUrl = () => {
  const rawUrl = process.env.APP_URL || "";
  return rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
};

const APP_URL = getAppUrl();
console.log("Starting server with APP_URL:", APP_URL);

// Middleware
app.use(express.json());

// Trust proxy is required for secure cookies behind a proxy (like Nginx in AI Studio)
app.set('trust proxy', 1);

// Middleware to handle Session ID from header (Safari/Iframe fallback)
// MUST run before session middleware
app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] as string;
  if (sessionId && !req.headers.cookie) {
    // Spoof the cookie for express-session
    // @ts-ignore
    req.sessionID = sessionId;
    // Also set the cookie header just in case
    req.headers.cookie = `fintrack_sid=${sessionId}`;
  }
  next();
});

app.use(
  session({
    name: "fintrack_sid", 
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: true,
      sameSite: "none",
    },
  })
);

declare module 'express-session' {
  interface SessionData {
    tokens: any;
    user: any;
  }
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/callback`
);

// Auth Routes
app.get("/api/auth/url", (req, res) => {
  const redirectUri = `${APP_URL}/auth/callback`;
  console.log("Generating Auth URL with redirect_uri:", redirectUri);
  
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive.file",
    ],
    prompt: "consent",
    redirect_uri: redirectUri // Explicitly set it
  });
  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  console.log("Auth callback received with code:", code ? "exists" : "missing");
  
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    req.session.tokens = tokens;
    console.log("Tokens acquired successfully");

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    req.session.user = userInfo.data;
    console.log("User info acquired:", userInfo.data.email);

    // Explicitly save session before sending response
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Session save failed");
      }
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS',
                  sessionId: '${req.sessionID}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    });
  } catch (error) {
    console.error("Error during auth callback:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/auth/user", (req, res) => {
  console.log("Fetching user from session:", req.session?.user?.email || "none");
  res.json({ user: req.session?.user || null });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.json({ success: true });
  });
});

// Google Drive API Proxy Routes
app.get("/api/drive/file", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Unauthorized" });

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    // Search for our specific file
    const response = await drive.files.list({
      q: "name = 'fintrack_data.json' and trashed = false",
      fields: "files(id, name)",
      spaces: "drive",
    });

    const file = response.data.files?.[0];
    if (!file) {
      return res.json({ content: null });
    }

    const contentResponse = await drive.files.get({
      fileId: file.id,
      alt: "media",
    });

    res.json({ content: contentResponse.data, fileId: file.id });
  } catch (error) {
    console.error("Error reading from Drive:", error);
    res.status(500).json({ error: "Failed to read from Drive" });
  }
});

app.post("/api/drive/save", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Unauthorized" });

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const { content, fileId } = req.body;

    if (fileId) {
      // Update existing file
      await drive.files.update({
        fileId: fileId,
        media: {
          mimeType: "application/json",
          body: JSON.stringify(content),
        },
      });
      res.json({ success: true, fileId });
    } else {
      // Create new file
      const response = await drive.files.create({
        requestBody: {
          name: "fintrack_data.json",
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: JSON.stringify(content),
        },
      });
      res.json({ success: true, fileId: response.data.id });
    }
  } catch (error) {
    console.error("Error saving to Drive:", error);
    res.status(500).json({ error: "Failed to save to Drive" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Configured APP_URL: ${process.env.APP_URL}`);
});
