'use client'
import { useState } from "react";
import PinInput from "../../components/PinInput";

export default function ChangePinPage() {
  const [step, setStep] = useState < "old" | "new" | "confirm" | "done" > ("old");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  
  async function handleOldPin(pinValue: string) {
    setOldPin(pinValue);
    setStep("new");
  }
  async function handleNewPin(pinValue: string) {
    setNewPin(pinValue);
    setStep("confirm");
  }
  async function handleConfirmPin(pinValue: string) {
    if (newPin !== pinValue) {
      setError("PIN ใหม่ไม่ตรงกัน");
      setStep("new");
    } else {
      setError("");
      const result = await fetch("/api/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin })
      });
      if (result.ok) {
        localStorage.setItem("pin", newPin);
        setStep("done");
      } else {
        setError("PIN เดิมผิด หรือเกิดข้อผิดพลาด");
        setStep("old");
      }
    }
  }
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-6">
      <h1 className="font-bold mb-2 text-xl">เปลี่ยนรหัส PIN</h1>
      {step === "old" && (
        <>
          <p className="mb-2 text-gray-500">กรุณาใส่ PIN เก่า</p>
          <PinInput onSubmit={handleOldPin} />
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      )}
      {step === "new" && (
        <>
          <p className="mb-2 text-gray-500">ตั้ง PIN ใหม่</p>
          <PinInput onSubmit={handleNewPin} />
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      )}
      {step === "confirm" && (
        <>
          <p className="mb-2 text-gray-500">ยืนยัน PIN ใหม่อีกครั้ง</p>
          <PinInput onSubmit={handleConfirmPin} />
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      )}
      {step === "done" && (
        <div className="text-green-600 mt-4">เปลี่ยน PIN สำเร็จ!</div>
      )}
    </main>
  );
}