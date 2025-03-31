import crypto from 'crypto';
import express from 'express';

/**
 * Helper function to verify GitHub signature (HMAC SHA-256)
 * @param {string} signature - The signature from GitHub webhook header
 * @param {Buffer} body - The request body as a buffer
 * @param {string} secret - The webhook secret
 * @returns {boolean} - Whether signature is valid
 */
function verifySignature(signature, body, secret) {
  try {
    if (!signature || !secret) return false;
    
    // GitHub signature comes as "sha256=<hash>"
    const hash = crypto.createHmac('sha256', secret)
                      .update(body)
                      .digest('hex');
    const expected = `sha256=${hash}`;
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature), 
        Buffer.from(expected)
      );
    } catch (error) {
      console.error('Signature comparison error:', error);
      return false;
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Middleware for GitHub webhook signature verification
 * @param {string} secretKey - The webhook secret key
 * @param {Object} options - Options for the middleware
 * @param {boolean} options.autoReject - Whether to automatically reject invalid signatures
 * @returns {function} - Express middleware function
 */
export function signatureVerificationMiddleware(secretKey, options = { autoReject: true }) {
  // First middleware to parse the JSON and verify the signature
  const jsonParser = express.json({
    verify: (req, res, buf, encoding) => {
      const signature = req.headers['x-hub-signature-256'];
      req.rawBody = buf;
      req.signatureIsValid = verifySignature(signature, buf, secretKey);
    }
  });

  // Second middleware to check the signature and reject if invalid
  const signatureChecker = (req, res, next) => {
    // Skip validation for health checks or if autoReject is false
    if (req.path === '/health' || !options.autoReject) {
      return next();
    }
    
    if (!req.signatureIsValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid signature'
      });
    }
    
    next();
  };

  // Return middleware chain
  return [jsonParser, signatureChecker];
}

export { verifySignature };