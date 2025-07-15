'use client';
import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState("url"); // 'url' or 'paragraph'
  const [url, setUrl] = useState("");
  const [paragraph, setParagraph] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryUrdu, setSummaryUrdu] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary("");
    setSummaryUrdu("");
    // Input validation based on mode
    if (mode === "url" && !url) {
      setError("No URL provided");
      setLoading(false);
      return;
    }
    if (mode === "paragraph" && !paragraph) {
      setError("No paragraph provided");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/summarise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "url" ? { url } : { paragraph }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSummary(data.summary);
      setSummaryUrdu(data.summaryUrdu);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 animate-gradient-x p-4">
      <div className="relative bg-white/60 rounded-3xl shadow-2xl p-10 w-full max-w-2xl flex flex-col items-center backdrop-blur-xl border border-blue-200/60 ring-2 ring-purple-200/40 hover:ring-blue-400/60 transition-all duration-500 animate-fade-in">
        {/* Logo SVG */}
        <div className="mb-4 animate-fade-in">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="url(#paint0_linear_1_2)"/>
            <path d="M16 32L32 16M16 16h16v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#EC4899"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold mb-2 text-blue-700 text-center tracking-tight drop-shadow-lg animate-fade-in">Blog Summariser</h1>
        <p className="mb-8 text-gray-600 text-center text-lg animate-fade-in">Paste a blog URL or paragraph to get a smart summary and its Urdu translation.</p>
        {/* Toggle */}
        <div className="flex gap-2 mb-6 animate-fade-in">
          <button
            type="button"
            className={`px-4 py-2 rounded-l-lg font-semibold border transition-all ${mode === 'url' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
            onClick={() => setMode('url')}
          >
            By URL
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-r-lg font-semibold border transition-all ${mode === 'paragraph' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
            onClick={() => setMode('paragraph')}
          >
            By Paragraph
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full animate-fade-in">
          {mode === "url" ? (
            <input
              id="blog-url"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/blog-post"
              className="border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition hover:border-blue-400 hover:shadow-lg bg-white/80"
              required
            />
          ) : (
            <textarea
              id="paragraph"
              value={paragraph}
              onChange={e => setParagraph(e.target.value)}
              placeholder="Paste your paragraph here..."
              className="border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition hover:border-blue-400 hover:shadow-lg bg-white/80 min-h-[120px] resize-y"
              required
            />
          )}
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-2 font-bold shadow-md hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading || (mode === 'url' ? !url : !paragraph)}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            )}
            {loading ? "Summarising..." : `Summarise ${mode === 'url' ? 'Blog' : 'Paragraph'}`}
          </button>
        </form>
        {error && (
          <div className="mt-6 w-full bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-center font-semibold animate-fade-in">
            {error}
          </div>
        )}
        {summary && (
          <div className="mt-8 p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 w-full shadow-lg animate-fade-in">
            <h2 className="font-bold mb-2 text-blue-700 text-xl">Summary:</h2>
            <p className="text-gray-800 leading-relaxed mb-4">{summary}</p>
            <h2 className="font-bold mt-4 mb-2 text-green-700 text-xl">Summary (Urdu):</h2>
            <p className="text-gray-800 leading-relaxed">{summaryUrdu}</p>
          </div>
        )}
        {/* Badge */}
      </div>
      <footer className="mt-8 text-gray-400 text-sm text-center w-full max-w-2xl border-t border-gray-200 pt-4 flex flex-col items-center animate-fade-in">
        <span className="text-base text-blue-700 font-semibold">Made by Daniyal — Blog Summariser</span>
      </footer>
    </div>
  );
}
