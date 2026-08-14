/**
 * Centralized safe error logger for Node.js / Express backend
 */
const isProduction = process.env.NODE_ENV === 'production';

// Fields that must be masked if logged
const SENSITIVE_KEYS = [
  'password',
  'confirmPassword',
  'token',
  'jwt',
  'secret',
  'razorpay_signature',
  'razorpay_payment_id',
  'razorpay_secret',
  'card',
  'cvv',
  'authorization',
  'cookie',
];

const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      clean[key] = '***[REDACTED]***';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeLogData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, sanitizeLogData(meta));
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, sanitizeLogData(meta));
  },
  error: (message, error = null, req = null) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message,
      path: req?.originalUrl || req?.url,
      method: req?.method,
      ip: req?.ip,
    };

    if (error) {
      errorLog.errorName = error.name;
      errorLog.errorMessage = error.message;
      if (!isProduction && error.stack) {
        errorLog.stack = error.stack;
      }
    }

    console.error(`[ERROR] [${errorLog.timestamp}] ${message}:`, JSON.stringify(errorLog, null, 2));
  },
};
