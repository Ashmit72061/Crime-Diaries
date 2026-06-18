/**
 * SSE Connection Registry
 * Holds live response objects for each authenticated user.
 * When a new notification is written to the DB, notifyHandler calls
 * pushToUser() which instantly streams the event to all open browser tabs.
 */

/** @type {Map<string, Set<import('express').Response>>} */
const clients = new Map();

/**
 * Register a new SSE client connection for a user.
 * @param {string} userId
 * @param {import('express').Response} res
 */
export function registerClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
}

/**
 * Remove an SSE client connection (on disconnect).
 * @param {string} userId
 * @param {import('express').Response} res
 */
export function removeClient(userId, res) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  userClients.delete(res);
  if (userClients.size === 0) {
    clients.delete(userId);
  }
}

/**
 * Push an SSE event to all open connections for a specific user.
 * @param {string} userId
 * @param {string} event  - SSE event name (e.g. 'notification')
 * @param {object} data   - JSON-serializable payload
 */
export function pushToUser(userId, event, data) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of userClients) {
    try {
      res.write(payload);
    } catch (err) {
      // Connection died silently — remove it
      userClients.delete(res);
    }
  }
}

/**
 * Broadcast an SSE event to ALL connected users.
 * @param {string} event
 * @param {object} data
 */
export function pushToAll(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [, userClients] of clients) {
    for (const res of userClients) {
      try {
        res.write(payload);
      } catch (_) {
        userClients.delete(res);
      }
    }
  }
}

/** Returns how many users are currently connected (for health checks). */
export function getConnectedCount() {
  return clients.size;
}
