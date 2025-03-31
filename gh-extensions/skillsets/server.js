import crypto from 'crypto';
import express from 'express';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { signatureVerificationMiddleware } from './middleware/signatureVerification.js';

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// Environment variables setup with validation
const PORT = process.env.PORT || 3000;
const GH_WEBHOOK_SECRET = process.env.COPILOT_SECRET;

if (!GH_WEBHOOK_SECRET) {
  console.warn('Warning: COPILOT_SECRET environment variable not set. Using insecure default.');
}

// Apply signature verification middleware with auto-rejection enabled
// This will automatically handle the signature verification and reject invalid requests
app.use(signatureVerificationMiddleware(GH_WEBHOOK_SECRET, { autoReject: true }));

// Route: Generate a random tech product name
app.post('/random-product-name', (req, res) => {
  try {
    // Generate product name using faker.js
    const productName = generateProductName();
    
    // Log successful requests
    console.log(`Generated product name: ${productName}`);
    
    // Send back the generated name as a plain text response
    res.type('text/plain').send(productName);
  } catch (error) {
    console.error('Error generating product name:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error generating product name'
    });
  }
});

// Function to generate a random product name using faker
function generateProductName() {
  // Modern way: Use faker library for more varied and realistic names
  const adj = faker.commerce.productAdjective();
  const material = Math.random() > 0.5 ? faker.commerce.productMaterial() + " " : "";
  const name = faker.commerce.product();
  
  // Randomly decide whether to add a suffix
  const suffixes = ["Pro", "X", "Prime", "Max", "Plus", "Ultra", "Edge"];
  let productName = `${adj} ${material}${name}`;
  
  if (Math.random() < 0.5) {
    const suffix = faker.helpers.arrayElement(suffixes);
    productName += " " + suffix;
  }
  
  return productName;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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
  console.log(`✅ Copilot Skillset server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Received shutdown signal, closing server gracefully...');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force close after timeout
  setTimeout(() => {
    console.error('Forcing server close after timeout');
    process.exit(1);
  }, 10000);
}

// For testing exports
export { app };
