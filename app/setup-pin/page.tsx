import SetupPinClient from "./SetupPinClient";

// Server component: เพียงแค่ render client component เพื่อหลีกเลี่ยงการเรียก useSearchParams ใน server
export default function SetupPinPage() {
  return <SetupPinClient />;
}