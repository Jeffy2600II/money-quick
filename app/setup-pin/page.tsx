'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";

export default function SetupPinPage() {
  const [step, setStep] = useState < "first" | "confirm" | "done" > ("first");
  const [pin, setPin] = useState < string > ("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  async function handleFirst(pinValue: string) {
    setPin(pinValue);
    setStep("confirm");
  }
  
  async function handleConfirm(pinValue: string) {
    setError("");
    setLoading(true);
    if (pin !== pinValue) {
      setError("PIN ไม่ตรงกัน! กรุณาตั้งใหม่");
      setPin("");
      setStep("first");
      setLoading(false);
      return false;
    }
    try {
      const res = await pinClient.setPin(pinValue);
      if (res.ok && res.data?.ok) {
        setStep("done");
        // ไปหน้าล็อกให้ใส่ PIN
        window.location.href = "/lock";
      } else {
        setError(res.error || "ไม่สามารถบันทึก PIN ได้");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-2 font-bold text-xl">ตั้ง PIN 4-6 หลัก</h1>
      {step === "first" && (
        <>
          <PinInput onSubmit={handleFirst} />
          <p className="text-gray-500 mt-2">ตั้ง PIN ใหม่</p>
        </>
      )}
      {step === "confirm" && (
        <>
          <PinInput onSubmit={handleConfirm} />
          <p className="text-gray-500 mt-2">ยืนยัน PIN อีกครั้ง</p>
        </>
      )}
      {step === "done" && <div>PIN ถูกบันทึกแล้ว!</div>}
      {loading && <div className="mt-2">กำลังบันทึก...</div>}
      {error && <div className="mt-2 text-red-500">{error}</div>}
    </main>
  );
}