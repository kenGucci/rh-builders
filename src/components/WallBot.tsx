"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  User,
  X,
  Mic,
  Send,
  Paperclip,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  matchKnowledge,
  isGreeting,
  isHelpRequest,
  pickFallback,
  GREETINGS,
  HELP_TEXT,
  QUICK_REPLIES,
  type KBEntry,
} from "@/lib/wallbot-knowledge";

type VoicePref = "male" | "female" | "off";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  emoji?: string;
  link?: { href: string; label: string };
  media?: { name: string; size: string; type: string };
  time: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "bot",
  emoji: "🖤",
  text: "Hey! I'm Wall Bot 🤖 — your live guide to THE WALL. I know every page, component, and feature here. Try voice mode 🎙️ (male/female), attach an image or video 🖼️, or ask about prices, transactions, Stock Tokens, and search.",
  time: "now",
};

let idCounter = 0;
const uid = () => `wb-${Date.now()}-${idCounter++}`;

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number): string {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function WallBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [typing, setTyping] = useState(false);
  const [voicePref, setVoicePref] = useState<VoicePref>("off");
  const [listening, setListening] = useState(false);
  const [attached, setAttached] = useState<{ name: string; size: string; type: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ─── Persistence ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wallbot.messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
      const vp = localStorage.getItem("wallbot.voice");
      if (vp === "male" || vp === "female" || vp === "off") setVoicePref(vp);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wallbot.messages", JSON.stringify(messages.slice(-60)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("wallbot.voice", voicePref);
    } catch {}
  }, [voicePref]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, open]);

  // ─── Text-to-speech (male/female voices) ───
  const speak = useCallback(
    (text: string) => {
      if (voicePref === "off" || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[📈📊🎙️🤖🖤👋💎⚡💳🌐🗂️🖼️🔍🏠⛓️💰🔐🧭🧩🌍📄📑🎨📰🔄🗃️🏦🤝📚😄🙂🤔💡⌨️]/g, ""));
        u.lang = "en-US";
        u.rate = 1.05;
        u.pitch = voicePref === "male" ? 0.8 : 1.4;
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
          const preferred = en.find((v) =>
            voicePref === "male"
              ? /(daniel|alex|fred|david|arthur|thomas|google us english|male|george|eddy)/i.test(v.name)
              : /(samantha|victoria|zira|karen|moira|allison|google uk english female|female|veena|fiona|tessa)/i.test(v.name)
          );
          if (preferred) u.voice = preferred;
        }
        window.speechSynthesis.speak(u);
      } catch {}
    },
    [voicePref]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {};
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  // ─── Speech-to-text (voice input) ───
  const startListening = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start(): void;
        stop(): void;
        onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
      };
      webkitSpeechRecognition?: unknown;
    };
    const Recognition = w.SpeechRecognition || (w.webkitSpeechRecognition as typeof w.SpeechRecognition | undefined);
    if (!Recognition) {
      setMessages((m) => [...m, botMsg("😅 Voice input isn't supported in this browser. Try Chrome or Edge — or just type your question!", "🎙️")]);
      return;
    }
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => send(transcript), 120);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  // ─── Media attach (image / video) ───
  const onAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const meta = { name: file.name, size: formatSize(file.size), type: file.type || "file" };

    if (file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const dims = `${img.naturalWidth}×${img.naturalHeight}px`;
        URL.revokeObjectURL(url);
        setAttached(meta);
        setMessages((m) => [
          ...m,
          botMsg(`Got your image "${file.name}" 🖼️ — a ${file.type.replace("image/", "")} of ${dims} (${meta.size}).`, "🖼️"),
        ]);
      };
      img.onerror = () => {
        setAttached(meta);
        setMessages((m) => [...m, botMsg(`Got your image "${file.name}" 🖼️ (${meta.size}).`, "🖼️")]);
      };
      img.src = url;
      return;
    }

    setAttached(meta);
    setMessages((m) => [
      ...m,
      botMsg(
        file.type.startsWith("video/")
          ? `Got your video "${file.name}" 🎬 — a ${file.type.replace("video/", "")} of ${meta.size}. I can help you understand it — tell me what you'd like to know!`
          : `Got "${file.name}" 📎 (${file.type || "file"} · ${meta.size}).`,
        file.type.startsWith("video/") ? "🎬" : "📎"
      ),
    ]);
  };

  const botMsg = (text: string, emoji?: string, link?: Message["link"]): Message => ({
    id: uid(),
    role: "bot",
    text,
    emoji,
    link,
    time: nowTime(),
  });

  // ─── Live intents ───
  const liveReplies = useCallback(async (intent: string): Promise<Message | null> => {
    try {
      if (intent === "prices") {
        const res = await fetch("/api/market?action=quotes&category=all");
        const data = await res.json();
        const qs: { symbol: string; price: number; changePercent: number }[] = data.quotes || [];
        if (qs.length === 0) return botMsg("Couldn't pull live prices right now 😕 Try again in a moment.", "📉");
        const sorted = [...qs].sort((a, b) => b.changePercent - a.changePercent);
        const top3 = sorted.slice(0, 3);
        const lines = top3.map((q) => `${q.symbol} $${q.price.toLocaleString()} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`).join("\n");
        return botMsg(
          `Live market summary 📈 — ${qs.length} Stock Tokens tracking:\n\n${lines}\n\nOpen the Market page for the full live board!`,
          "📈",
          { href: "/market", label: "Open Market" }
        );
      }
      if (intent === "transactions") {
        const res = await fetch("/api/recent-transactions");
        const data = await res.json();
        const txs: { hash: string; from: string; to: string; value: string; timestamp: string }[] = data.transactions || [];
        if (txs.length === 0) return botMsg("No recent transactions found ⚡", "⚡");
        const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");
        const lines = txs.slice(0, 5).map((tx) => `${short(tx.from)} → ${short(tx.to)} ${parseFloat(tx.value) > 0 ? (parseFloat(tx.value).toFixed(4) + " ETH") : ""}`).join("\n");
        return botMsg(`Here are the latest live transactions ⚡\n\n${lines}`, "⚡", {
          href: "https://robinhoodchain.blockscout.com/txs",
          label: "View all in Blockscout",
        });
      }
      if (intent === "stats") {
        const res = await fetch("/api/onchain");
        const data = await res.json();
        const s = data.stats || {};
        const fmt = (n: number | undefined) => (n == null ? "—" : Number(n).toLocaleString());
        return botMsg(
          `Live Robinhood Chain stats 📊\n\n• Transactions: ${fmt(s.totalTransactions)}\n• Blocks: ${fmt(s.totalBlocks)}\n• Addresses: ${fmt(s.totalAddresses)}\n• Avg block time: ${s.avgBlockTime ? (s.avgBlockTime / 1000).toFixed(1) + "s" : "—"}\n• RH price: ${s.coinPrice ? "$" + Number(s.coinPrice).toLocaleString() : "—"}`,
          "📊",
          { href: "/", label: "Open Dashboard" }
        );
      }
      if (intent === "stock-tokens") {
        const res = await fetch("/api/stock-tokens");
        const data = await res.json();
        const tokens: { symbol: string; name: string }[] = data.tokens || [];
        if (tokens.length === 0) return botMsg("Couldn't load Stock Tokens right now 💎", "💎");
        return botMsg(
          `The 14 Stock Tokens 💎\n\n${tokens.map((t) => `${t.symbol} — ${t.name}`).join("\n")}\n\nEach is 1:1 backed by real stock on Robinhood Chain. Ask for live prices!`,
          "💎",
          { href: "/market", label: "Open Market" }
        );
      }
      if (intent === "search-help") {
        return botMsg(
          "How to search 🔍\n\n• Contract address (CA) → the real project profile 📄\n• X handle (@…) → the live X profile 🐦\n• Wallet (0x…) → the developer profile 💳\n• Stock Token (NVDA, TSLA…) → instant token profile\n\nJust type in any search bar and press Enter, or use ⌘K!",
          "🔍"
        );
      }
      if (intent.startsWith("nav-")) {
        const known: Record<string, { href: string; label: string; name: string }> = {
          "nav-market": { href: "/market", label: "Opening the Market…", name: "Market" },
          "nav-team": { href: "/team", label: "Opening the Community page…", name: "Community" },
          "nav-dashboard": { href: "/", label: "Opening the Dashboard…", name: "Dashboard" },
          "nav-global": { href: "/global", label: "Opening Global search…", name: "Global" },
          "nav-builder": { href: "/builder", label: "Opening Builders…", name: "Builders" },
          "nav-settings": { href: "/settings", label: "Opening Settings…", name: "Settings" },
          "nav-about": { href: "/about", label: "Opening About…", name: "About" },
        };
        const target = known[intent];
        if (target) {
          setTimeout(() => router.push(target.href), 900);
          return botMsg(`Taking you to the ${target.name} page 🧭`, "🧭");
        }
      }
      if (intent === "help") {
        return botMsg(HELP_TEXT, "🤖");
      }
    } catch {
      return botMsg("I hit a small snag fetching live data 😅 Please try again in a moment.", "😅");
    }
    return null;
  }, [router]);

  const getReply = useCallback(
    async (raw: string): Promise<Message> => {
      const t = raw.trim().toLowerCase();

      // Quick-reply / live intents
      const quick = QUICK_REPLIES.find((q) => q.intent && t === q.label.toLowerCase());
      let liveIntent = "";
      const liveMap: [string, RegExp][] = [
        ["prices", /(price|quotes|market now|how is the market|gainers|losers|live price|stock price)/],
        ["transactions", /(transactions|txns|recent tx|latest tx|live tx|activity feed|what.?s moving)/],
        ["stats", /(chain stats|statistics|total transactions|total blocks|block time|network stats|overall stats)/],
        ["stock-tokens", /(stock tokens|list of stocks|which stocks|show tokens|all tokens|token list|the 14)/],
        ["search-help", /(how (do i|to) search|how does search|search help|search a (wallet|token|ca|contract))/],
        ["help", /(what can you do|what do you do|how do you work|commands|features|menu)/],
        ["nav-market", /(open|go to|take me to|navigate to|show me).*(market)/],
        ["nav-team", /(open|go to|take me to|navigate to|show me).*(team)/],
        ["nav-dashboard", /(open|go to|take me to|navigate to|show me).*(dashboard|home)/],
        ["nav-global", /(open|go to|take me to|navigate to|show me).*(global)/],
        ["nav-builder", /(open|go to|take me to|navigate to|show me).*(builder|dev)/],
        ["nav-settings", /(open|go to|take me to|navigate to|show me).*(settings)/],
        ["nav-about", /(open|go to|take me to|navigate to|show me).*(about)/],
      ];
      for (const [id, re] of liveMap) {
        if (re.test(t)) {
          liveIntent = id;
          break;
        }
      }
      if (liveIntent) {
        const r = await liveReplies(liveIntent);
        if (r) return r;
      }

      if (quick?.intent) {
        const r = await liveReplies(quick.intent);
        if (r) return r;
      }

      if (isGreeting(t)) return botMsg(GREETINGS[Math.floor(Math.random() * GREETINGS.length)].text, "👋");
      if (isHelpRequest(t)) return botMsg(HELP_TEXT, "🤖");

      const m = matchKnowledge(raw);
      if (m.entry && m.score >= 3) {
        return botMsg(m.entry.text, m.entry.emoji, m.entry.link);
      }
      return botMsg(pickFallback().text, pickFallback().emoji);
    },
    [liveReplies]
  );

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text) return;
      setInput("");
      setAttached(null);
      setMessages((m) => [...m, { id: uid(), role: "user", text, time: nowTime() }]);
      setTyping(true);
      const reply = await getReply(text);
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, reply]);
        speak(reply.text);
      }, 320);
    },
    [input, getReply, speak]
  );

  // Voice toggle buttons in header
  const voiceButtons: { pref: VoicePref; label: string; title: string }[] = [
    { pref: "male", label: "♂", title: "Male voice" },
    { pref: "female", label: "♀", title: "Female voice" },
  ];

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-black shadow-[0_8px_30px_rgba(0,200,5,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
        aria-label={open ? "Close Wall Bot" : "Open Wall Bot assistant"}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-[var(--bg)] live-blink" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[min(92vw,380px)] h-[min(70vh,540px)] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden fade-in">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-[var(--accent)]/15 to-emerald-400/10 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-400 flex items-center justify-center">
                <Bot size={18} className="text-black" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[var(--bg-card)] live-blink" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">Wall Bot</div>
              <div className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-400 live-blink" />
                Online · knows everything about the site
              </div>
            </div>
            <div className="flex items-center gap-1">
              {voiceButtons.map((v) => (
                <button
                  key={v.pref}
                  onClick={() => {
                    setVoicePref(v.pref);
                    if (v.pref !== "off") speak("Voice enabled.");
                  }}
                  title={v.title}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${voicePref === v.pref ? "bg-[var(--accent)] text-black" : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border-subtle)]"}`}
                >
                  {v.label}
                </button>
              ))}
              <button
                onClick={() => setVoicePref((v) => (v === "off" ? "female" : "off"))}
                title="Toggle voice"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all"
              >
                {voicePref === "off" ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[var(--accent)]" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-black" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--accent)] text-black rounded-br-md"
                      : "bg-[var(--surface)] border border-[var(--border-subtle)] rounded-bl-md"
                  }`}
                >
                  {m.emoji && <span className="mr-1">{m.emoji}</span>}
                  <span className="whitespace-pre-line">{m.text}</span>
                  {m.link && (
                    <Link
                      href={m.link.href}
                      className="block mt-2 text-[var(--accent)] font-medium hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      {m.link.label} →
                    </Link>
                  )}
                  <div className="text-[8px] text-[var(--text-muted)] mt-1">{m.time}</div>
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-black" />
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                  <span className="text-[10px] text-[var(--text-muted)]">thinking fast…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto shrink-0">
            {QUICK_REPLIES.slice(0, 4).map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  setMessages((m) => [...m, { id: uid(), role: "user", text: q.label, time: nowTime() }]);
                  setTyping(true);
                  liveReplies(q.intent).then((r) => {
                    setTimeout(() => {
                      setTyping(false);
                      if (r) {
                        setMessages((m) => [...m, r]);
                        speak(r.text);
                      }
                    }, 320);
                  });
                }}
                className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Attached file chip */}
          {attached && (
            <div className="px-3 pt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
              <span className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center gap-1">
                <Paperclip size={10} />
                {attached.name} · {attached.size}
              </span>
            </div>
          )}

          {/* Input bar */}
          <div className="p-3 border-t border-[var(--border-subtle)] flex items-center gap-1.5">
            <label className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer transition-all" title="Attach image or video">
              <Paperclip size={15} />
              <input type="file" accept="image/*,video/*" className="hidden" onChange={onAttach} />
            </label>
            <button
              onClick={startListening}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${listening ? "bg-red-500/15 text-red-400 animate-pulse" : "text-[var(--text-muted)] hover:text-[var(--accent)]"}`}
              title="Voice input"
            >
              <Mic size={15} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Ask me anything about THE WALL…"
              className="flex-1 min-w-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 focus:shadow-[0_0_12px_var(--accent-glow)] transition-all outline-none"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-lg bg-[var(--accent)] text-black flex items-center justify-center hover:brightness-110 disabled:opacity-30 transition-all"
              title="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
