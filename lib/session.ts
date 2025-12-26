import { useState } from "react";

export function useSession() {
  const [pinOk, setPinOk] = useState(false);
  
  async function unlock(pin: string) {
    const res = await fetch("/api/pin-check", {
      method: "POST",
      body: JSON.stringify({ pin }),
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      setPinOk(true);
      return true;
    }
    setPinOk(false);
    return false;
  }
  
  return { pinOk, unlock };
}