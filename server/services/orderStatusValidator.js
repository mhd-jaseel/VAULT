/**
 * Centralized Order Status Transition Engine
 * Supported Order Statuses:
 * - pending
 * - confirmed
 * - packed
 * - shipped
 * - delivered
 * - cancelled
 */

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Allowed forward transitions for normal admin status updates
export const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Terminal state for normal transitions
  cancelled: [], // Terminal state for normal transitions
};

// Allowed backward targets for authorized status corrections
export const ALLOWED_CORRECTIONS = {
  delivered: ['shipped', 'packed', 'confirmed'],
  shipped: ['packed', 'confirmed'],
  packed: ['confirmed'],
  confirmed: ['pending'],
  cancelled: [], // Cancelled orders cannot be corrected backwards
  pending: [],
};

/**
 * Validate standard forward status transition
 */
export const validateStatusTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) {
    return {
      valid: false,
      same: true,
      message: `Order is already in '${currentStatus}' status.`,
    };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (allowedNext.includes(targetStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    same: false,
    message: `Invalid order status transition from '${currentStatus}' to '${targetStatus}'. Allowed next status: [${allowedNext.join(', ') || 'None (Terminal status)'}].`,
  };
};

/**
 * Validate status correction transition
 */
export const validateStatusCorrection = (currentStatus, targetStatus, reason) => {
  if (!reason || !reason.trim() || reason.trim().length < 5) {
    return {
      valid: false,
      message: 'A detailed reason (at least 5 characters) is required for status correction.',
    };
  }

  if (currentStatus === targetStatus) {
    return {
      valid: false,
      message: `Order is already in '${currentStatus}' status.`,
    };
  }

  const allowedCorrectionTargets = ALLOWED_CORRECTIONS[currentStatus] || [];
  if (allowedCorrectionTargets.includes(targetStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: `Cannot correct status from '${currentStatus}' to '${targetStatus}'. Allowed correction targets: [${allowedCorrectionTargets.join(', ') || 'None'}].`,
  };
};
