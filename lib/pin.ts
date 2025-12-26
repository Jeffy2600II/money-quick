import bcrypt from "bcryptjs";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const PIN_KEY = "pin-hash";

export async function setPin(pin: string) {
  const hashed = await bcrypt.hash(pin, 10);
  await redis.set(PIN_KEY, hashed);
  return true;
}

export async function checkPin(pin: string) {
  const hash = await redis.get < string > (PIN_KEY);
  if (!hash) return false;
  return bcrypt.compareSync(pin, hash);
}

export async function hasPin() {
  const hash = await redis.get < string > (PIN_KEY);
  return !!hash;
}