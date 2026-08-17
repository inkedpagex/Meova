'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, MessageSquare,
  Calendar, CheckCheck, Check, Zap
} from 'lucide-react';
import { db, auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot,
  doc, updateDoc, increment, getDoc
} from 'firebase/firestore';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';

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

function ChatListItem({ chat, currentUid, isActive, onClick }) {
  const otherId = chat.participants?.find(p => p !== currentUid) || '';
  const otherName = chat.participantNames?.[otherId] || 'User';
  const otherPhoto = chat.participantPhotos?.[otherId] || '';
  const unread = chat.unreadCount?.[currentUid] || 0;
  const isMe = chat.lastSenderId === currentUid;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-[var(--bg-hover)] relative ${
        isActive ? 'bg-[var(--bg-hover)] border-r-2 border-[var(--primary)]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl(otherId, otherName, otherPhoto)}
          alt={otherName}
          className="w-11 h-11 rounded-2xl object-cover border border-[var(--border-subtle)]"
        />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] font-black flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm font-bold truncate ${unread > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
            {otherName}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-bold flex-shrink-0 ml-2">
            {timeAgo(chat.lastMessageAt)}
          </span>
        </div>
        <p className={`text-xs truncate ${unread > 0 ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] font-medium'}`}>
          {isMe && <span className="text-[var(--primary)]">You: </span>}
          {chat.lastMessage || 'Start the conversation'}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe, showAvatar, senderPhoto, senderName }) {
  const isSystem = msg.senderId === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full px-4 py-1.5">
          <Zap className="w-3 h-3 text-[var(--primary)]" />
          <span className="text-[11px] font-bold text-[var(--text-muted)]">{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar — only show for others */}
      {!isMe && (
        <div className="w-7 h-7 flex-shrink-0 mb-1">
          {showAvatar ? (
            <img
              src={avatarUrl(msg.senderId, senderName, senderPhoto)}
              alt={senderName}
              className="w-7 h-7 rounded-xl object-cover border border-[var(--border-subtle)]"
            />
          ) : <div className="w-7 h-7" />}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? 'bg-[var(--primary)] text-white rounded-br-md'
              : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-md'
          }`}
        >
          {msg.text}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-[var(--text-muted)]">{formatTime(msg.timestamp)}</span>
          {isMe && (
            <CheckCheck className="w-3 h-3 text-[var(--primary)] opacity-70" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Content (wrapped in Suspense for useSearchParams) ──────────────────

function MessagesContent() {
  const searchParams = useSearchParams();
  const openUserId = searchParams.get('uid'); // /messages?uid=xxx to open specific chat

  const [currentUser, setCurrentUser] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showList, setShowList] = useState(true); // mobile: list vs chat view

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const unsubChatsRef = useRef(null);
  const unsubMsgsRef = useRef(null);

  // ── Auth: get current Firebase user ───────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setCurrentUid(null); setLoadingChats(false); return; }
      setCurrentUid(fbUser.uid);
      // Fetch profile for name/photo
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) setCurrentUser({ uid: fbUser.uid, ...snap.data() });
        else setCurrentUser({ uid: fbUser.uid, full_name: fbUser.displayName || 'You', photo_url: fbUser.photoURL || '' });
      } catch {
        setCurrentUser({ uid: fbUser.uid, full_name: fbUser.displayName || 'You', photo_url: fbUser.photoURL || '' });
      }
    });
    return () => unsub();
  }, []);

  // ── Subscribe to chat list via Firestore real-time ─────────────────────────
  useEffect(() => {
    if (!currentUid || !db) return;

    const q = query(
      collection(db, 'chats'),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    // We need to filter client-side because Firestore requires composite index for array-contains + orderBy
    // Alternative: use simpler query and filter
    const q2 = query(
      collection(db, 'chats'),
      orderBy('lastMessageAt', 'desc')
    );

    if (unsubChatsRef.current) unsubChatsRef.current();
    unsubChatsRef.current = onSnapshot(q2, (snap) => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.participants?.includes(currentUid));
      setChats(all);
      setLoadingChats(false);
    }, (err) => {
      console.error('Chats subscription error:', err.message);
      setLoadingChats(false);
    });

    return () => {
      if (unsubChatsRef.current) unsubChatsRef.current();
    };
  }, [currentUid]);

  // ── Auto-open chat if ?uid= param present ─────────────────────────────────
  useEffect(() => {
    if (!openUserId || !currentUid || chats.length === 0) return;
    const sorted = [currentUid, openUserId].sort();
    const targetChatId = `${sorted[0]}_${sorted[1]}`;
    const existing = chats.find(c => c.id === targetChatId);
    if (existing) {
      openChat(existing);
    } else {
      // Create the chat via API
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: openUserId }),
      }).then(r => r.json()).then(data => {
        if (data.chatId) {
          // Chat created — it will appear in the subscription shortly
        }
      }).catch(console.error);
    }
  }, [openUserId, currentUid, chats]);

  // ── Subscribe to messages for active chat ─────────────────────────────────
  const openChat = useCallback((chat) => {
    setActiveChatId(chat.id);
    setActiveChat(chat);
    setShowList(false);
    setMessages([]);

    if (unsubMsgsRef.current) unsubMsgsRef.current();

    const msgsQ = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    unsubMsgsRef.current = onSnapshot(msgsQ, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, (err) => console.error('Messages subscription error:', err.message));

    // Mark as read
    fetch(`/api/chats/${chat.id}`, { method: 'PATCH' }).catch(() => {});
  }, []);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeChatId || !currentUid || sendingMsg) return;

    setInputText('');
    setSendingMsg(true);
    inputRef.current?.focus();

    try {
      const chatRef = doc(db, 'chats', activeChatId);
      const msgRef = collection(db, 'chats', activeChatId, 'messages');
      const ts = serverTimestamp();

      // Add message
      await addDoc(msgRef, {
        senderId: currentUid,
        text,
        timestamp: ts,
        status: 'sent',
      });

      // Update chat metadata + increment unread for other participant
      const otherId = activeChat?.participants?.find(p => p !== currentUid);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: ts,
        lastSenderId: currentUid,
        ...(otherId ? { [`unreadCount.${otherId}`]: increment(1) } : {}),
        [`unreadCount.${currentUid}`]: 0,
      });
    } catch (err) {
      console.error('Failed to send message:', err.message);
      setInputText(text); // Restore on failure
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

  // ── Derived: other user info for active chat ───────────────────────────────
  const otherId = activeChat?.participants?.find(p => p !== currentUid) || '';
  const otherName = activeChat?.participantNames?.[otherId] || 'User';
  const otherPhoto = activeChat?.participantPhotos?.[otherId] || '';

  // ── Empty state: not logged in ─────────────────────────────────────────────
  if (!loadingChats && !currentUid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <MessageSquare className="w-12 h-12 text-[var(--border-mid)] mb-4" />
        <h2 className="text-lg font-black text-[var(--text-primary)] mb-2">Sign in to Message</h2>
        <p className="text-sm text-[var(--text-muted)]">Log in to access your messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-68px)] md:h-[calc(100dvh-32px)] overflow-hidden -mx-4 md:mx-0 -mb-safe">

      {/* ── LEFT: Chat List ──────────────────────────────────────────────────── */}
      <div className={`
        flex flex-col w-full md:w-[300px] md:flex-shrink-0
        border-r border-[var(--border-subtle)] bg-[var(--bg-base)]
        ${!showList ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--border-subtle)]">
          <h1 className="text-base font-black text-[var(--text-primary)]">Messages</h1>
          <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5">
            Chat with your meeting partners
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <p className="text-sm font-black text-[var(--text-primary)] mb-1">No chats yet</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Chats open automatically when a booking is accepted. Book an experience to get started!
              </p>
            </div>
          ) : (
            <div>
              {chats.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  currentUid={currentUid}
                  isActive={chat.id === activeChatId}
                  onClick={() => openChat(chat)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat Window ───────────────────────────────────────────────── */}
      <div className={`
        flex flex-col flex-1 min-w-0 bg-[var(--bg-base)]
        ${showList && !activeChatId ? 'hidden md:flex' : 'flex'}
      `}>
        {!activeChatId ? (
          // No chat selected — desktop empty state
          <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-purple-400 flex items-center justify-center mb-6 shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-black text-[var(--text-primary)] mb-2">Select a conversation</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
              Choose from your chats on the left, or book an experience to start a new conversation.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              {/* Back button — mobile only */}
              <button
                onClick={() => { setShowList(true); setActiveChatId(null); setActiveChat(null); }}
                className="md:hidden p-1.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>

              <img
                src={avatarUrl(otherId, otherName, otherPhoto)}
                alt={otherName}
                className="w-9 h-9 rounded-xl object-cover border border-[var(--border-subtle)] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[var(--text-primary)] truncate">{otherName}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-semibold">Meeting partner</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="text-3xl mb-3">👋</div>
                  <p className="text-sm font-black text-[var(--text-primary)] mb-1">Say hi to {otherName}!</p>
                  <p className="text-xs text-[var(--text-muted)]">This is the start of your conversation</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUid;
                  const prevMsg = messages[idx - 1];
                  // Show avatar only when sender changes
                  const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={isMe}
                      showAvatar={showAvatar}
                      senderPhoto={otherPhoto}
                      senderName={otherName}
                    />
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${otherName}...`}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors max-h-32 overflow-y-auto"
                  style={{ lineHeight: '1.5' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sendingMsg}
                  className="p-2.5 rounded-2xl bg-[var(--primary)] text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
                >
                  {sendingMsg
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] text-center mt-2 font-semibold">
                Press Enter to send · Be respectful
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
