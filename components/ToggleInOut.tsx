export default function ToggleInOut({ mode, setMode }: { mode: "in" | "out";setMode: (m: "in" | "out") => void }) {
  return (
    <div className="mb-4 flex justify-center gap-6">
      <button
        className={`px-4 py-2 rounded-xl border-2 font-bold ${mode === "in" ? "bg-green-200 border-green-600" : "bg-white border-gray-300"}`}
        onClick={() => setMode("in")}
        type="button"
      >
        + เงินเข้า
      </button>
      <button
        className={`px-4 py-2 rounded-xl border-2 font-bold ${mode === "out" ? "bg-red-100 border-red-500" : "bg-white border-gray-300"}`}
        onClick={() => setMode("out")}
        type="button"
      >
        − เงินออก
      </button>
    </div>
  );
}