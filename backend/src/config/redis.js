const Redis = require('ioredis');

let redisClient;

if (process.env.REDIS_URL) {
  console.log('Using Redis URL from environment');
  // Try using the URL directly first
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  } catch (error) {
    console.error('Error creating Redis client with URL:', error.message);
    // Fallback to localhost
    redisClient = new Redis('redis://localhost:6379');
  }
} else {
  console.log('No REDIS_URL found, using localhost');
  redisClient = new Redis('redis://localhost:6379');
}

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

module.exports = redisClient;