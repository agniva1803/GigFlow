import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for authentication endpoints — login/register are the
 * highest-value brute-force target in this API, so they get a much tighter
 * window than general traffic.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

/**
 * General limiter applied to all /api routes to absorb basic abuse/scraping
 * without affecting normal dashboard usage patterns.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

/**
 * Tighter limiter for the bulk import endpoint, which is the most expensive
 * single request the API accepts (up to 500 DB writes).
 */
export const bulkImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bulk import limit reached. Please try again later.',
  },
});
