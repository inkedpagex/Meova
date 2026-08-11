"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Edit3, MoreHorizontal, Check, X,
  Send, Loader2, Users, MessageSquare, Plus
} from "lucide-react";
import { db, auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from "firebase/firestore";
import { mockDb } from "@/lib/mockDatabase";
import { getCartoonAvatar, getUserAvatarUrl } from "@/utils/avatar";

// ─── Types ───────────────────────────────────────────────────────
interface ChatMsg {
  id: string;
  sender: "user" | "character";
  senderName?: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  isGroup?: boolean;
  category?: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  online?: boolean;
}

// ─── Peer responses ───────────────────────────────────────────────
const PEER_RESPONSES: Record<string, string[]> = {
  "Aarav Sharma": [
    "Hey! Are you joining Coffee Connect today?",
    "Working on a React app for the hackathon — wanna team up?",
    "Just finished debugging a nasty bug. Always check your API calls!",
    "Let me know if you want to collaborate on the project.",
  ],
  "Priya Gupta": [
    "That photography walk looks so fun, are you going?",
    "Just updated the UI mockups — check the Figma link!",
    "We should brainstorm some ideas for the campus fest.",
    "Design system is coming together nicely.",
  ],
  "Nikhil Verma": [
    "Can you help with the project?!",
    "I'll share the notes here once I have them.",
    "The assignment deadline is tomorrow, right?",
    "Let's sync up before the presentation.",
  ],
  default: [
    "Hey! Great to connect here.",
    "What are you working on today?",
    "Let's plan something soon.",
    "Sure, sounds good!",
  ],
};

const GROUP_RESPONSES: Record<string, string[]> = {
  "Study Buddies": [
    "Nikhil: I'll share the notes here.",
    "Priya: Anyone done Q3 yet?",
    "Aarav: Library at 4 PM today?",
    "Let's divide the chapters.",
  ],
  "Startup Circle": [
    "New meetup posted — Pitch Perfect!",
    "Who's pitching this week?",
    "Arjun: I've updated the deck.",
    "Gaming night after the meetup?",
  ],
  "Gaming Arena": [
    "Tournament registration open!",
    "Aarav: I'm in for the BGMI cup.",
    "Finals are on Saturday.",
    "Let's practice tonight.",
  ],
  default: [
    "Hey everyone!",
    "What's the plan for today?",
    "Anyone online?",
    "See you all soon!",
  ],
};

// ─── Default contacts list ────────────────────────────────────────
const CONTACTS_DEFAULT: Contact[] = [
  { id: "aarav", name: "Aarav Sharma", avatar: getCartoonAvatar("Aarav"), lastMessage: "Hey, are you joining Coffee Connect?", lastTime: "2m", unread: 1, online: true },
  { id: "priya", name: "Priya Gupta", avatar: getCartoonAvatar("Priya"), lastMessage: "That photography walk looks fun", lastTime: "15m", unread: 1, online: true },
  { id: "nikhil", name: "Nikhil Verma", avatar: getCartoonAvatar("Nikhil"), lastMessage: "Can you help with the project?!", lastTime: "1h", unread: 0, online: false },
  { id: "study_buddies", name: "Study Buddies", avatar: "", isGroup: true, category: "Study", lastMessage: "Nikhil: I'll share the notes here.", lastTime: "2h", unread: 0, online: true },
  { id: "startup_circle", name: "Startup Circle", avatar: "", isGroup: true, category: "Startup", lastMessage: "New meetup announcement!", lastTime: "6h", unread: 1, online: true },
  { id: "arjun", name: "Arjun Singh", avatar: getCartoonAvatar("Arjun"), lastMessage: "Thanks for the help earlier!", lastTime: "1d", unread: 0, online: false },
  { id: "gaming_arena", name: "Gaming Arena", avatar: "", isGroup: true, category: "Gaming", lastMessage: "Tournament registration open", lastTime: "1d", unread: 1, online: false },
];

const REQUESTS_DEFAULT = [
  { id: "req_ananya", name: "Ananya", avatar: getCartoonAvatar("Ananya"), label: "Wants to connect" },
  { id: "req_vivek", name: "Vivek", avatar: getCartoonAvatar("Vivek"), label: "Wants to connect" },
  { id: "req_riya", name: "Riya", avatar: getCartoonAvatar("Riya"), label: "Wants to connect" },
];

function getGroupAvatar(name: string, category?: string) {
  const colors: Record<string, string> = {
    Study: "4f46e5", Startup: "7c3aed", Gaming: "0ea5e9", default: "6366f1",
  };
  const col = colors[category || ""] || colors.default;
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23${col}"/><text x="50" y="60" font-size="34" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">${initials}</text></svg>`;
}

// ─── Main MessagesContent ─────────────────────────────────────────
function MessagesContent() {
  const searchParams = useSearchParams();
  const initialUser = searchParams.get("user");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>(CONTACTS_DEFAULT);
  const [requests, setRequests] = useState(REQUESTS_DEFAULT);
  const [search, setSearch] = useState("");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({});
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        const full = mockDb.getUser(u.uid);
        setCurrentUser({ id: u.uid, email: u.email, name: u.displayName || u.email?.split("@")[0] || "User", ...full });
      } else {
        setCurrentUser({ id: "local-user", name: "You", email: "user@example.com" });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Open chat from URL param
  useEffect(() => {
    if (initialUser && contacts.length) {
      const found = contacts.find(c => c.name.toLowerCase().includes(initialUser.toLowerCase()));
      if (found) setActiveContact(found);
      else {
        // Create a temp contact
        const temp: Contact = { id: "temp-" + Date.now(), name: initialUser, avatar: getCartoonAvatar(initialUser), online: true, lastMessage: "", lastTime: "now", unread: 0 };
        setContacts(prev => [temp, ...prev]);
        setActiveContact(temp);
      }
    }
  }, [initialUser, contacts.length]);

  // Scroll to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats, activeContact, isTyping]);

  // Mark as read on open
  useEffect(() => {
    if (activeContact) {
      setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, unread: 0 } : c));
    }
  }, [activeContact?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !activeContact) return;
    const msg: ChatMsg = { id: Date.now().toString(), sender: "user", text: input.trim(), timestamp: new Date() };
    setChats(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), msg] }));
    
    // Update last message in contact list
    setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, lastMessage: input.trim(), lastTime: "now" } : c));
    setInput("");

    // Persist to Firestore
    try {
      const { sendMessageAction } = await import("./messages.actions");
      await sendMessageAction({ recipientName: activeContact.name, sender: "user", text: msg.text });
    } catch {}

    // Auto reply
    if (activeContact.isGroup || true) {
      setIsTyping(true);
      setTimeout(() => {
        const pool = activeContact.isGroup ? (GROUP_RESPONSES[activeContact.name] || GROUP_RESPONSES.default) : (PEER_RESPONSES[activeContact.name] || PEER_RESPONSES.default);
        const reply = pool[Math.floor(Math.random() * pool.length)];
        const replyMsg: ChatMsg = { id: Date.now().toString() + "r", sender: "character", senderName: activeContact.isGroup ? activeContact.name : activeContact.name, text: reply, timestamp: new Date() };
        setChats(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), replyMsg] }));
        setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, lastMessage: reply, lastTime: "now" } : c));
        setIsTyping(false);
      }, 1200 + Math.random() * 800);
    }
  };

  const acceptRequest = (req: typeof REQUESTS_DEFAULT[0]) => {
    setRequests(prev => prev.filter(r => r.id !== req.id));
    const newContact: Contact = { id: req.id, name: req.name, avatar: req.avatar, online: true, lastMessage: "You are now connected!", lastTime: "now", unread: 1 };
    setContacts(prev => [newContact, ...prev]);
    setChats(prev => ({ ...prev, [req.id]: [{ id: "init", sender: "character", text: `Hey! Great to connect with you on Meetifyy.`, timestamp: new Date() }] }));
  };

  const dismissRequest = (id: string) => setRequests(prev => prev.filter(r => r.id !== id));

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // ── Inbox View ────────────────────────────────────────────────
  const InboxView = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <h1 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Messages</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl transition-all hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <Edit3 size={18} strokeWidth={2.5} />
          </button>
          <button className="p-2 rounded-xl transition-all hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <MoreHorizontal size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-medium focus:outline-none transition-all"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Requests */}
        {requests.length > 0 && !search && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Requests</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7c3aed]/10 text-[#7c3aed]">{requests.length} new</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {requests.map(req => (
                <div key={req.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 relative">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2.5px solid #7c3aed33' }}>
                      <img src={req.avatar} alt={req.name} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => acceptRequest(req)}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center shadow-md">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </button>
                    <button onClick={() => dismissRequest(req.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                      <X size={9} strokeWidth={3} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight max-w-[70px]" style={{ color: "var(--text-secondary)" }}>{req.name}</span>
                  <span className="text-[8.5px] text-center leading-tight" style={{ color: "var(--text-muted)" }}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chats list */}
        <div className="px-4 pt-4">
          {!search && <span className="text-[11px] font-black uppercase tracking-widest block mb-3" style={{ color: "var(--text-muted)" }}>Chats</span>}
          <div className="space-y-1">
            {filteredContacts.map(contact => (
              <button key={contact.id} onClick={() => setActiveContact(contact)}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-left transition-all hover:opacity-80 active:scale-[0.98]"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '2px solid #e8e4ff' }}>
                    <img src={contact.avatar || getGroupAvatar(contact.name, contact.category)} alt={contact.name} className="w-full h-full object-cover" />
                  </div>
                  {contact.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{contact.name}</span>
                    <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{contact.lastTime}</span>
                  </div>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{contact.lastMessage}</p>
                </div>
                {(contact.unread ?? 0) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                    {contact.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Chat View ─────────────────────────────────────────────────
  const activeMessages = activeContact ? (chats[activeContact.id] || []) : [];

  const ChatView = activeContact && (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <button onClick={() => setActiveContact(null)} className="p-1.5 rounded-xl transition-all hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #e8e4ff' }}>
          <img src={activeContact.avatar || getGroupAvatar(activeContact.name, activeContact.category)} alt={activeContact.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{activeContact.name}</span>
            {activeContact.isGroup && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#7c3aed]/10 text-[#7c3aed]">Group</span>
            )}
          </div>
          <span className="text-[11px]" style={{ color: activeContact.online ? "#10b981" : "var(--text-muted)" }}>
            {activeContact.online ? "Online" : "Offline"}
          </span>
        </div>
        <button className="p-1.5" style={{ color: "var(--text-muted)" }}><MoreHorizontal size={18} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        {activeMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-60">
            <MessageSquare size={32} style={{ color: "var(--text-muted)" }} />
            <p className="text-xs mt-3 font-medium" style={{ color: "var(--text-muted)" }}>No messages yet. Say hi!</p>
          </div>
        )}
        {activeMessages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "character" && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid #e8e4ff' }}>
                <img src={activeContact.avatar || getGroupAvatar(activeContact.name, activeContact.category)} alt={activeContact.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.sender === "user" ? "bg-[#7c3aed] text-white rounded-br-md" : "rounded-bl-md"}`}
              style={msg.sender !== "user" ? { background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" } : {}}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <img src={activeContact.avatar || getGroupAvatar(activeContact.name, activeContact.category)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md flex gap-1" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={`Message ${activeContact.name}...`}
            className="flex-1 rounded-2xl px-4 py-3 text-[13px] focus:outline-none transition-all"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
          <button onClick={sendMessage} disabled={!input.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
            style={{ background: "#7c3aed" }}>
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 130px)", maxWidth: 540, margin: "0 auto" }}>
      <AnimatePresence mode="wait">
        {activeContact ? (
          <motion.div key="chat" className="flex flex-col h-full" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.18 }}>
            {ChatView}
          </motion.div>
        ) : (
          <motion.div key="inbox" className="flex flex-col h-full" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.18 }}>
            {InboxView}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
