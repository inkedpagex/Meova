'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, MessageSquare,
  SquarePen, CheckCheck, Zap, Search,
  User, Sparkles, Compass, Info, Smile
} from 'lucide-react';
import useSWR from 'swr';
import { db, auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot,
  doc, updateDoc, increment, getDoc, where
} from 'firebase/firestore';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import { useUserContext } from '@/components/providers/UserProvider';

const fetcher = (url) => fetch(url).then(res => res.json());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatTime(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function avatarUrl(uid, name, photo) {
  if (photo) return photo;
  return getCartoonAvatar(name || uid || 'user');
}

// ─── Chat List Item ───────────────────────────────────────────────────────────

function ChatListItem({ chat, currentUid, isActive, onClick, directoryUser }) {
  const otherId = chat.participants?.find(p => p !== currentUid) || '';
  const otherName = directoryUser?.full_name || chat.participantNames?.[otherId] || 'Campus Student';
  const otherPhoto = directoryUser?.photo_url || chat.participantPhotos?.[otherId] || '';
  const unread = chat.unreadCount?.[currentUid] || 0;
  const isMe = chat.lastSenderId === currentUid;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-all cursor-pointer ${
        isActive 
          ? 'bg-purple-50/80 font-medium' 
          : 'hover:bg-zinc-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-14 h-14 rounded-full p-[2px] ${unread > 0 ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400' : 'bg-transparent'}`}>
          <img
            src={avatarUrl(otherId, otherName, otherPhoto)}
            alt={otherName}
            className="w-full h-full rounded-full object-cover border border-zinc-200 bg-zinc-100"
          />
        </div>
        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm sm:text-base truncate ${unread > 0 ? 'font-black text-zinc-900' : 'font-extrabold text-zinc-800'}`}>
            {otherName}
          </span>
          <span className="text-xs text-zinc-400 font-bold flex-shrink-0 ml-2">
            {timeAgo(chat.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs sm:text-sm truncate ${unread > 0 ? 'text-zinc-900 font-black' : 'text-zinc-500 font-medium'}`}>
            {isMe && <span className="text-zinc-400 font-semibold">You: </span>}
            {chat.lastMessage || 'Sent a message'}
          </p>
          {unread > 0 && (
            <span className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0 shadow-xs" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Suggested Student Item ──────────────────────────────────────────────────

function SuggestedStudentItem({ student, currentUid, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(student.id)}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200 flex-shrink-0 bg-zinc-100 shadow-xs">
          <img 
            src={avatarUrl(student.id, student.full_name, student.photo_url)} 
            alt={student.full_name} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-black text-zinc-900 truncate group-hover:text-purple-600 transition-colors">
            {student.full_name || 'Student'}
          </p>
          <p className="text-xs font-semibold text-zinc-400 truncate mt-0.5">
            @{student.username || 'gla_student'} · {student.branch || 'Campus'}
          </p>
        </div>
      </div>
      <button 
        type="button"
        className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-black hover:bg-purple-700 active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-xs"
      >
        Chat
      </button>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe, showAvatar, senderPhoto, senderName, senderId }) {
  const isSystem = msg.senderId === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 bg-zinc-100 text-zinc-700 rounded-full px-4 py-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-600 fill-current" />
          <span className="text-[11px] font-bold">{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isMe && (
        <div className="w-7 h-7 flex-shrink-0 mb-1">
          {showAvatar ? (
            <Link href={`/users/${senderId}`}>
              <img
                src={avatarUrl(senderId, senderName, senderPhoto)}
                alt={senderName}
                className="w-7 h-7 rounded-full object-cover border border-zinc-200"
              />
            </Link>
          ) : <div className="w-7 h-7" />}
        </div>
      )}

      <div className={`max-w-[78%] sm:max-w-[68%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isMe
              ? 'bg-purple-600 text-white rounded-br-xs font-medium'
              : 'bg-zinc-100 text-zinc-900 rounded-bl-xs font-medium'
          }`}
        >
          {msg.text}
        </div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[9px] text-zinc-400 font-semibold">{formatTime(msg.timestamp)}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-purple-600 opacity-80" />}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Messages Component ─────────────────────────────────────────────────

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openUserId = searchParams.get('uid');

  const { user: globalUser } = useUserContext();
  const currentUid = globalUser?.id || globalUser?.uid || null;
  const currentUser = globalUser;

  const [firebaseUid, setFirebaseUid] = useState(null);

  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const { data: usersData } = useSWR('/api/users', fetcher);
  const suggestedStudents = usersData?.users || [];

  // API Fallback Data
  const { data: initialChatsData, mutate: mutateChats } = useSWR('/api/chats', fetcher);
  
  // Update state from API immediately if real-time not ready
  useEffect(() => {
    if (initialChatsData?.chats && !firebaseUid) {
      setChats(initialChatsData.chats);
      setLoadingChats(false);
    }
  }, [initialChatsData, firebaseUid]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const unsubChatsRef = useRef(null);
  const unsubMsgsRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ── Fix: keyboard hides messages on mobile ──────────────────────────────────
  // When the virtual keyboard opens, visualViewport shrinks. We set the chat
  // container height explicitly so messages aren't hidden behind the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (chatContainerRef.current) {
        // If the chat container has a top offset (like 58px on mobile), we MUST subtract it from vv.height
        // otherwise the container will extend beyond the visible viewport and hide the input box!
        const topOffset = parseInt(chatContainerRef.current.style.top || '0', 10);
        chatContainerRef.current.style.height = `${vv.height - topOffset}px`;
      }
      // Scroll to bottom so latest messages stay visible above keyboard
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // ── Wait for Firebase Client Auth ──────────────────────────────────────────
  // Firestore rules require request.auth.uid. We MUST wait for Firebase Auth to initialize on the client
  // before sending queries, otherwise we get "Missing or insufficient permissions".
  useEffect(() => {
    let timeoutId;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      clearTimeout(timeoutId);
      if (fbUser) {
        setFirebaseUid(fbUser.uid);
        setLoadingChats(true); // trigger chat subscription
      } else {
        setFirebaseUid(null);
        // Give Firebase Auth up to 8s to restore from IndexedDB before giving up.
        // On slower devices this can take 4-6 seconds.
        timeoutId = setTimeout(() => {
          setLoadingChats(false);
        }, 8000);
      }
    });
    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, []);

  // ── Subscribe to chat list ──────────────────────────────────────────────────
  useEffect(() => {
    // We strictly wait for firebaseUid so Firestore doesn't reject us!
    if (!firebaseUid || !db) return;

    const q2 = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', firebaseUid)
    );

    if (unsubChatsRef.current) unsubChatsRef.current();
    unsubChatsRef.current = onSnapshot(q2, (snap) => {
      const getTime = (ts) => {
        if (!ts) return Date.now();
        if (typeof ts.toMillis === 'function') return ts.toMillis();
        if (ts.seconds) return ts.seconds * 1000;
        if (ts instanceof Date) return ts.getTime();
        if (typeof ts === 'number') return ts;
        return new Date(ts).getTime() || Date.now();
      };

      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => getTime(b.lastMessageAt) - getTime(a.lastMessageAt));

      setChats(all);
      setLoadingChats(false);
    }, (err) => {
      console.error('Chats subscription error:', err.message);
      setLoadingChats(false);
    });

    return () => {
      if (unsubChatsRef.current) unsubChatsRef.current();
    };
  }, [currentUid, firebaseUid]);

  // ── Open Chat ──────────────────────────────────────────────────────────────
  const openChat = useCallback(async (chat) => {
    setActiveChatId(chat.id);
    setActiveChat(chat);
    setShowList(false);
    
    // Clear old messages and unsubscribe immediately
    if (unsubMsgsRef.current) {
      unsubMsgsRef.current();
      unsubMsgsRef.current = null;
    }

    // Load from API first
    fetch(`/api/chats/${chat.id}/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && !unsubMsgsRef.current) { // Only set if real-time hasn't taken over
          setMessages(data.messages);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
        }
      })
      .catch(console.error);

    // Upgrade to real-time if firebase auth is ready
    if (firebaseUid && db) {
      const msgsQ = query(
        collection(db, 'chats', chat.id, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(100)
      );

      unsubMsgsRef.current = onSnapshot(msgsQ, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        // Clear unread count on live message arrival if active
        if (currentUid && db) {
          updateDoc(doc(db, 'chats', chat.id), {
            [`unreadCount.${currentUid}`]: 0,
          }).catch(() => {});
        }
      }, (err) => console.error('Messages subscription error:', err.message));
    }

    // Mark as read via server
    fetch(`/api/chats/${chat.id}`, { method: 'PATCH' }).catch(() => {});
  }, [currentUid, firebaseUid]);

  const openChatWithUser = useCallback((targetUid) => {
    if (!currentUid) return;
    setShowNewMessageModal(false);
    const sorted = [currentUid, targetUid].sort();
    const targetChatId = `${sorted[0]}_${sorted[1]}`;
    const existing = chats.find(c => c.id === targetChatId);

    if (existing) {
      openChat(existing);
    } else {
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: targetUid }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.chatId) {
            router.push(`/messages?uid=${targetUid}`);
          }
        })
        .catch(console.error);
    }
  }, [currentUid, chats, openChat, router]);

  useEffect(() => {
    if (!openUserId || !currentUid || loadingChats) return;
    openChatWithUser(openUserId);
  }, [openUserId, currentUid, loadingChats, openChatWithUser]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeChatId || !currentUid || sendingMsg) return;

    setInputText('');
    setSendingMsg(true);
    inputRef.current?.focus();
    
    // Optimistic UI Update
    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      senderId: currentUid,
      text,
      timestamp: Date.now(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) throw new Error('Failed to send message via API');
      
      // If we don't have real-time active, trigger mutate/fetch to update list
      if (!firebaseUid) {
        mutateChats();
        const msgsRes = await fetch(`/api/chats/${activeChatId}/messages`);
        if (msgsRes.ok) {
          const data = await msgsRes.json();
          if (data.messages) setMessages(data.messages);
        }
      }
      // If real-time is active, the snapshot will update the list and messages automatically!
    } catch (err) {
      console.error('Failed to send message:', err.message);
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Search Filtering
  const q = searchQuery.trim().toLowerCase();

  const filteredChats = chats.filter(c => {
    if (!q) return true;
    const otherId = c.participants?.find(p => p !== currentUid) || '';
    const otherName = (c.participantNames?.[otherId] || '').toLowerCase();
    const lastMsg = (c.lastMessage || '').toLowerCase();
    const student = suggestedStudents.find(s => s.id === otherId);
    const studentName = (student?.full_name || '').toLowerCase();
    const username = (student?.username || '').toLowerCase();

    return (
      otherName.includes(q) ||
      lastMsg.includes(q) ||
      studentName.includes(q) ||
      username.includes(q)
    );
  });

  const filteredSuggested = suggestedStudents.filter(s => {
    if (s.id === currentUid) return false;
    if (!q) return true;
    const nameMatch = (s.full_name || '').toLowerCase().includes(q);
    const userMatch = (s.username || '').toLowerCase().includes(q);
    const branchMatch = (s.branch || '').toLowerCase().includes(q);
    const yearMatch = (s.year || '').toLowerCase().includes(q);
    return nameMatch || userMatch || branchMatch || yearMatch;
  });

  const otherId = activeChat?.participants?.find(p => p !== currentUid) || '';
  const directoryUser = suggestedStudents.find(s => s.id === otherId);
  const otherName = directoryUser?.full_name || activeChat?.participantNames?.[otherId] || 'Campus Student';
  const otherPhoto = directoryUser?.photo_url || activeChat?.participantPhotos?.[otherId] || '';

  // User not logged in
  if (!loadingChats && !currentUid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-zinc-800">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-zinc-900 mb-1">Sign in to Message</h2>
        <p className="text-xs text-zinc-500 max-w-xs mb-6">
          Connect with GLA campus students directly.
        </p>
        <Link href="/" className="px-6 py-2.5 rounded-full bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition-all">
          Go Home
        </Link>
      </div>
    );
  }


  return (
    <div
      ref={chatContainerRef}
      className={`flex w-full bg-white text-zinc-900 overflow-hidden md:border border-zinc-200/80 md:rounded-3xl shadow-xs transition-all duration-300 ${
        !showList
          ? 'fixed inset-x-0 bottom-0 z-[60] flex-row md:relative md:h-[calc(100vh-64px)] md:top-auto md:z-0 md:rounded-3xl rounded-none border-0'
          : 'h-[calc(100dvh-156px)] md:h-[calc(100vh-64px)] rounded-2xl border flex-row relative'
      }`}
      style={!showList ? { top: 58, height: `calc(100dvh - 58px)` } : {}}
    >

      {/* ── LEFT SIDEBAR: Chat List ───────────────────────────────────────────── */}
      <div className={`
        flex flex-col w-full md:w-[340px] lg:w-[380px] md:flex-shrink-0
        border-r border-zinc-200/80 bg-white
        ${!showList ? 'hidden md:flex' : 'flex'}
      `}>
        
        {/* Sidebar Header */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-zinc-100">
          <span className="font-black text-lg text-zinc-900 tracking-tight">
            @{currentUser?.username || currentUser?.full_name?.toLowerCase().replace(/\s+/g, '') || 'messages'}
          </span>
          <button
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-900 transition-colors cursor-pointer"
            title="New Message"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people or chats..."
              className="w-full pl-10 pr-8 py-2 rounded-xl text-xs bg-zinc-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-zinc-100/80 font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>



        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          {loadingChats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <>
              {filteredChats.length > 0 && (
                <div>
                  {q && <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider px-4 py-1">Conversations</p>}
                  <div>
                    {filteredChats.map(chat => (
                      <ChatListItem
                        key={chat.id}
                        chat={chat}
                        currentUid={currentUid}
                        isActive={chat.id === activeChatId}
                        onClick={() => openChat(chat)}
                        directoryUser={suggestedStudents.find(s => s.id === chat.participants?.find(p => p !== currentUid))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(q || chats.length === 0) && filteredSuggested.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 py-1.5 mt-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      {q ? 'Campus Directory' : 'Suggested for you'}
                    </span>
                    {!q && <Link href="/discover" className="text-[11px] font-bold text-purple-600 hover:underline">See all</Link>}
                  </div>
                  <div>
                    {filteredSuggested.slice(0, q ? 12 : 6).map(student => (
                      <SuggestedStudentItem
                        key={student.id}
                        student={student}
                        currentUid={currentUid}
                        onSelect={openChatWithUser}
                      />
                    ))}
                  </div>
                </div>
              )}

              {q && filteredChats.length === 0 && filteredSuggested.length === 0 && (
                <div className="py-12 text-center px-4">
                  <p className="text-xs font-bold text-zinc-800 mb-1">No results for &quot;{searchQuery}&quot;</p>
                  <p className="text-[11px] text-zinc-400 mb-3">Try searching for a student name, username, or branch.</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT MAIN PANEL: Active Conversation ────────────────────────────── */}
      <div className={`
        flex flex-col flex-1 h-full min-h-0 bg-white
        ${showList && !activeChatId ? 'hidden md:flex' : 'flex'}
      `}>
        {!activeChatId ? (
          /* Instagram Direct Empty Screen */
          <div className="flex flex-col items-center justify-center flex-1 h-full text-center p-8">
            <div className="w-24 h-24 rounded-full border-2 border-zinc-900 flex items-center justify-center mb-4">
              <MessageSquare className="w-12 h-12 text-zinc-900 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 mb-1">Your Messages</h2>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed mb-6 font-medium">
              Send private messages and photos to campus friends or coordinate meetups.
            </p>
            <button
              type="button"
              onClick={() => setShowNewMessageModal(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Send Message
            </button>
          </div>
        ) : (
          <>
            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => { setShowList(true); setActiveChatId(null); setActiveChat(null); }}
                  className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-zinc-100 transition-colors text-zinc-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <img
                    src={avatarUrl(otherId, otherName, otherPhoto)}
                    alt={otherName}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-zinc-900 truncate">
                    {otherName}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active on Campus
                  </p>
                </div>
              </div>

              <Link
                href={`/users/${otherId}`}
                className="p-2.5 rounded-full hover:bg-zinc-100 text-zinc-800 transition-colors"
                title="View Profile"
              >
                <Info className="w-5 h-5" />
              </Link>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1 no-scrollbar bg-white">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-20 h-20 rounded-full bg-zinc-100 overflow-hidden mb-3 border border-zinc-200">
                    <img 
                      src={avatarUrl(otherId, otherName, otherPhoto)} 
                      alt={otherName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h3 className="text-base font-black text-zinc-900">{otherName}</h3>
                  <p className="text-xs text-zinc-400 mb-4">GLA Student · Meetify</p>
                  <Link 
                    href={`/users/${otherId}`}
                    className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition-colors"
                  >
                    View profile
                  </Link>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUid;
                  const prevMsg = messages[idx - 1];
                  const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={isMe}
                      showAvatar={showAvatar}
                      senderPhoto={otherPhoto}
                      senderName={otherName}
                      senderId={otherId}
                    />
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar pinned to bottom */}
            <div className="p-3 border-t border-zinc-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full px-4 py-2 focus-within:border-zinc-400 transition-all">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-28 font-medium"
                  style={{ lineHeight: '1.4' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
                  }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sendingMsg}
                  className="text-purple-600 hover:text-purple-700 disabled:opacity-30 font-black text-xs transition-colors flex-shrink-0 cursor-pointer"
                >
                  {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── NEW MESSAGE MODAL ─────────────────────────────────────────────────── */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-100 anim-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="text-base font-black text-zinc-900">New Message</h2>
              <button 
                type="button"
                onClick={() => setShowNewMessageModal(false)}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
              >
                Cancel
              </button>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto no-scrollbar space-y-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2">Select a Campus Student</p>
              {suggestedStudents.map(student => (
                <SuggestedStudentItem
                  key={student.id}
                  student={student}
                  currentUid={currentUid}
                  onSelect={openChatWithUser}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
