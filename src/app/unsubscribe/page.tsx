"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://platform-backend-production-d567.up.railway.app";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/api/v1/unsubscribe-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-12 max-w-md w-full text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        {status === "done" ? (
          <>
            <div className="text-5xl mb-5">✅</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-3">Wypisałaś/eś się</h1>
            <p className="text-gray-500 leading-relaxed">
              Adres <strong>{email}</strong> został usunięty z listy mailingowej.
              Nie otrzymasz już ode mnie żadnych wiadomości.
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-5">✉️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-3">Wypisz się z listy</h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Podaj adres e-mail, a usuniemy go z listy mailingowej.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twój@email.pl"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {status === "loading" ? "Przetwarzam…" : "Wypisz mnie"}
              </button>
              {status === "error" && (
                <p className="text-red-500 text-sm">Coś poszło nie tak. Spróbuj ponownie lub napisz na hello@mniejroboty.pl</p>
              )}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
