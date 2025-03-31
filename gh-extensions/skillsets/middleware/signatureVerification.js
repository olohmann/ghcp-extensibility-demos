import crypto from 'crypto';
import express from 'express';
import axios from 'axios';

// Update the URI to point to the Copilot API public keys
const GITHUB_KEYS_URI = "https://api.github.com/meta/public_keys/copilot_api";

/**
 * Helper function to make HTTP requests using axios
 * @param {String} url - The URL to make the request to
 * @param {Object} options - The options for the request
 * @returns {Promise<Object>} - Promise resolving to the response data
 */
async function fetchData(url, options = {}) {
  try {
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

/**
 * Verify a payload and signature against a GitHub public key
 * @param {String} payload - The value to verify
 * @param {String} signature - The expected signature
 * @param {String} keyID - The id of the key used to generate the signature
 * @return {Promise<boolean>} - Promise resolving to whether the signature is valid
 */
async function verifySignature(payload, signature, keyID) {
  try {
    if (typeof payload !== "string" || payload.length === 0) {
      console.error("Invalid payload");
      return false;
    }
    if (typeof signature !== "string" || signature.length === 0) {
      console.error("Invalid signature");
      return false;
    }
    if (typeof keyID !== "string" || keyID.length === 0) {
      console.error("Invalid keyID");
      return false;
    }
    
    const options = {
      headers: {
        'User-Agent': 'GitHub-Copilot-Extension'
      }
    };
    
    const response = await fetchData(GITHUB_KEYS_URI, options);
    
    // Check for the public_keys array in the response
    if (!response.public_keys || !(response.public_keys instanceof Array) || response.public_keys.length === 0) {
      console.error("No public keys found in response");
      return false;
    }

    const publicKey = response.public_keys.find((k) => k.key_identifier === keyID) ?? null;
    if (publicKey === null) {
      console.error("No public key found matching key identifier");
      return false;
    }

    const verify = crypto.createVerify("SHA256").update(payload);
    return verify.verify(publicKey.key, Buffer.from(signature, "base64"), "base64");
    
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Middleware for GitHub Copilot request signature verification
 * @param {Object} options - Options for the middleware
 * @param {boolean} options.autoReject - Whether to automatically reject invalid signatures
 * @returns {function} - Express middleware function
 */
export function signatureVerificationMiddleware(options = { autoReject: true }) {
  // First middleware to parse the JSON and store raw body for verification
  const jsonParser = express.json({
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf.toString('utf8');
    }
  });

  // Second middleware to verify signature using GitHub's public key
  const signatureVerifier = async (req, res, next) => {
    try {
      // Skip validation for health checks
      if (req.path === '/health') {
        return next();
      }
      
      console.log('All headers:', JSON.stringify(req.headers, null, 2));
      
      // Update to use the correct header names for Copilot API
      const signature = req.headers['x-github-public-key-signature'];
      const keyID = req.headers['x-github-public-key-identifier'];
      
      console.log('Signature:', signature);
      console.log('Key ID:', keyID);
      
      if (!signature || !keyID) {
        req.signatureIsValid = false;
        if (options.autoReject) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing GitHub Copilot signature or key ID'
          });
        }
        return next();
      }
      
      req.signatureIsValid = await verifySignature(
        req.rawBody, 
        signature,
        keyID
      );
      
      if (!req.signatureIsValid && options.autoReject) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid GitHub Copilot signature'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in signature verification middleware:', error);
      if (options.autoReject) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to verify signature'
        });
      }
      req.signatureIsValid = false;
      next();
    }
  };

  // Return middleware chain
  return [jsonParser, signatureVerifier];
}

export { verifySignature };