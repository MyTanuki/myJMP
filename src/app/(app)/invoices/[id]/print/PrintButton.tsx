"use client";

export default function PrintButton() {
  return (
    <div className="flex justify-end mb-4 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl transition"
      >
        🖨️ พิมพ์บิล
      </button>
    </div>
  );
}
