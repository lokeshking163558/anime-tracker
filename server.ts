
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// JSON parsing middleware
app.use(express.json());

// API Route: Get Google OAuth URL
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "502250004905-t6mth5ams9ku7alqb2l9c29jb2jjrs7p.apps.googleusercontent.com";
  
  // Construct redirect URI dynamically based on request or environment
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.json({ url: googleAuthUrl });
});

// API Route: Google OAuth Callback
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send("Missing code");
  }

  try {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "502250004905-t6mth5ams9ku7alqb2l9c29jb2jjrs7p.apps.googleusercontent.com";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "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";
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/callback`;

    if (!clientId || !clientSecret) {
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment.' }, '*');
                window.close();
              }
            </script>
            <p>Authentication failed: Missing server-side secrets. Please check environment variables.</p>
          </body>
        </html>
      `);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Send the id_token back to the client
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', idToken: '${tokens.id_token}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("OAuth Exchange Error:", error);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: '${error.message}' }, '*');
              window.close();
            }
          </script>
          <p>Authentication failed: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Serve static files in production (only if not on Vercel)
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Only listen if not running as a serverless function (Vercel)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
