'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";

export default function ChangePinPage() {
  const [step, setStep] = useState < "old" | "new" | "confirm" | "done" > ("old");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  async function handleOldPin(pinValue: string) {
    setError("");
    setLoading(true);
    try {
      const res = await pinClient.checkPin(pinValue);
      if (res.ok && res.data?.ok) {
        setOldPin(pinValue);
        setStep("new");
      } else {
        setError("PIN เดิมไม่ถูกต้อง");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }
  
  async function handleNewPin(pinValue: string) {
    setNewPin(pinValue);
    setStep("confirm");
  }
  
  async function handleConfirmPin(pinValue: string) {
    setError("");
    setLoading(true);
    if (newPin !== pinValue) {
      setError("PIN ใหม่ไม่ตรงกัน");
      setStep("new");
      setLoading(false);
      return;
    }
    try {
      const res = await pinClient.changePin(oldPin, newPin);
      if (res.ok && res.data?.ok) {
        localStorage.setItem("pin", newPin);
        setStep("done");
      } else {
        setError(res.error || "PIN เดิมผิด หรือเกิดข้อผิดพลาด");
        setStep("old");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setStep("old");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-6">
      <h1 className="font-bold mb-2 text-xl">เปลี่ยนรหัส PIN</h1>
      {step === "old" && (
        <>
          <p className="mb-2 text-gray-500">กรุณาใส่ PIN เก่า</p>
          <PinInput onSubmit={handleOldPin} />
        </>
      )}
      {step === "new" && (
        <>
          <p className="mb-2 text-gray-500">ตั้ง PIN ใหม่</p>
          <PinInput onSubmit={handleNewPin} />
        </>
      )}
      {step === "confirm" && (
        <>
          <p className="mb-2 text-gray-500">ยืนยัน PIN ใหม่อีกครั้ง</p>
          <PinInput onSubmit={handleConfirmPin} />
        </>
      )}
      {step === "done" && <div className="text-green-600 mt-4">เปลี่ยน PIN สำเร็จ!</div>}
      {loading && <div className="mt-4">กำลังประมวลผล...</div>}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </main>
  );
}