"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageDock, Character } from "@/components/ui/message-dock";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Loader2, X, Search, Check, UserPlus, Users } from "lucide-react";
import { db, auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from "firebase/firestore";

import { mockDb } from "@/lib/mockDatabase";

interface ChatMessage {
  id: string;
  sender: "user" | "character";
  senderName?: string;
  senderAvatar?: string;
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

const DEFAULT_GROUPS = [
  { name: 'Google Developer Student Club', category: 'Tech', isPaid: false, price: 0, desc: 'Official updates on campus hackathons, coding tasks & bootcamps.', logo: 'GD', members: 180, isOfficial: true, creatorId: 'system' },
  { name: 'Figma UI/UX Masterclass VIP', category: 'Design', isPaid: true, price: 50, desc: 'Premium design templates, personal project reviews & job opportunities.', logo: 'FM', members: 42, isOfficial: false, creatorId: 'system' },
  { name: 'Campus Symphony Chat', category: 'Music', isPaid: false, price: 0, desc: 'Open mic coordination, jamming sessions & campus playlist sharing.', logo: 'CS', members: 96, isOfficial: true, creatorId: 'system' },
  { name: 'Placement Prep & Referrals', category: 'Career', isPaid: true, price: 120, desc: 'Placement test leaks, interview preparation sheets & direct referrals.', logo: 'PP', members: 115, isOfficial: true, creatorId: 'system' },
  { name: 'Gladiators FC (Sports)', category: 'Athletics', isPaid: false, price: 0, desc: 'Match schedule updates, football practice slots & gym meets.', logo: 'GF', members: 140, isOfficial: false, creatorId: 'system' }
];

const GROUP_RESPONSES: Record<string, string[]> = {
  'Tech': [
    "That's interesting, did anyone try the new Next.js Turbopack build?",
    "Yeah, compiling is way faster now.",
    "Are we meeting in the library today for the coding session?",
    "I'm working on the frontend bugs, let know if anyone wants to help."
  ],
  'Design': [
    "Let's vote on the dark mode colors.",
    "I think a slightly lighter border looks cleaner.",
    "Just posted the new Figma link in the drive.",
    "We should definitely add some micro-animations here."
  ],
  'Music': [
    "Who's bringing the acoustic guitar for Friday's jam?",
    "I can bring my keyboard!",
    "What songs are we practicing this week?",
    "Let's cover some classic rock tracks."
  ],
  'Career': [
    "Does anyone have the placement syllabus sheet?",
    "Yes, I will share the PDF in a bit.",
    "The mock interviews start at 10 AM tomorrow.",
    "Good luck to everyone preparing for the coding rounds!"
  ],
  'Athletics': [
    "Football practice is scheduled for 5 PM at the main ground.",
    "Count me in!",
    "Are we playing against the senior team this weekend?",
    "Make sure to bring extra water bottles."
  ],
  'default': [
    "Hey guys! Glad to join this group.",
    "What are the updates for today?",
    "Let's connect soon to plan the next meetup.",
    "Super excited for this circle!"
  ]
};

import { getCartoonAvatar, getUserAvatarUrl } from '@/utils/avatar';

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Tech': return '%233b82f6'; // Blue
    case 'Design': return '%23ec4899'; // Pink
    case 'Music': return '%23f43f5e'; // Rose
    case 'Career': return '%2310b981'; // Emerald
    case 'Athletics': return '%23f97316'; // Orange
    default: return '%238b5cf6'; // Violet
  }
};

const getCategoryGradient = (category: string) => {
  switch (category) {
    case 'Tech':
      return 'from-blue-500 to-indigo-600';
    case 'Design':
      return 'from-pink-500 to-rose-500';
    case 'Music':
      return 'from-rose-500 to-amber-500';
    case 'Career':
      return 'from-emerald-500 to-teal-600';
    case 'Athletics':
      return 'from-orange-500 to-red-600';
    default:
      return 'from-purple-500 to-indigo-600';
  }
};

const getCharacterAvatar = (character: Character) => {
  if (character.avatar) return character.avatar;
  const cleanName = character.name.replace(/\s*\(.*\)/, '').trim();
  return getCartoonAvatar(cleanName);
};

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialUser = searchParams.get('user');
  const initialGroup = searchParams.get('group');

  const [allClassmates, setAllClassmates] = useState<any[]>(FALLBACK_CLASSMATES);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  
  const [showDirectory, setShowDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [directoryTab, setDirectoryTab] = useState<'classmates' | 'groups'>('classmates');
  const [groups, setGroups] = useState<any[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [sparksBalance, setSparksBalance] = useState(0);

  // Group creation state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Tech');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAccess, setNewGroupAccess] = useState<'Free' | 'Paid'>('Free');
  const [newGroupSparks, setNewGroupSparks] = useState('50');

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

  const getGroupLastMessage = (group: any) => {
    const history = chats[group.name];
    if (history && history.length > 0) {
      const last = history[history.length - 1];
      const name = last.senderName || (last.sender === 'user' ? 'You' : 'Host');
      return `${name}: ${last.text}`;
    }
    switch (group.category) {
      case 'Tech': return 'Aarav: Let\'s submit the project guys! 🚀';
      case 'Design': return 'Neha: 📷 Shared UI mockups file';
      case 'Music': return 'Priya: Jamming session today at 6 PM! 🎸';
      case 'Career': return 'Neha: Referral link updated in docs';
      case 'Athletics': return 'Gladiator FC won the tournament! 🏆';
      default: return group.desc;
    }
  };

  const getGroupTimestamp = (group: any) => {
    switch (group.category) {
      case 'Tech': return 'Tuesday';
      case 'Design': return 'Sunday';
      case 'Music': return 'Wednesday';
      case 'Career': return '03/07/2026';
      case 'Athletics': return '27/04/2026';
      default: return 'Today';
    }
  };

  // Auth observer
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fullUser = mockDb.getUser(user.uid);
        setCurrentUser({
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User",
          isHost: fullUser?.isHost || false
        });
      } else {
        // Fallback user if not logged in
        setCurrentUser({
          id: "local-user",
          email: "user@example.com",
          name: "Chirag",
          isHost: true
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Load groups, balance, and joined groups on mount/user change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('meetify_campus_groups');
      let currentGroups = DEFAULT_GROUPS;
      if (stored) {
        try {
          currentGroups = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem('meetify_campus_groups', JSON.stringify(DEFAULT_GROUPS));
      }
      setGroups(currentGroups);

      if (currentUser) {
        const w = mockDb.getWallet(currentUser.id);
        if (w) {
          setSparksBalance((w.purchased || 0) + (w.bonus || 0) + (w.creator || 0));
        }

        const storedJoined = localStorage.getItem(`joined_groups_${currentUser.id}`);
        if (storedJoined) {
          try {
            setJoinedGroups(JSON.parse(storedJoined));
          } catch (e) {
            console.error(e);
          }
        } else {
          // Join default free groups by default
          const initialJoined: Record<string, boolean> = {};
          currentGroups.forEach(g => {
            if (!g.isPaid) initialJoined[g.name] = true;
          });
          setJoinedGroups(initialJoined);
          localStorage.setItem(`joined_groups_${currentUser.id}`, JSON.stringify(initialJoined));
        }
      }
    }
  }, [currentUser]);

  const saveJoinedGroups = (nextJoined: Record<string, boolean>) => {
    setJoinedGroups(nextJoined);
    if (currentUser && typeof window !== 'undefined') {
      localStorage.setItem(`joined_groups_${currentUser.id}`, JSON.stringify(nextJoined));
    }
  };

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
        const firstId = groupedChats[msg.recipientName][0]?.id;
        if (groupedChats[msg.recipientName].length === 1 && (
          firstId?.startsWith("init-") ||
          firstId === "a-1" ||
          firstId === "n-1" ||
          firstId === "p-1" ||
          firstId === "ai-1"
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
      !m.id?.startsWith("init-") && 
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

  // If activeChar is a temp classmate (not in allClassmates and not a group), make sure it's included in the array
  if (activeChar && !activeChar.isGroup && !talkedClassmates.some(c => c.name === activeChar.name)) {
    talkedClassmates.push(activeChar);
  }

  // To prevent the dock from overflowing, limit the number of classmates shown to 5 max
  let recentClassmates = [...talkedClassmates];
  if (recentClassmates.length > 4) {
    if (activeChar) {
      // Remove the active character from the list, get the last 4, then append active character at the end
      const others = recentClassmates.filter(c => c.name !== activeChar.name);
      recentClassmates = [...others.slice(-4), activeChar];
    } else {
      recentClassmates = recentClassmates.slice(-5);
    }
  }

  const joinedGroupsCharacters = groups
    .filter(g => joinedGroups[g.name])
    .map(g => ({
      id: 'group-' + g.name,
      name: g.name,
      emoji: "💬",
      online: true,
      isGroup: true,
      category: g.category,
      isOfficial: g.isOfficial,
      price: g.price,
      isPaid: g.isPaid,
      avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${getCategoryColor(g.category)}"/><text x="50" y="60" font-size="32" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">${g.logo}</text></svg>`
    }));

  const characters: Character[] = [
    { emoji: "✨", name: "Sparkle", online: false },
    ...recentClassmates,
    ...joinedGroupsCharacters,
    CAMPUS_GUIDE_AI
  ];

  useEffect(() => {
    async function loadRealUsers() {
      try {
        // 1. Initialize from mockDb first so local/offline users are available immediately
        const localUsers = mockDb.getUsers() || [];
        const localClassmates = localUsers.map((u: any, idx: number) => {
          const name = u.full_name || u.name || u.email?.split("@")[0] || "Student";
          const emoji = EMOJIS[idx % EMOJIS.length];
          const gradient = GRADIENTS[idx % GRADIENTS.length];
          return {
            id: u.id || u.uid,
            emoji,
            name,
            online: true,
            instagram: u.instagram || "",
            email: u.email || "",
            avatar: getUserAvatarUrl(u),
            backgroundColor: gradient.bg,
            gradientColors: gradient.colors,
          };
        });

        let mergedClassmates = [...localClassmates];

        // 2. Fetch and merge Firebase Auth/Firestore users
        try {
          const res = await fetch("/api/users");
          if (res.ok) {
            const data = await res.json();
            if (data.users && data.users.length > 0) {
              data.users.forEach((u: any, idx: number) => {
                const alreadyExists = mergedClassmates.some(c => c.id === u.id || (u.email && c.email === u.email));
                if (!alreadyExists) {
                  const name = u.full_name || u.name || u.email?.split("@")[0] || "Student";
                  const emoji = EMOJIS[(idx + localClassmates.length) % EMOJIS.length];
                  const gradient = GRADIENTS[(idx + localClassmates.length) % GRADIENTS.length];
                  mergedClassmates.push({
                    id: u.id,
                    emoji,
                    name,
                    online: true,
                    instagram: u.instagram || "",
                    email: u.email || "",
                    avatar: getUserAvatarUrl(u),
                    backgroundColor: gradient.bg,
                    gradientColors: gradient.colors,
                  });
                }
              });
            }
          }
        } catch (fetchErr) {
          console.warn("API users fetch failed (relying fully on mockDb):", fetchErr);
        }

        setAllClassmates(mergedClassmates);

        if (initialUser) {
          const target = mergedClassmates.find(c => c.name === initialUser || (c.instagram && c.instagram.toLowerCase() === initialUser.toLowerCase()));
          if (target) {
            setActiveChar(target);
            setConnectedIds(prev => prev.includes(target.id) ? prev : [...prev, target.id]);
          } else {
            // If user is not in the list for some reason, create a temporary character
            const tempChar = {
              id: 'temp-' + Date.now(),
              name: initialUser,
              emoji: "👋",
              online: true,
              backgroundColor: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
              gradientColors: "#064e3b, #047857"
            };
            setActiveChar(tempChar);
          }
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRealUsers();
  }, [initialUser]);

  useEffect(() => {
    if (initialGroup && groups.length > 0) {
      const targetGroup = groups.find(g => g.name === initialGroup);
      if (targetGroup) {
        startChatWithGroup(targetGroup);
      }
    }
  }, [initialGroup, groups]);

  const startChatWithGroup = (group: any) => {
    const charRepresentation: Character = {
      id: 'group-' + group.name,
      name: group.name,
      emoji: "💬",
      online: true,
      isGroup: true,
      category: group.category,
      isOfficial: group.isOfficial,
      price: group.price,
      isPaid: group.isPaid,
      avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234f46e5"/><text x="50" y="55" font-size="32" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">${group.logo}</text></svg>`
    };
    setActiveChar(charRepresentation);
    setShowDirectory(false);
  };

  const getRandomGroupMember = () => {
    const members = [
      { name: "Aarav (CS)", avatar: getCartoonAvatar("Aarav") },
      { name: "Neha (Design)", avatar: getCartoonAvatar("Neha") },
      { name: "Priya (Events)", avatar: getCartoonAvatar("Priya") }
    ];
    return members[Math.floor(Math.random() * members.length)];
  };

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
      const { sendMessageAction } = await import('./messages.actions');
      const res = await sendMessageAction({
        recipientName: character.name,
        sender: 'user',
        text: message
      });
      if (!res.success) throw new Error(res.error);
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

    // Trigger Typing Indicator & Delayed Reply only if it's the Campus Guide AI or a group chat
    if (character.id === 'guide-ai' || character.isGroup) {
      setIsTyping(true);

      if (character.isGroup) {
        setTimeout(async () => {
          const member = getRandomGroupMember();
          const responses = GROUP_RESPONSES[character.category || 'default'] || GROUP_RESPONSES['default'];
          const randomReply = responses[Math.floor(Math.random() * responses.length)];

          const charMsgId = Math.random().toString(36).substring(7);
          const charMsg: ChatMessage = {
            id: charMsgId,
            sender: "character",
            senderName: member.name,
            senderAvatar: member.avatar,
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
            senderName: member.name,
            senderAvatar: member.avatar,
            text: randomReply,
            timestamp: new Date().toISOString()
          };

          try {
            const { sendMessageAction } = await import('./messages.actions');
            await sendMessageAction({
              recipientName: character.name,
              sender: 'character',
              text: randomReply
            });
          } catch (e) {
            console.warn("Firestore save failed for group reply:", e);
          }

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
      } else {
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
            const { sendMessageAction } = await import('./messages.actions');
            const res = await sendMessageAction({
              recipientName: character.name,
              sender: 'character',
              text: randomReply
            });
            if (!res.success) throw new Error(res.error);
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
      }
    }
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

  const handleJoinGroup = (group: any) => {
    if (!currentUser) {
      alert("Please log in to join campus groups!");
      return;
    }
    if (joinedGroups[group.name]) {
      // If already joined, just select this group for chat!
      startChatWithGroup(group);
      return;
    }

    if (group.isPaid) {
      if (sparksBalance < group.price) {
        alert(`Insufficient Sparks! You need ${group.price} Sparks to join this group. Current balance: ${sparksBalance} Sparks.`);
        return;
      }
      const confirmJoin = window.confirm(`Do you want to subscribe to ${group.name} for ${group.price} Sparks?`);
      if (confirmJoin) {
        setSparksBalance(prev => {
          const nextBal = prev - group.price;
          const w = mockDb.getWallet(currentUser.id);
          if (w) {
            w.purchased = Math.max(0, (w.purchased || 0) - group.price);
            mockDb.saveWallet(currentUser.id, w);
          }
          mockDb.addTransaction(currentUser.id, {
            type: 'SPEND',
            amount: group.price,
            description: `Subscribed to ${group.name}`,
            status: 'COMPLETED'
          });
          return nextBal;
        });
        const nextJoined = { ...joinedGroups, [group.name]: true };
        saveJoinedGroups(nextJoined);
        alert(`Successfully joined ${group.name}!`);
        startChatWithGroup(group);
      }
    } else {
      const nextJoined = { ...joinedGroups, [group.name]: true };
      saveJoinedGroups(nextJoined);
      alert(`Joined ${group.name} successfully!`);
      startChatWithGroup(group);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Check limit of 5 groups per user
    const userGroupsCount = groups.filter(g => g.creatorId === currentUser.id).length;
    if (userGroupsCount >= 5) {
      alert("Error: You can create a maximum of 5 groups!");
      return;
    }

    if (!newGroupName.trim() || !newGroupDesc.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Check unique group name
    if (groups.some(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase())) {
      alert("A group with this name already exists!");
      return;
    }

    const priceVal = newGroupAccess === 'Paid' ? Number(newGroupSparks) : 0;
    const initials = newGroupName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'GP';
    
    const isHost = currentUser?.isHost || false;

    const newGroup = {
      name: newGroupName.trim(),
      category: newGroupCategory,
      isPaid: newGroupAccess === 'Paid',
      price: priceVal,
      desc: newGroupDesc.trim(),
      logo: initials,
      members: 1,
      isOfficial: isHost, // Verified if host, not verified if classmate
      creatorId: currentUser.id
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    localStorage.setItem('meetify_campus_groups', JSON.stringify(updatedGroups));

    // Auto-join the creator
    const nextJoined = { ...joinedGroups, [newGroup.name]: true };
    saveJoinedGroups(nextJoined);

    // Reset creation fields
    setNewGroupName('');
    setNewGroupDesc('');
    setIsCreatingGroup(false);

    alert(`Group "${newGroup.name}" created successfully! ${isHost ? "Verified status granted." : "Created as standard group."}`);

    // Set active chat to the new group
    startChatWithGroup(newGroup);
  };

  const activeMessages = activeChar ? (chats[activeChar.name] || []) : [];

  const filteredClassmates = allClassmates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.instagram && c.instagram.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col relative animate-fade-in" style={{ height: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4 px-6 min-w-0">
        <div className="min-w-0">
          <div className="text-base sm:text-lg md:text-xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2 min-w-0">
            <MessageSquare className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
            {activeChar ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[var(--border-subtle)] flex-shrink-0 flex items-center justify-center bg-[var(--accent-dim)]">
                  {activeChar.avatar ? (
                    <img src={activeChar.avatar} alt={activeChar.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src={getCharacterAvatar(activeChar)} alt={activeChar.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">{activeChar.name}</span>
                {activeChar.isOfficial && (
                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center shadow">
                    <Check size={8} className="text-white stroke-[3.5]" />
                  </span>
                )}
                {activeChar.isGroup && (
                  <span className="text-[8px] font-black uppercase bg-[var(--accent-dim)] border border-[var(--accent-glow)] text-[var(--accent)] px-1.5 py-0.5 rounded flex-shrink-0">
                    Group
                  </span>
                )}
              </div>
            ) : (
              "Sparks Playground"
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
            {activeChar ? (activeChar.online ? "Online & ready to chat" : "Offline") : "Select an AI Host or classmate to start messaging"}
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scroll" style={{ paddingBottom: "100px" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50dvh]">
            <Loader2 className="w-6 h-6 text-[var(--text-secondary)] animate-spin" />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Loading classmate directories...</p>
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
                {activeMessages.map((msg, idx) => (
                  <div
                    key={`${msg.id}-${idx}`}
                    className={`flex items-end gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "character" && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border-subtle)] flex-shrink-0 flex items-center justify-center bg-white/5">
                        <img 
                          src={activeChar.isGroup ? (msg.senderAvatar || getCharacterAvatar(activeChar)) : getCharacterAvatar(activeChar)} 
                          alt={msg.senderName || activeChar.name} 
                          className="w-full h-full" 
                        />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[75%]">
                      {msg.sender === "character" && activeChar.isGroup && msg.senderName && (
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] mb-0.5 ml-1">
                          {msg.senderName}
                        </span>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                          msg.sender === "user"
                            ? "bg-[var(--accent)] text-white rounded-br-none font-semibold"
                            : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-base)] border-l border-[var(--border-subtle)] shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--text-secondary)]" />
                  <h2 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">Campus Directory</h2>
                </div>
                <button
                  onClick={() => setShowDirectory(false)}
                  className="p-1.5 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-overlay)] p-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setDirectoryTab('classmates'); setIsCreatingGroup(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    directoryTab === 'classmates'
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  Classmates
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryTab('groups')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    directoryTab === 'groups'
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  Groups & Channels
                </button>
              </div>

              {/* Search Bar */}
              {!isCreatingGroup && (
                <div className="p-4 border-b border-[var(--border-subtle)] relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-7 top-7" />
                  <input
                    type="text"
                    placeholder={directoryTab === 'classmates' ? "Search classmates by name..." : "Search channels & categories..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-neutral-500 focus:outline-none focus:border-[var(--border-strong)] transition-all font-medium shadow-sm"
                  />
                </div>
              )}

              {directoryTab === 'classmates' ? (
                <>
                  {/* Classmate List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scroll">
                    {filteredClassmates.length > 0 ? (
                      filteredClassmates.map((classmate) => {
                         return (
                          <div
                            key={classmate.id}
                            onClick={() => startChatWithClassmate(classmate)}
                            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-mid)] cursor-pointer hover:bg-[var(--bg-hover)] shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border-subtle)] flex items-center justify-center bg-white/5">
                                <img src={getCharacterAvatar(classmate)} alt={classmate.name} className="w-full h-full" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[var(--text-primary)] tracking-tight">{classmate.name}</h4>
                                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Online Classmate</p>
                              </div>
                            </div>

                            {/* Direct Message Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startChatWithClassmate(classmate);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] border border-transparent transition-all shadow-sm"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message</span>
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
                </>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {isCreatingGroup ? (
                    /* Group Creation Form */
                    <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-5 space-y-4 no-scroll">
                      <div>
                        <h3 className="text-sm font-black text-white tracking-tight">Create Campus Channel</h3>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          Limit: {groups.filter(g => g.creatorId === currentUser?.id).length}/5 groups created
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Group Name</label>
                        <input
                          type="text"
                          required
                          maxLength={30}
                          placeholder="e.g. AI Hackers Circle"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-neutral-600 focus:outline-none focus:border-[var(--accent)] font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Category</label>
                        <select
                          value={newGroupCategory}
                          onChange={(e) => setNewGroupCategory(e.target.value)}
                          className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-medium"
                        >
                          <option value="Tech">Tech & Coding</option>
                          <option value="Design">Design & UI/UX</option>
                          <option value="Music">Music & jamming</option>
                          <option value="Career">Career & Placement</option>
                          <option value="Athletics">Athletics & Sports</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
                        <textarea
                          required
                          maxLength={120}
                          rows={3}
                          placeholder="Briefly describe what this channel is about..."
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-neutral-600 focus:outline-none focus:border-[var(--accent)] font-medium resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Access Type</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setNewGroupAccess('Free')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                              newGroupAccess === 'Free'
                                ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)] font-extrabold"
                                : "bg-[var(--bg-overlay)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-mid)]"
                            }`}
                          >
                            Free Group
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewGroupAccess('Paid')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                              newGroupAccess === 'Paid'
                                ? "bg-amber-500/10 border-amber-500 text-amber-400 font-extrabold"
                                : "bg-[var(--bg-overlay)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-mid)]"
                            }`}
                          >
                            ⚡ Paid Group
                          </button>
                        </div>
                      </div>

                      {newGroupAccess === 'Paid' && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Sparks Required to Join</label>
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            placeholder="e.g. 50"
                            value={newGroupSparks}
                            onChange={(e) => setNewGroupSparks(e.target.value)}
                            className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 font-bold text-amber-400"
                          />
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border-subtle)] space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[var(--text-secondary)] font-medium">Your Sparks Balance:</span>
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">⚡ {sparksBalance} Sparks</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[var(--text-secondary)] font-medium">Verification Status:</span>
                          {currentUser?.isHost ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">Verified Host ✅</span>
                          ) : (
                            <span className="text-neutral-400 font-medium">Standard Group</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingGroup(false)}
                          className="flex-1 py-2.5 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black shadow-lg transition-all"
                        >
                          Create Group
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Groups list */
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 no-scroll flex flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          const count = groups.filter(g => g.creatorId === currentUser?.id).length;
                          if (count >= 5) {
                            alert("Limit reached: You can create a maximum of 5 groups!");
                          } else {
                            setIsCreatingGroup(true);
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition-all"
                      >
                        <span>+ Create New Group</span>
                      </button>

                      <div className="space-y-2 flex-grow overflow-y-auto no-scroll">
                        {filteredGroups.length > 0 ? (
                          filteredGroups.map((group) => {
                            const isJoined = joinedGroups[group.name];
                            return (
                              <div
                                key={group.name}
                                onClick={() => {
                                  if (isJoined) {
                                    startChatWithGroup(group);
                                    setShowDirectory(false);
                                  }
                                }}
                                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-mid)] cursor-pointer hover:bg-[var(--bg-hover)] shadow-sm transition-all gap-3"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getCategoryGradient(group.category)} flex-shrink-0 flex items-center justify-center font-black text-xs text-white shadow-sm`}>
                                    {group.logo}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <h4 className="text-xs font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-1 truncate">
                                        <span className="truncate">{group.name}</span>
                                        {group.isOfficial && (
                                          <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center shadow">
                                            <Check size={8} className="text-white stroke-[3.5]" />
                                          </span>
                                        )}
                                      </h4>
                                      <span className="text-[9px] text-[var(--text-secondary)] font-semibold flex-shrink-0">
                                        {getGroupTimestamp(group)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate font-medium">
                                      {getGroupLastMessage(group)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJoinGroup(group);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                      isJoined
                                        ? "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                                        : group.isPaid
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white dark:hover:text-black"
                                          : "bg-[var(--accent)] text-white border-transparent hover:bg-[var(--accent-hover)]"
                                    }`}
                                  >
                                    {isJoined ? (
                                      "Open"
                                    ) : group.isPaid ? (
                                      `⚡ ${group.price}`
                                    ) : (
                                      "Join"
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-xs text-neutral-500">No channels found matching "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Message Dock */}
      {!loading && !showDirectory && (
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

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen bg-[#090909]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-xs text-neutral-500 mt-4">Loading messages...</p>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
