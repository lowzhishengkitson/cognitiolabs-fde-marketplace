"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type QaResponse = { answer: string; sources: { id: string; title: string }[] };

export function CatalogueAssistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QaResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef<AbortController | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/qa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question.trim() }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Catalogue Q&A is temporarily unavailable.");
      setResult(data as QaResponse);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Catalogue Q&A is temporarily unavailable.");
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false); }
    }
  }

  return <section aria-labelledby="assistant-heading" className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <h2 id="assistant-heading" className="text-xl font-bold">Ask about the catalogue</h2>
    <p className="mt-1 text-sm text-slate-600">Compare seeded laptops or ask about their listed specifications.</p>
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
      <label htmlFor="catalogue-question" className="sr-only">Your catalogue question</label>
      <input id="catalogue-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="Which laptop is lightest?" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-blue-700" />
      <button type="submit" disabled={loading || !question.trim()} className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Checking…" : "Ask"}</button>
    </form>
    <div aria-live="polite" aria-busy={loading}>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {result && <div className="mt-5 rounded-xl bg-slate-50 p-4 sm:p-5"><p className="whitespace-pre-wrap leading-7 text-slate-800">{result.answer}</p>
        {result.sources.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3"><p className="text-sm font-semibold text-slate-600">Based on:</p><ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{result.sources.map((source) => <li key={source.id}><Link href={`/listing/${encodeURIComponent(source.id)}`} className="text-sm font-medium text-blue-700 underline hover:text-blue-900">{source.title}</Link></li>)}</ul></div>}
      </div>}
    </div>
  </section>;
}
