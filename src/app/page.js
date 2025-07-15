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
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showListenOptions, setShowListenOptions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState("");

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

  const handleDownload = (lang) => {
    let text = lang === 'en' ? summary : summaryUrdu;
    let filename = lang === 'en' ? 'summary.txt' : 'summary-urdu.txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadOptions(false);
  };

  const handleListen = (lang) => {
    let text = lang === 'en' ? summary : summaryUrdu;
    let utter = new window.SpeechSynthesisUtterance(text);

    if (lang === 'en') {
      utter.lang = 'en-US';
    } else {
      // Try to find an Urdu voice
      const voices = window.speechSynthesis.getVoices();
      const urduVoice = voices.find(v =>
        v.lang.toLowerCase().startsWith('ur') ||
        v.name.toLowerCase().includes('urdu')
      );
      if (urduVoice) {
        utter.voice = urduVoice;
        utter.lang = urduVoice.lang;
      } else {
        setTtsError('Sorry, Urdu speech is not supported in your browser. Please try on a device with Urdu TTS support.');
        return;
      }
    }

    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
    setShowListenOptions(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <>
      <main>
        <div className="card">
          {/* Logo SVG */}
          <div className="logo-anim" style={{ marginBottom: '1.5rem' }}>
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
              <div className="input-group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-3.5-3.5"/></svg>
                <input
                  id="blog-url"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com/blog-post"
                  required
                />
              </div>
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
          {loading && (
            <div style={{ margin: '1.5em 0', textAlign: 'center', color: '#a18cd1', fontWeight: 600, fontSize: '1.1rem' }}>
              <svg style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5em' }} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#a18cd1" strokeWidth="4" opacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#a18cd1" strokeWidth="4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                </path>
              </svg>
              Summarising... Please wait a moment
            </div>
          )}
          {error && (
            <div style={{ marginTop: '1.5rem', color: '#b91c1c', background: '#fee2e2', borderRadius: '1em', padding: '1em', width: '100%', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}
          {summary && (
            <>
              <div className="summary-card">
                <h2 style={{ fontWeight: 700, color: '#232946', fontSize: '1.2rem', marginBottom: '0.5em' }}>Summary:</h2>
                <p style={{ color: '#232946', marginBottom: '1em' }}>{summary}</p>
                <h2 style={{ fontWeight: 700, color: '#0e7c3a', fontSize: '1.2rem', marginBottom: '0.5em' }}>Summary (Urdu):</h2>
                <p style={{ color: '#232946' }}>{summaryUrdu}</p>
              </div>
              <div style={{ marginTop: '1.2em', textAlign: 'center' }}>
                <button onClick={() => { setShowDownloadOptions(v => !v); setShowListenOptions(false); }} style={{ marginRight: '0.5em', fontWeight: 700 }}>
                  Download
                </button>
                <button onClick={() => { setShowListenOptions(v => !v); setShowDownloadOptions(false); }} style={{ marginRight: '0.5em', fontWeight: 700 }}>
                  Listen
                </button>
                {showDownloadOptions && (
                  <div style={{ marginTop: '0.7em', display: 'flex', gap: '1em', justifyContent: 'center' }}>
                    <button onClick={() => handleDownload('en')} style={{ background: '#a18cd1', color: '#fff', fontWeight: 600 }}>English</button>
                    <button onClick={() => handleDownload('ur')} style={{ background: '#fbc2eb', color: '#232946', fontWeight: 600 }}>Urdu</button>
                  </div>
                )}
                {showListenOptions && (
                  <div style={{ marginTop: '0.7em', display: 'flex', gap: '1em', justifyContent: 'center' }}>
                    <button onClick={() => handleListen('en')} style={{ background: '#a18cd1', color: '#fff', fontWeight: 600 }}>English</button>
                    <button onClick={() => handleListen('ur')} style={{ background: '#fbc2eb', color: '#232946', fontWeight: 600 }}>Urdu</button>
                  </div>
                )}
                {isSpeaking && (
                  <button onClick={handleStop} style={{ marginTop: '0.7em', background: '#b91c1c', color: '#fff', fontWeight: 600, borderRadius: '1em', padding: '0.5em 1.2em' }}>
                    Stop
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      {ttsError && (
        <div style={{
          position: 'fixed',
          top: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.98)',
          color: '#b91c1c',
          border: '1.5px solid #a18cd1',
          borderRadius: '1.2em',
          boxShadow: '0 4px 24px rgba(44,62,80,0.13)',
          padding: '1.2em 2em',
          zIndex: 1000,
          fontWeight: 600,
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1em',
        }}>
          <span>{ttsError}</span>
          <button onClick={() => setTtsError("")} style={{
            background: '#a18cd1',
            color: '#fff',
            border: 'none',
            borderRadius: '0.7em',
            padding: '0.3em 1em',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: '1em',
          }}>OK</button>
        </div>
      )}
      <footer>
        <span>Made by Daniyal — Blog Summariser</span>
      </footer>
    </>
  );
}
