import amqp from 'amqplib';
import EventEmitter from 'events';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let channel = null;
let connection = null;
const localEmitter = new EventEmitter();
let isMock = false;

export async function connect() {
  try {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('pharos', 'topic', { durable: true });
    logger.info('✅ RabbitMQ EventBus connected.');
    isMock = false;
  } catch (error) {
    logger.warn(`⚠️ RabbitMQ offline (${error.message}). Falling back to local events.`);
    isMock = true;
  }
}

export async function publish(routingKey, payload) {
  const messagePayload = {
    ...payload,
    ts: new Date().toISOString()
  };

  logger.debug(`[EventBus] Publishing ${routingKey} event`);

  if (isMock || !channel) {
    // Dispatch via in-memory emitter
    localEmitter.emit(routingKey, messagePayload);
    // Also emit wildcard events
    const parts = routingKey.split('.');
    if (parts.length > 0) {
      localEmitter.emit(`${parts[0]}.*`, messagePayload);
    }
    return;
  }

  try {
    channel.publish(
      'pharos',
      routingKey,
      Buffer.from(JSON.stringify(messagePayload)),
      { persistent: true }
    );
  } catch (err) {
    logger.error(`[EventBus] Publish error on ${routingKey}: ${err.message}`);
    // Fallback to local
    localEmitter.emit(routingKey, messagePayload);
  }
}

export async function subscribe(pattern, queueName, handler) {
  if (typeof queueName === 'function') {
    handler = queueName;
    queueName = `${pattern.replace(/[^a-zA-Z0-9.-]/g, '_')}-queue`;
  }
  if (isMock || !channel) {
    localEmitter.on(pattern, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error(`[EventBus] Mock handler error on pattern ${pattern}: ${err.message}`);
      }
    });
    return;
  }

  try {
    const q = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(q.queue, 'pharos', pattern);
    
    await channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const payload = JSON.parse(msg.content.toString());
          await handler(payload);
          channel.ack(msg);
        } catch (err) {
          logger.error(`[EventBus] Real handler error on pattern ${pattern}: ${err.message}`);
          channel.nack(msg, false, false);
        }
      }
    });
    logger.debug(`[EventBus] Subscribed queue "${queueName}" to pattern: "${pattern}"`);
  } catch (error) {
    logger.error(`[EventBus] Real subscription error on pattern ${pattern}: ${error.message}`);
    // Bind locally as secondary fallback
    localEmitter.on(pattern, handler);
  }
}

export { connect as connectEventBus };
