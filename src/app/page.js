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
    <>
      <main>
        <div className="card">
          {/* Logo SVG */}
          <div style={{ marginBottom: '1.5rem' }}>
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
          <h1>Blog Summariser</h1>
          <p>Paste a blog URL or paragraph to get a smart summary and its Urdu translation.</p>
          {/* Toggle */}
          <div className="button-group">
            <button
              type="button"
              style={{ fontWeight: mode === 'url' ? 700 : 500, opacity: mode === 'url' ? 1 : 0.7 }}
              onClick={() => setMode('url')}
            >
              By URL
            </button>
            <button
              type="button"
              style={{ fontWeight: mode === 'paragraph' ? 700 : 500, opacity: mode === 'paragraph' ? 1 : 0.7 }}
              onClick={() => setMode('paragraph')}
            >
              By Paragraph
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {mode === "url" ? (
              <input
                id="blog-url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/blog-post"
                required
              />
            ) : (
              <textarea
                id="paragraph"
                value={paragraph}
                onChange={e => setParagraph(e.target.value)}
                placeholder="Paste your paragraph here..."
                required
              />
            )}
            <button
              type="submit"
              disabled={loading || (mode === 'url' ? !url : !paragraph)}
              style={{ width: '100%', marginTop: '0.5em' }}
            >
              {loading ? "Summarising..." : `Summarise ${mode === 'url' ? 'Blog' : 'Paragraph'}`}
            </button>
          </form>
          {error && (
            <div style={{ marginTop: '1.5rem', color: '#b91c1c', background: '#fee2e2', borderRadius: '1em', padding: '1em', width: '100%', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}
          {summary && (
            <div className="summary-card">
              <h2 style={{ fontWeight: 700, color: '#232946', fontSize: '1.2rem', marginBottom: '0.5em' }}>Summary:</h2>
              <p style={{ color: '#232946', marginBottom: '1em' }}>{summary}</p>
              <h2 style={{ fontWeight: 700, color: '#0e7c3a', fontSize: '1.2rem', marginBottom: '0.5em' }}>Summary (Urdu):</h2>
              <p style={{ color: '#232946' }}>{summaryUrdu}</p>
            </div>
          )}
        </div>
      </main>
      <footer>
        <span>Made by Daniyal — Blog Summariser</span>
      </footer>
    </>
  );
}
