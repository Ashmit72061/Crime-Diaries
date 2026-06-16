import amqp from 'amqplib';
import EventEmitter from 'events';
import { env } from '../config/env.js';

let channel = null;
let connection = null;
const localEmitter = new EventEmitter();
let isMock = false;

export async function connect() {
  try {
    console.log(`[EventBus] Attempting connection to RabbitMQ at ${env.RABBITMQ_URL}...`);
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('pharos', 'topic', { durable: true });
    console.log('[EventBus] Decoupled RabbitMQ Exchange "pharos" booted successfully.');
    isMock = false;
  } catch (error) {
    console.warn(`[EventBus] RabbitMQ offline (${error.message}). Falling back to local in-memory event emitter.`);
    isMock = true;
  }
}

export async function publish(routingKey, payload) {
  const messagePayload = {
    ...payload,
    ts: new Date().toISOString()
  };

  console.log(`[EventBus] Publishing ${routingKey} event:`, JSON.stringify(messagePayload));

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
    console.error(`[EventBus] Publish error on ${routingKey}:`, err.message);
    // Fallback to local
    localEmitter.emit(routingKey, messagePayload);
  }
}

export async function subscribe(pattern, queueName, handler) {
  if (isMock || !channel) {
    console.log(`[EventBus] Subscribing listener locally to pattern: "${pattern}"`);
    localEmitter.on(pattern, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus] Mock handler error on pattern ${pattern}:`, err.message);
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
          console.error(`[EventBus] Real handler error on pattern ${pattern}:`, err.message);
          channel.nack(msg, false, false);
        }
      }
    });
    console.log(`[EventBus] Subscribed queue "${queueName}" to pattern: "${pattern}"`);
  } catch (error) {
    console.error(`[EventBus] Real subscription error on pattern ${pattern}:`, error.message);
    // Bind locally as secondary fallback
    localEmitter.on(pattern, handler);
  }
}
