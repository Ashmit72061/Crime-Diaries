import amqp from 'amqplib';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let channel = null;
let connection = null;

export const connectEventBus = async () => {
  try {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('pharos', 'topic', { durable: true });
    logger.info('RabbitMQ Event Bus connected');
  } catch (error) {
    logger.error(`RabbitMQ connection error: ${error.message}`);
    process.exit(1);
  }
};

export const publish = async (routingKey, payload) => {
  if (!channel) throw new Error('Event bus not connected');
  channel.publish('pharos', routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  logger.info(`[EventBus] Published: ${routingKey}`);
};

export const subscribe = async (routingKey, handler) => {
  if (!channel) throw new Error('Event bus not connected');
  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, 'pharos', routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg) {
      try {
        handler(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      } catch (err) {
        logger.error(`[EventBus] Error handling message ${routingKey}: ${err.message}`);
        channel.nack(msg, false, false); // Dead-letter it or discard depending on policy
      }
    }
  });
  logger.info(`[EventBus] Subscribed: ${routingKey}`);
};

// Graceful shutdown
const shutdownBus = async (signal) => {
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.info('RabbitMQ connection closed.');
};

process.on('SIGINT', () => shutdownBus('SIGINT'));
process.on('SIGTERM', () => shutdownBus('SIGTERM'));
