"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type QaResponse = { answer: string; sources: { id: string; title: string }[] };

const suggestions = [
  "Which laptop is lightest?",
  "Which has the best battery health?",
  "What’s the cheapest 16GB laptop?",
  "Which options suit programming?",
];

export function CatalogueAssistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QaResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef<AbortController | null>(null);

  async function runQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/qa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: trimmed }), signal: controller.signal });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error();
      setResult(data as QaResponse);
    } catch {
      if (!controller.signal.aborted) setError("The catalogue assistant is temporarily unavailable. Your question is still here, so you can try again.");
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false); }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runQuestion(question);
  }

  function applySuggestion(suggestion: string) {
    if (pending.current) return;
    setQuestion(suggestion);
    void runQuestion(suggestion);
  }

  return <section aria-labelledby="assistant-heading" className="mt-14 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-16 sm:p-6">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5A2.5 2.5 0 0 1 4 12.5v-7Z"/><path d="M8 8h8M8 11h5"/></svg>
      </div>
      <div><h2 id="assistant-heading" className="text-xl font-bold text-slate-950">Ask the catalogue</h2><p className="mt-1 text-sm leading-6 text-slate-600">Compare laptops or ask about their listed specifications.</p></div>
    </div>

    <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
      <label htmlFor="catalogue-question" className="sr-only">Ask a question about the laptop catalogue</label>
      <input id="catalogue-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="e.g. Which laptop is lightest?" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base shadow-inner shadow-slate-100 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
      <button type="submit" disabled={loading || !question.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50">{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}{loading ? "Checking…" : "Ask question"}</button>
    </form>

    <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible" aria-label="Suggested catalogue questions">
      {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => applySuggestion(suggestion)} disabled={loading} className="min-h-11 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50">{suggestion}</button>)}
    </div>

    <div className="min-h-6" aria-live="polite" aria-busy={loading}>
      {loading && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-600"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />Checking the catalogue…</p>}
      {error && <div role="alert" className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"><p>{error}</p><button type="button" onClick={() => void runQuestion(question)} disabled={loading} className="min-h-11 self-start rounded-lg border border-red-300 bg-white px-4 font-semibold hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:self-auto">Try again</button></div>}
      {result && <article className={`mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${loading ? "opacity-70" : ""}`}>
        <div className="p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Answer</p><p className="mt-2 whitespace-pre-wrap break-words leading-7 text-slate-800">{result.answer}</p><p className="mt-3 text-xs text-slate-500">Based only on information in the seeded catalogue.</p></div>
        {result.sources.length > 0 && <div className="border-t border-slate-200 bg-white p-4 sm:px-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sources</p><ul className="mt-2 flex flex-wrap gap-2">{result.sources.map((source) => <li key={source.id} className="max-w-full"><Link href={`/listing/${encodeURIComponent(source.id)}`} className="inline-flex min-h-11 max-w-full items-center break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{source.title}<span className="ml-1 shrink-0" aria-hidden="true">↗</span></Link></li>)}</ul></div>}
      </article>}
    </div>
  </section>;
}
