export default function ConfirmButton({ onConfirm, disabled }: { onConfirm: () => void, disabled ? : boolean }) {
  return (
    <button
      className={`w-full py-3 text-xl rounded bg-blue-600 mt-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onConfirm}
      disabled={disabled}
      type="button"
    >
      ✔ ยืนยัน
    </button>
  );
}