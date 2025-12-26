import bcrypt from "bcryptjs";
import { kv } from "@vercel/kv";

const PIN_KEY = "pin-hash";

export async function setPin(pin: string) {
  const hashed = await bcrypt.hash(pin, 10);
  await kv.set(PIN_KEY, hashed);
  return true;
}

export async function checkPin(pin: string) {
  const hash = await kv.get < string > (PIN_KEY);
  if (!hash) return false;
  return bcrypt.compareSync(pin, hash);
}

export async function hasPin() {
  return !!(await kv.get < string > (PIN_KEY));
}