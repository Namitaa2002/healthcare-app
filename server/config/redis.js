import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

const getCache = async (key) => {
  const data = await redis.get(key);

  return data ? JSON.parse(data) : null;
};

const setCache = async (key, data, expiryInSeconds = 300) => {
  await redis.set(
    key,
    JSON.stringify(data),
    "EX",
    expiryInSeconds
  );
};

const deleteCache = async (key) => {
  await redis.del(key);
};

export {
  redis,
  getCache,
  setCache,
  deleteCache,
};