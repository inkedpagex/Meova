"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageDock, Character } from "@/components/ui/message-dock";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Loader2, X, Search, Check, UserPlus, Users } from "lucide-react";
import { db, auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from "firebase/firestore";

interface ChatMessage {
  id: string;
  sender: "user" | "character";
  text: string;
  timestamp: Date;
}

// Predefined styles for characters
const EMOJIS = ["🧑‍💻", "🚀", "🎨", "📅", "🌟", "👾", "✨", "🦊", "🦁", "🐼"];
const GRADIENTS = [
  { bg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400", colors: "#064e3b, #047857" },
  { bg: "bg-purple-500/10 border border-purple-500/20 text-purple-400", colors: "#581c87, #7c3aed" },
  { bg: "bg-amber-500/10 border border-amber-500/20 text-amber-400", colors: "#78350f, #d97706" },
  { bg: "bg-rose-500/10 border border-rose-500/20 text-rose-400", colors: "#881337, #e11d48" },
  { bg: "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400", colors: "#083344, #0891b2" },
];

const FALLBACK_CLASSMATES = [
  {
    id: "aarav",
    emoji: "🧑‍💻",
    name: "Aarav (CS)",
    online: true,
    backgroundColor: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    gradientColors: "#064e3b, #047857",
  },
  {
    id: "neha",
    emoji: "🎨",
    name: "Neha (Design)",
    online: true,
    backgroundColor: "bg-purple-500/10 border border-purple-500/20 text-purple-400",
    gradientColors: "#581c87, #7c3aed",
  },
  {
    id: "priya",
    emoji: "📅",
    name: "Priya (Events)",
    online: true,
    backgroundColor: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
    gradientColors: "#78350f, #d97706",
  },
];

const CAMPUS_GUIDE_AI = {
  id: "guide-ai",
  emoji: "🤖",
  name: "Campus Guide AI",
  online: true,
  backgroundColor: "bg-rose-500/10 border border-rose-500/20 text-rose-400",
  gradientColors: "#881337, #e11d48",
};

const PEER_RESPONSES: Record<string, string[]> = {
  "Aarav (CS)": [
    "Hey! Working on a new React app for the campus hackathon. Are you participating? 🚀",
    "Just finished debugging a nasty database leak. Always check your connections!",
    "That sounds solid. Let me know if you want to team up for the project.",
    "Hey! Have you checked out the coding circle on Meetuply yet?"
  ],
  "Neha (Design)": [
    "Hey! Just finished the interactive UI designs for the student club showcase. What do you think? 🎨",
    "Design system is finally updated. Glassmorphism is definitely the way to go!",
    "Fascinating feedback! I will adjust the layout border radius accordingly.",
    "Hey! We should brainstorm some premium styling ideas for the homepage."
  ],
  "Priya (Events)": [
    "Hi! We have a game night and project showcase event coming up this Friday. Will you join? 📅",
    "Organizing events is super fun! Let me know if you'd like to co-host a meetup.",
    "Make sure to RSVP on the Events tab so we can reserve enough snacks!",
    "Hey! The campus meetup list is looking packed this semester."
  ],
  "Campus Guide AI": [
    "Beep boop! 🤖 Ask me anything about Meetuply. Did you know you can earn Sparks by hosting events?",
    "Need help with your wallet? You can buy Sparks using our secure QR slide page!",
    "To join circles, navigate to the Circles tab and click Join on your favorite student community.",
    "Sparks are the virtual campus currency of Meetuply. Use them to RSVP or reward creators!"
  ]
};

const DEFAULT_REAL_RESPONSES = [
  "Hey classmate! Nice to connect here on Meetuply. 👋",
  "Hey! What classes or projects are you working on today?",
  "What's up! Are you heading to the next campus meetup?",
  "Awesome! Let's team up for some event soon."
];

const getCharacterAvatar = (character: Character) => {
  if (character.avatar) return character.avatar;
  if (character.name === "Campus Guide AI") {
    return "https://api.dicebear.com/8.x/bottts/svg?seed=campus-bot";
  }
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(character.name)}`;
};

export default function MessagesPage() {
  const [allClassmates, setAllClassmates] = useState<any[]>(FALLBACK_CLASSMATES);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  
  const [showDirectory, setShowDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({
    "Aarav (CS)": [
      { id: "a-1", sender: "character", text: "Hey! Aarav here. Let me know if you want to discuss tech, coding, or projects! 🚀", timestamp: new Date() }
    ],
    "Neha (Design)": [
      { id: "n-1", sender: "character", text: "Hi! Neha here. Super excited to talk about design, UX, and product design. 🎨", timestamp: new Date() }
    ],
    "Priya (Events)": [
      { id: "p-1", sender: "character", text: "Hello! Priya here. Looking to attend or host events? I can help! 📅", timestamp: new Date() }
    ],
    "Campus Guide AI": [
      { id: "ai-1", sender: "character", text: "Greetings! I am your Meetuply Campus Guide AI. Ask me about Sparks, Wallet, or Circles! 🤖", timestamp: new Date() }
    ]
  });
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth observer
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User"
        });
      } else {
        // Fallback user if not logged in
        setCurrentUser({
          id: "local-user",
          email: "user@example.com",
          name: "Chirag"
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch / Sync chats from Firestore / localStorage & Delete > 24 hours messages
  useEffect(() => {
    if (!currentUser) return;

    async function syncChats() {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let loadedMessages: any[] = [];

      try {
        if (db) {
          const chatsRef = collection(db, "chats");
          const q = query(chatsRef, where("senderId", "==", currentUser.id));
          const snap = await getDocs(q);

          loadedMessages = snap.docs.map(doc => {
            const data = doc.data();
            let ts = new Date();
            if (data.timestamp) {
              ts = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
            }
            return {
              id: doc.id,
              sender: data.sender,
              text: data.text,
              recipientName: data.recipientName,
              timestamp: ts
            };
          });

          // Background deletion of expired Firestore messages
          const oldDocs = snap.docs.filter(doc => {
            const data = doc.data();
            let ts = new Date();
            if (data.timestamp) {
              ts = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
            }
            return ts < yesterday;
          });

          if (oldDocs.length > 0) {
            const batch = writeBatch(db);
            oldDocs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            console.log(`Pruned ${oldDocs.length} expired chats from Firestore.`);
          }
        }
      } catch (err: any) {
        console.warn("Firestore message fetch/cleanup failed (likely quota limit). Loading from localStorage instead:", err.message);
        
        // LocalStorage fallback
        try {
          const key = `meetify_chats_${currentUser.id}`;
          const localData = localStorage.getItem(key);
          if (localData) {
            const parsed = JSON.parse(localData);
            loadedMessages = parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));
          }
        } catch (localErr) {
          console.error("Local storage read failed:", localErr);
        }
      }

      // Filter to keep messages <= 24 hours old
      const activeMessages = loadedMessages.filter(m => m.timestamp >= yesterday);

      // Save pruned messages back to local storage
      try {
        const key = `meetify_chats_${currentUser.id}`;
        localStorage.setItem(key, JSON.stringify(activeMessages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString()
        }))));
      } catch (err) {
        console.error("Local storage save failed:", err);
      }

      // Group active messages
      const groupedChats: Record<string, ChatMessage[]> = {
        "Aarav (CS)": [
          { id: "a-1", sender: "character", text: "Hey! Aarav here. Let me know if you want to discuss tech, coding, or projects! 🚀", timestamp: new Date() }
        ],
        "Neha (Design)": [
          { id: "n-1", sender: "character", text: "Hi! Neha here. Super excited to talk about design, UX, and product design. 🎨", timestamp: new Date() }
        ],
        "Priya (Events)": [
          { id: "p-1", sender: "character", text: "Hello! Priya here. Looking to attend or host events? I can help! 📅", timestamp: new Date() }
        ],
        "Campus Guide AI": [
          { id: "ai-1", sender: "character", text: "Greetings! I am your Meetuply Campus Guide AI. Ask me about Sparks, Wallet, or Circles! 🤖", timestamp: new Date() }
        ]
      };

      activeMessages.forEach(msg => {
        if (!groupedChats[msg.recipientName]) {
          groupedChats[msg.recipientName] = [];
        }
        // Remove default greeting when real message starts
        if (groupedChats[msg.recipientName].length === 1 && (
          groupedChats[msg.recipientName][0].id.startsWith("init-") || 
          groupedChats[msg.recipientName][0].id === "a-1" ||
          groupedChats[msg.recipientName][0].id === "n-1" ||
          groupedChats[msg.recipientName][0].id === "p-1" ||
          groupedChats[msg.recipientName][0].id === "ai-1"
        )) {
          groupedChats[msg.recipientName] = [];
        }
        groupedChats[msg.recipientName].push({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp
        });
      });

      // Sort chronological
      Object.keys(groupedChats).forEach(name => {
        groupedChats[name].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });

      setChats(groupedChats);
    }

    syncChats();
  }, [currentUser]);

  // Derived list of classmates that we have chatted with recently, or manually connected, or active
  const talkedClassmateNames = Object.keys(chats).filter(name => {
    const msgs = chats[name] || [];
    const hasRealMessages = msgs.some(m => 
      !m.id.startsWith("init-") && 
      m.id !== "a-1" && 
      m.id !== "n-1" && 
      m.id !== "p-1" && 
      m.id !== "ai-1"
    );
    return hasRealMessages;
  });

  const talkedClassmates = allClassmates.filter(c => 
    connectedIds.includes(c.id) ||
    talkedClassmateNames.includes(c.name) || 
    (activeChar && activeChar.name === c.name)
  );

  const characters: Character[] = [
    { emoji: "✨", name: "Sparkle", online: false },
    ...talkedClassmates,
    CAMPUS_GUIDE_AI
  ];

  useEffect(() => {
    async function loadRealUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (data.users && data.users.length > 0) {
            const userClassmates = data.users.map((u: any, idx: number) => {
              const name = u.name || u.email.split("@")[0];
              const emoji = EMOJIS[idx % EMOJIS.length];
              const gradient = GRADIENTS[idx % GRADIENTS.length];
              return {
                id: u.id,
                emoji,
                name,
                online: true,
                backgroundColor: gradient.bg,
                gradientColors: gradient.colors,
              };
            });

            setAllClassmates(userClassmates);
          }
        }
      } catch (err) {
        console.error("Failed to load real users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRealUsers();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChar, isTyping]);

  const handleMessageSend = async (message: string, character: Character) => {
    if (!message.trim()) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: message,
      timestamp: new Date()
    };

    setChats(prev => ({
      ...prev,
      [character.name]: [...(prev[character.name] || []), userMsg]
    }));
    setActiveChar(character);

    const userId = currentUser?.id || "local-user";
    const userMsgDoc = {
      senderId: userId,
      recipientName: character.name,
      sender: "user" as const,
      text: message,
      timestamp: new Date().toISOString()
    };

    // Save user message to Firestore
    try {
      if (db) {
        await addDoc(collection(db, "chats"), {
          ...userMsgDoc,
          timestamp: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.warn("Saving message to Firestore failed:", err.message);
    }

    // Save user message to localStorage
    try {
      const key = `meetify_chats_${userId}`;
      const existing = localStorage.getItem(key);
      const list = existing ? JSON.parse(existing) : [];
      list.push(userMsgDoc);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      console.error("Local storage save failed:", err);
    }

    // Trigger Typing Indicator
    setIsTyping(true);

    // Delayed Character Reply
    setTimeout(async () => {
      const responses = PEER_RESPONSES[character.name] || DEFAULT_REAL_RESPONSES;
      const randomReply = responses[Math.floor(Math.random() * responses.length)];

      const charMsgId = Math.random().toString(36).substring(7);
      const charMsg: ChatMessage = {
        id: charMsgId,
        sender: "character",
        text: randomReply,
        timestamp: new Date()
      };

      setChats(prev => ({
        ...prev,
        [character.name]: [...(prev[character.name] || []), charMsg]
      }));
      setIsTyping(false);

      const charMsgDoc = {
        senderId: userId,
        recipientName: character.name,
        sender: "character" as const,
        text: randomReply,
        timestamp: new Date().toISOString()
      };

      // Save character reply to Firestore
      try {
        if (db) {
          await addDoc(collection(db, "chats"), {
            ...charMsgDoc,
            timestamp: serverTimestamp()
          });
        }
      } catch (err: any) {
        console.warn("Saving reply to Firestore failed:", err.message);
      }

      // Save character reply to localStorage
      try {
        const key = `meetify_chats_${userId}`;
        const existing = localStorage.getItem(key);
        const list = existing ? JSON.parse(existing) : [];
        list.push(charMsgDoc);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (err) {
        console.error("Local storage save failed:", err);
      }
    }, 1500);
  };

  const handleCharacterSelect = (character: Character | null) => {
    setActiveChar(character);
  };

  const toggleConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectedIds(prev => {
      if (prev.includes(id)) {
        const classmate = allClassmates.find(c => c.id === id);
        if (classmate && activeChar && activeChar.name === classmate.name) {
          setActiveChar(null);
        }
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const startChatWithClassmate = (classmate: any) => {
    if (!connectedIds.includes(classmate.id)) {
      setConnectedIds(prev => [...prev, classmate.id]);
    }
    setActiveChar(classmate);
    setShowDirectory(false);
  };

  const activeMessages = activeChar ? (chats[activeChar.name] || []) : [];

  const filteredClassmates = allClassmates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col relative animate-fade-in" style={{ height: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 px-6">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-neutral-400" />
            {activeChar ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 flex items-center justify-center">
                  <img src={getCharacterAvatar(activeChar)} alt={activeChar.name} className="w-full h-full" />
                </div>
                <span>{activeChar.name}</span>
              </div>
            ) : (
              "Sparks Playground"
            )}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {activeChar ? (activeChar.online ? "Online & ready to chat" : "Offline") : "Select an AI Host or classmate to start messaging"}
          </p>
        </div>

        {/* Directory Toggle Button */}
        <button
          onClick={() => setShowDirectory(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Directory</span>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scroll" style={{ paddingBottom: "100px" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50dvh]">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            <p className="text-xs text-neutral-500 mt-2">Loading classmate directories...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeChar ? (
              <motion.div
                key={activeChar.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-2xl mx-auto"
              >
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "character" && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center">
                        <img src={getCharacterAvatar(activeChar)} alt={activeChar.name} className="w-full h-full" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                        msg.sender === "user"
                          ? "bg-white text-black rounded-br-none font-medium"
                          : "bg-[#141414] text-neutral-200 border border-white/5 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-end gap-2.5 justify-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center">
                      <img src={getCharacterAvatar(activeChar)} alt={activeChar.name} className="w-full h-full" />
                    </div>
                    <div className="bg-[#141414] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center h-[50dvh] max-w-sm mx-auto"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-6">
                  <Sparkles className="w-6 h-6 text-neutral-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Meetuply AI Sparks</h2>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  Click any classmate on the dock below to start messaging, or click the hamburger menu on the right to browse and follow campus peers!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Campus Directory Overlay Drawer */}
      <AnimatePresence>
        {showDirectory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDirectory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#090909] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-neutral-400" />
                  <h2 className="text-base font-extrabold text-white tracking-tight">Campus Directory</h2>
                </div>
                <button
                  onClick={() => setShowDirectory(false)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-white/5 relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-7 top-7" />
                <input
                  type="text"
                  placeholder="Search classmates by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/20 transition-all font-medium"
                />
              </div>

              {/* Classmate List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scroll">
                {filteredClassmates.length > 0 ? (
                  filteredClassmates.map((classmate) => {
                    const isConnected = connectedIds.includes(classmate.id);
                    return (
                      <div
                        key={classmate.id}
                        onClick={() => startChatWithClassmate(classmate)}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                            <img src={getCharacterAvatar(classmate)} alt={classmate.name} className="w-full h-full" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight">{classmate.name}</h4>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Online Classmate</p>
                          </div>
                        </div>

                        {/* Follow / Connect Button */}
                        <button
                          onClick={(e) => toggleConnection(classmate.id, e)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            isConnected
                              ? "bg-white/10 text-neutral-300 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                              : "bg-white text-black hover:bg-neutral-200"
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Connected</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xs text-neutral-500">No classmates found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Message Dock */}
      {!loading && (
        <MessageDock 
          characters={characters}
          activeCharacterName={activeChar?.name}
          onMessageSend={handleMessageSend}
          onCharacterSelect={handleCharacterSelect}
          onMenuClick={() => setShowDirectory(true)}
          placeholder={(name) => `Message ${name}...`}
          theme="dark"
          enableAnimations={true}
          closeOnSend={false}
          autoFocus={true}
        />
      )}
    </div>
  );
}
