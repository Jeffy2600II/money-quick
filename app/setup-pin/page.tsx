import React, { Suspense } from "react";
import SetupPinClient from "./SetupPinClient";

// Server component: render client component directly but DO NOT show any page-level
// fallback UI. We keep a Suspense boundary (required when client uses useSearchParams),
// but set fallback to null so no separate "page loader" appears — central loader will be used.
export default function SetupPinPage() {
  return (
    <Suspense fallback={null}>
      <SetupPinClient />
    </Suspense>
  );
}