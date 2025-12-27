import React, { Suspense } from "react";
import SetupPinClient from "./SetupPinClient";

// Server component: ห่อ client component ด้วย Suspense เพื่อหลีกเลี่ยง
// ข้อผิดพลาด "useSearchParams() should be wrapped in a suspense boundary"
export default function SetupPinPage() {
  return (
    <Suspense fallback={
      <main className="pin-page">
        <div className="pin-top" />
        <div className="pin-brand">
          <div className="logo"><span className="logo-mark">💰</span><span className="logo-text">Money quick</span></div>
          <div className="pin-prompt">กำลังโหลด...</div>
        </div>
        <div className="pin-loading">กำลังโหลดหน้า...</div>
      </main>
    }>
      <SetupPinClient />
    </Suspense>
  );
}