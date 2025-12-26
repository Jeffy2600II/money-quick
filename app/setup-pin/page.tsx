'use client'
import { useState } from "react";
import PinInput from "../../components/PinInput";

export default function SetupPinPage() {
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState < "first" | "confirm" | "done" > ("first");
  const [pin, setPin] = useState < string > ("");
  
  async function handleFirst(pinValue: string) {
    setPin(pinValue);
    setStep("confirm");
  }
  async function handleConfirm(pinValue: string) {
    if (pin !== pinValue) {
      setConfirmPin("");
      setStep("first");
      alert("PIN ไม่ตรงกัน! กรุณาตั้งใหม่");
    } else {
      await fetch("/api/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      setStep("done");
      window.location.href = "/lock";
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
    </main>
  );
}