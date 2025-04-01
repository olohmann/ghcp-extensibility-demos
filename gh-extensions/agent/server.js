import { Octokit } from "@octokit/core";
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { Readable } from "node:stream";
import { signatureVerificationMiddleware } from './middleware/signatureVerification.js';

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// Environment variables setup with validation
const PORT = process.env.PORT || 4000;
const DEBUG_MODE = process.env.DEBUG === 'true';

// Apply signature verification middleware, but skip in debug mode
if (!DEBUG_MODE) {
  console.log('Signature verification middleware enabled');
  app.use(signatureVerificationMiddleware());
} else {
  console.log('DEBUG MODE: Signature verification middleware skipped');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post("/", express.json(), async (req, res) => {
  // Identify the user, using the GitHub API token provided in the request headers.
  const tokenForUser = req.get("X-GitHub-Token");
  const octokit = new Octokit({ auth: tokenForUser });
  const user = await octokit.request("GET /user");
  console.log("User:", user.data.login);

  // Parse the request payload and log it.
  const payload = req.body;
  console.log("Payload:", payload);

  // Insert a special pirate-y system message in our message list.
  const messages = payload.messages;

  messages.unshift({
    role: "system",
    content: "You are a helpful assistant that replies to user messages as if you were the Oscar Wilde.",
  });

  messages.unshift({
    role: "system",
    content: `Start every response with the user's name, which is @${user.data.login}`,
  });

  // Use Copilot's LLM to generate a response to the user's messages, with
  // our extra system messages attached.
  const copilotLLMResponse = await fetch(
    "https://api.githubcopilot.com/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenForUser}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages,
        stream: true,
      }),
    }
  );

  // Stream the response straight back to the user.
  Readable.from(copilotLLMResponse.body).pipe(res);
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// Start the server with proper error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Copilot Agents server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// For testing exports
export { app };
