'use client'
export default function ConfirmButton({ onConfirm, disabled }: { onConfirm: () => void, disabled ? : boolean }) {
  return (
    <button onClick={onConfirm} disabled={disabled}
      className={`w-full py-3 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed bg-neutral/6' : 'button-primary'}`}>
      ยืนยัน
    </button>
  );
}