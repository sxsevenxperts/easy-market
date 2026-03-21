const { createClient } = require('redis');

let client = null;
let connected = false;

const connect = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    connected = true;
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis not available, running without cache:', err.message);
    client = null;
    connected = false;
  }
};

const ping = async () => {
  if (!connected || !client) return 'UNAVAILABLE';
  return await client.ping();
};

const get = async (key) => {
  if (!connected || !client) return null;
  return await client.get(key);
};

const set = async (key, value, options) => {
  if (!connected || !client) return null;
  return await client.set(key, value, options);
};

const quit = async () => {
  if (connected && client) await client.quit();
};

module.exports = { connect, ping, get, set, quit };
