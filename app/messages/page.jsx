'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, MessageSquare,
  SquarePen, CheckCheck, Zap, Search,
  User, Sparkles, Compass, Info, Smile, Phone, Video, Radio, X
} from '@/lib/icons';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { getUserAvatarUrl, getCartoonAvatar } from '@/utils/avatar';
import { useUserContext } from '@/components/providers/UserProvider';
import { useVoiceCall } from '@/components/providers/VoiceCallProvider';

const fetcher = (url) => fetch(url).then(res => res.json());

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  if (photo) return getUserAvatarUrl({ photo_url: photo });
  return getCartoonAvatar(name || uid || 'user');
}

// â”€â”€â”€ Chat List Item (Card Type 1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChatListItem({ chat, currentUid, isActive, onClick, directoryUser }) {
  const { isUserOnline } = useUserContext();
  const participants = chat.participants || [];
  const unreadCountObj = chat.unread_count || chat.unreadCount || {};
  const participantNamesObj = chat.participant_names || chat.participantNames || {};
  const participantPhotosObj = chat.participant_photos || chat.participantPhotos || {};

  const otherId = participants.find(p => p !== currentUid) || '';
  const otherName = chat.isGroup
    ? (chat.name || participantNamesObj.group || 'Group Chat')
    : (directoryUser?.full_name || participantNamesObj[otherId] || 'Campus Student');
  const otherPhoto = directoryUser?.photo_url || participantPhotosObj[otherId] || '';
  const unread = unreadCountObj[currentUid] || 0;
  const lastSenderId = chat.last_sender_id || chat.lastSenderId;
  const lastMessage = chat.last_message || chat.lastMessage;
  const lastMessageAt = chat.last_message_at || chat.lastMessageAt;
  const isMe = lastSenderId === currentUid;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all cursor-pointer border-b border-[var(--border-hairline)] ${
        isActive 
          ? 'bg-[var(--accent-tint-10)] text-[var(--accent)] font-bold' 
          : 'hover:bg-[var(--bg-base)] bg-[var(--bg-surface)]'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden p-[1px] ring-1 ring-white/10">
          <img
            src={avatarUrl(otherId, otherName, otherPhoto)}
            alt=""
            className="w-full h-full rounded-full object-cover bg-[var(--bg-surface)]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getCartoonAvatar(otherName || otherId || 'user');
            }}
          />
        </div>
        {isUserOnline(otherId) && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)] shadow-xs" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-[15px] truncate ${unread > 0 ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
            {otherName}
          </span>
          <span className="text-[12px] text-[var(--text-muted)] font-medium flex-shrink-0 ml-2">
            {timeAgo(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-[14px] truncate ${unread > 0 ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] font-normal'}`}>
            {isMe && <span className="text-[var(--text-muted)]">You: </span>}
            {lastMessage || 'Sent a message'}
          </p>
          {unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Suggested Student Item ──────────────────────────────────────────

function SuggestedStudentItem({ student, currentUid, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(student.id)}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--border-hairline)] flex-shrink-0 bg-[var(--accent-tint-10)] shadow-xs">
          <img 
            src={avatarUrl(student.id, student.full_name, student.photo_url)} 
            alt="" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getCartoonAvatar(student.full_name || student.id || 'user');
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
            {student.full_name || 'Student'}
          </p>
          <p className="text-xs font-semibold text-[var(--text-muted)] truncate mt-0.5">
            @{student.username || 'campus_student'} · {student.branch || 'Campus'}
          </p>
        </div>
      </div>
      <button 
        type="button"
        className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-xs"
      >
        Chat
      </button>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({ msg, isMe, showAvatar, senderPhoto, senderName, senderId }) {
  const sender = msg.senderId || msg.sender_id;
  const isSystem = sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 bg-[var(--accent-tint-10)] text-[var(--text-secondary)] rounded-full px-4 py-1.5">
          <Zap className="w-3.5 h-3.5 text-[var(--accent)] fill-current" />
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
                className="w-7 h-7 rounded-full object-cover border border-[var(--border-hairline)]"
              />
            </Link>
          ) : <div className="w-7 h-7" />}
        </div>
      )}

      <div className={`max-w-[78%] sm:max-w-[68%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isMe
              ? 'bg-[var(--accent)] text-white rounded-br-xs font-medium shadow-xs'
              : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-bl-xs font-medium shadow-xs'
          }`}
        >
          {msg.text}
        </div>
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[var(--text-muted)] font-medium">{formatTime(msg.timestamp || msg.created_at)}</span>
          {isMe && <CheckCheck size={14} className="text-[var(--accent)] opacity-90 flex-shrink-0" />}
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€ Main Messages Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetParam = searchParams.get('uid') || searchParams.get('user') || searchParams.get('userId') || searchParams.get('group');

  const { user: globalUser } = useUserContext();
  const currentUid = globalUser?.id || globalUser?.uid || null;
  const currentUser = globalUser;
  const { startCall } = useVoiceCall();

  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMsgSearch, setNewMsgSearch] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const { data: usersData } = useSWR('/api/users', fetcher);
  const suggestedStudents = usersData?.users || [];

  const { data: initialChatsData, isLoading: loadingChats, mutate: mutateChats } = useSWR(
    currentUid ? '/api/chats' : null,
    fetcher
  );

  const { data: bookingsData } = useSWR(
    currentUid ? '/api/bookings' : null,
    fetcher
  );

  const { data: walletData } = useSWR(
    currentUid ? '/api/wallet' : null,
    fetcher
  );

  const spendableSparks = walletData?.wallet 
    ? ((walletData.wallet.purchased || 0) + (walletData.wallet.bonus || 0) + (walletData.wallet.creator || 0)) 
    : 0;

  useEffect(() => {
    if (initialChatsData?.chats) {
      setChats(initialChatsData.chats);
    }
  }, [initialChatsData]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const activeChannelRef = useRef(null);
  const messagesCacheRef = useRef({});

  // â”€â”€ Keyboard & Mobile Visual Viewport Handling (Attaches to top of keyboard) â”€â”€
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewportChange = () => {
      if (window.innerWidth >= 768) {
        if (chatContainerRef.current) {
          chatContainerRef.current.style.height = '';
          chatContainerRef.current.style.top = '';
          chatContainerRef.current.style.bottom = '';
        }
        return;
      }

      if (chatContainerRef.current && !showList) {
        if (window.visualViewport) {
          const vpHeight = window.visualViewport.height;
          const vpTop = window.visualViewport.offsetTop;
          const topOffset = 58;
          chatContainerRef.current.style.height = `${vpHeight - topOffset}px`;
          chatContainerRef.current.style.top = `${topOffset + vpTop}px`;
        }
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    window.addEventListener('resize', handleViewportChange);

    handleViewportChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [showList]);

  // Real-time Chat List updates
  useEffect(() => {
    if (!currentUid || !supabase) return;

    const channel = supabase
      .channel(`chat-list-${currentUid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          mutateChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUid, mutateChats]);

  // Real-time Chat Messages updates for active chat (Instant Broadcast + Postgres WAL)
  useEffect(() => {
    if (!activeChatId || !supabase) return;

    const channel = supabase
      .channel(`chat-messages-${activeChatId}`)
      .on(
        'broadcast',
        { event: 'new-message' },
        ({ payload }) => {
          const newMsg = payload;
          if (newMsg?.senderId === currentUid) return; // skip own broadcast
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id || (newMsg.tempId && m.id === newMsg.tempId))) return prev;
            const updated = [...prev, newMsg];
            messagesCacheRef.current[activeChatId] = updated;
            return updated;
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${activeChatId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            const formatted = {
              id: newMsg.id,
              senderId: newMsg.sender_id,
              text: newMsg.text,
              status: newMsg.status || 'sent',
              timestamp: newMsg.created_at ? new Date(newMsg.created_at).getTime() : Date.now(),
              created_at: newMsg.created_at,
            };
            const updated = [
              ...prev.filter(m => !m.id?.startsWith('temp-') || m.text !== newMsg.text),
              formatted
            ];
            messagesCacheRef.current[activeChatId] = updated;
            return updated;
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
        }
      )
      .subscribe();

    activeChannelRef.current = channel;

    return () => {
      activeChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeChatId, currentUid]);

  // ── Open Chat (Instant 0ms Switch + Client Memory Cache) ───────────────────
  const openChat = useCallback((chat) => {
    if (!chat?.id) return;
    const chatId = chat.id;
    setActiveChatId(chatId);
    setActiveChat(chat);
    setShowList(false);
    setLoadingMessages(false);

    // Optimistically clear unread badge in state
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          unread_count: { ...(c.unread_count || {}), [currentUid]: 0 },
          unreadCount: { ...(c.unreadCount || {}), [currentUid]: 0 }
        };
      }
      return c;
    }));

    // Reset unread count in database in background
    if (!chat.isMock && currentUid) {
      fetch(`/api/chats/${chatId}`, { method: 'PATCH' }).catch(() => {});
    }

    // 1. Instant Cache Check (0ms switch)
    const cached = messagesCacheRef.current[chatId];
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setMessages(cached);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 20);
    } else if (chat.isMock || !chat.last_message || chat.last_message.startsWith('Say hi')) {
      // New conversation with 0 messages: ready immediately with 0 delay
      setMessages([]);
    } else {
      // Show optimistic last message while fetching recent messages in background
      if (chat.last_message) {
        setMessages([{
          id: `opt-${chatId}`,
          senderId: chat.last_sender_id || 'other',
          text: chat.last_message,
          status: 'sent',
          timestamp: chat.last_message_at ? new Date(chat.last_message_at).getTime() : Date.now(),
          created_at: chat.last_message_at,
        }]);
      } else {
        setMessages([]);
      }
    }

    // 2. Fast background sync (fetches max 25 recent messages)
    if (!chat.isMock) {
      fetch(`/api/chats/${chatId}/messages?limit=25`)
        .then(res => res.json())
        .then(data => {
          if (data?.messages) {
            messagesCacheRef.current[chatId] = data.messages;
            setActiveChatId(currId => {
              if (currId === chatId) {
                setMessages(data.messages);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 30);
              }
              return currId;
            });
          }
        })
        .catch(err => console.error('Failed to sync messages:', err));
    }
  }, [currentUid]);

  const isDismissedRef = useRef(false);
  const initialProcessedRef = useRef(false);

  const openChatWithUser = useCallback((targetUid, targetName = null, targetPhoto = null) => {
    if (!currentUid) return;
    setShowNewMessageModal(false);
    const sorted = [currentUid, targetUid].sort();
    const targetChatId = `${sorted[0]}_${sorted[1]}`;
    const existing = chats.find(c => c.id === targetChatId);

    if (existing) {
      openChat(existing);
    } else {
      const mockChat = {
        id: targetChatId,
        participants: [currentUid, targetUid],
        participant_names: targetName ? { [targetUid]: targetName } : {},
        participant_photos: targetPhoto ? { [targetUid]: targetPhoto } : {},
        isMock: true,
        last_message: 'Say hi! (Costs 5 Sparks)',
        last_message_at: new Date().toISOString(),
      };
      setActiveChatId(targetChatId);
      setActiveChat(mockChat);
      setMessages([]);
      setLoadingMessages(false);
      setShowList(false);
    }
  }, [currentUid, chats, openChat]);

  // Auto-open chat via query param only once on mount / initial load
  useEffect(() => {
    if (isDismissedRef.current) return;
    if (!targetParam || !currentUid || loadingChats) return;
    if (initialProcessedRef.current) return;

    if (targetParam === currentUid) {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/messages');
      }
      return;
    }

    initialProcessedRef.current = true;

    const existingById = chats.find(c => c.id === targetParam);
    if (existingById) {
      openChat(existingById);
      return;
    }

    const studentById = suggestedStudents.find(s => s.id === targetParam);
    if (studentById) {
      openChatWithUser(studentById.id, studentById.full_name || studentById.username);
      return;
    }

    const isUidParam = searchParams.has('uid') || searchParams.has('user') || searchParams.has('userId');
    if (isUidParam) {
      openChatWithUser(targetParam);
      return;
    }

    const groupChatObj = {
      id: `group_${encodeURIComponent(targetParam)}`,
      participant_names: { group: targetParam },
      participants: [currentUid, 'group'],
      isGroup: true,
      name: targetParam,
      last_message: 'Welcome to the group chat!',
      last_message_at: new Date().toISOString(),
    };
    setActiveChatId(groupChatObj.id);
    setActiveChat(groupChatObj);
    setShowList(false);
  }, [targetParam, currentUid, loadingChats, chats, suggestedStudents, openChat, openChatWithUser, searchParams]);

  const handleBack = () => {
    isDismissedRef.current = true;
    setShowList(true);
    setActiveChatId(null);
    setActiveChat(null);
    setMessages([]);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/messages');
    }
    router.replace('/messages');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send message
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeChatId || !currentUid || sendingMsg) return;

    setInputText('');
    setSendingMsg(true);
    inputRef.current?.focus();

    if (activeChat?.isMock) {
      const otherUserId = activeChat.participants.find(p => p !== currentUid);
      try {
        const createRes = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otherUserId }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          import('@/lib/toast').then(m => m.toast.error(createData.error || 'Failed to start chat (Need 5 Sparks)'));
          setSendingMsg(false);
          return;
        }
        setActiveChat(prev => ({ ...prev, isMock: false }));
      } catch (err) {
        console.error('Failed to create chat:', err);
        setSendingMsg(false);
        return;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      tempId,
      senderId: currentUid,
      text,
      timestamp: Date.now(),
      status: 'sent'
    };

    setMessages(prev => {
      const updated = [...prev, newMsg];
      if (activeChatId) {
        messagesCacheRef.current[activeChatId] = updated;
      }
      return updated;
    });
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);

    // Instant WebSocket broadcast to active recipient
    if (activeChannelRef.current) {
      activeChannelRef.current.send({
        type: 'broadcast',
        event: 'new-message',
        payload: {
          id: tempId,
          tempId,
          senderId: currentUid,
          text,
          status: 'sent',
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
        }
      }).catch(() => {});
    }

    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      mutateChats();
    } catch (err) {
      console.error('Failed to send message:', err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
      import('@/lib/toast').then(m => m.toast.error('Failed to send message. Try again.'));
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

  const q = searchQuery.trim().toLowerCase();

  const filteredChats = chats.filter(c => {
    if (!q) return true;
    const participants = c.participants || [];
    const pNames = c.participant_names || c.participantNames || {};
    const otherId = participants.find(p => p !== currentUid) || '';
    const otherName = (pNames[otherId] || '').toLowerCase();
    const lastMsg = (c.last_message || c.lastMessage || '').toLowerCase();
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

  const activeParticipants = activeChat?.participants || [];
  const otherId = activeParticipants.find(p => p !== currentUid) || '';
  const directoryUser = suggestedStudents.find(s => s.id === otherId);
  const pNames = activeChat?.participant_names || activeChat?.participantNames || {};
  const pPhotos = activeChat?.participant_photos || activeChat?.participantPhotos || {};
  const otherName = directoryUser?.full_name || pNames[otherId] || 'Campus Student';
  const otherPhoto = directoryUser?.photo_url || pPhotos[otherId] || '';

  const activeMeeting = (bookingsData?.bookings || []).find(b => {
    const gId = b.guest_id || b.guestId;
    const hId = b.host_id || b.hostId;
    const isAccepted = ['Accepted', 'Confirmed', 'Requested'].includes(b.status);
    return isAccepted && ((gId === currentUid && hId === otherId) || (hId === currentUid && gId === otherId));
  });
  const hasActiveMeeting = Boolean(activeMeeting);

  if (!loadingChats && !currentUid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-tint-10)] flex items-center justify-center mb-4 text-[var(--text-primary)]">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Sign in to Message</h2>
        <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-6">
          Connect with campus students directly.
        </p>
        <Link href="/" className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-white font-bold text-xs hover:bg-[var(--accent-hover)] transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className={`flex w-full bg-[var(--bg-surface)] text-[var(--text-primary)] overflow-hidden md:border border-[var(--border-hairline)] md:rounded-[28px] shadow-xs ${
        !showList
          ? 'fixed inset-x-0 bottom-0 top-[58px] z-[60] md:static md:top-auto md:z-0 md:rounded-[28px] md:border rounded-none border-0 h-[calc(100dvh-58px)] md:h-[calc(100vh-32px)] flex-row'
          : 'h-[calc(100dvh-70px)] md:h-[calc(100vh-32px)] rounded-none md:rounded-[28px] border-0 md:border flex-row relative'
      }`}
    >
      {/* LEFT SIDEBAR (320px per Blueprint Section 4) */}
      <div className={`
        flex flex-col w-full md:w-[320px] lg:w-[320px] md:flex-shrink-0
        border-r border-[var(--border-hairline)] bg-[var(--bg-surface)]
        ${!showList ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-[var(--border-hairline)]">
          <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">
            @{currentUser?.username || currentUser?.full_name?.toLowerCase().replace(/\s+/g, '') || 'messages'}
          </span>
          <button
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="w-9 h-9 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] flex items-center justify-center hover:bg-[var(--accent-tint-20)] active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="New Message"
          >
            <SquarePen size={17} />
          </button>
        </div>

        <div className="p-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats or peers..."
              className="w-full text-[13px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div suppressHydrationWarning className="flex-1 overflow-y-auto no-scrollbar py-0 px-0">
          {loadingChats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              {filteredChats.length > 0 && (
                <div>
                  {q && <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-4 py-1">Conversations</p>}
                  <div>
                    {filteredChats.map(chat => (
                      <ChatListItem
                        key={chat.id}
                        chat={chat}
                        currentUid={currentUid}
                        isActive={chat.id === activeChatId}
                        onClick={() => openChat(chat)}
                        directoryUser={suggestedStudents.find(s => s.id === (chat.participants || []).find(p => p !== currentUid))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(q || chats.length === 0) && filteredSuggested.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 py-1.5 mt-2">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {q ? 'Campus Directory' : 'Suggested for you'}
                    </span>
                    {!q && <Link href="/discover" className="text-[11px] font-bold text-[var(--accent)] hover:underline">See all</Link>}
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
            </>
          )}
        </div>
      </div>

      {/* RIGHT MAIN PANEL */}
      <div className={`
        flex flex-col flex-1 h-full min-h-0 bg-[var(--bg-base)]
        ${showList && !activeChatId ? 'hidden md:flex' : 'flex'}
      `}>
        {!activeChatId ? (
          <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto no-scrollbar p-6 sm:p-8 bg-[var(--bg-base)]">
            <div className="max-w-xl mx-auto w-full my-auto py-6 space-y-6">
              
              {/* Top Banner Card */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={12} className="fill-current" />
                  <span>Direct Campus Connect</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                  Start a Conversation
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed font-medium">
                  Connect 1-on-1 with verified campus peers to collaborate, study together, or ask questions.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewMessageModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <SquarePen size={14} />
                    <span>New Message</span>
                  </button>
                  <Link
                    href="/discover"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:bg-[var(--bg-base)] text-[var(--text-secondary)] font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Compass size={14} className="text-[var(--accent)]" />
                    <span>Explore Campus</span>
                  </Link>
                </div>
              </div>

              {/* 1-Tap Quick Chat Suggestions Card */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-hairline)] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Suggested Classmates
                    </span>
                  </div>
                  <Link href="/discover" className="text-[11px] font-bold text-[var(--accent)] hover:underline">
                    View All
                  </Link>
                </div>

                {suggestedStudents.filter(s => s.id !== currentUid).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedStudents
                      .filter(s => s.id !== currentUid)
                      .slice(0, 6)
                      .map((student) => {
                        const avatar = avatarUrl(student.id, student.full_name, student.photo_url);
                        const branchYear = [student.year, student.branch].filter(Boolean).join(' · ') || student.university || 'Campus Student';
                        const firstInterest = Array.isArray(student.interests) && student.interests.length > 0 ? student.interests[0] : null;

                        return (
                          <div
                            key={student.id}
                            className="p-3.5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] hover:border-[var(--accent-tint-20)] hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={avatar}
                                  alt=""
                                  className="w-11 h-11 rounded-full object-cover border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getCartoonAvatar(student.full_name || student.id || 'user');
                                  }}
                                />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[var(--bg-surface)]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                                  {student.full_name || 'Student'}
                                </p>
                                <p className="text-[10px] font-semibold text-[var(--text-muted)] truncate mt-0.5">
                                  {branchYear}
                                </p>
                                {firstInterest && (
                                  <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                                    {firstInterest}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openChatWithUser(student.id, student.full_name, student.photo_url)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent-tint-10)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white border border-[var(--accent-tint-20)] text-[11px] font-bold transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs"
                              title="Start Chat"
                            >
                              <Send size={11} />
                              <span>Chat</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[var(--text-muted)] text-xs font-medium">
                    Loading campus students…
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* Header Bar */}
            {(() => {
              const isGroup = activeChat?.isGroup || activeChatId?.startsWith('group_') || Boolean(activeChat?.name);
              return (
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="md:hidden p-2 -ml-2 rounded-full hover:bg-[var(--bg-surface)] active:bg-[var(--accent-tint-10)] transition-colors text-[var(--text-primary)] cursor-pointer flex items-center justify-center flex-shrink-0"
                      title="Back"
                    >
                      <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" strokeWidth={2.5} />
                    </button>

                    <Link
                      href={isGroup ? '/circles' : (otherId ? `/users/${otherId}` : '#')}
                      className="flex items-center gap-3 min-w-0 group hover:opacity-85 transition-all cursor-pointer"
                      title={isGroup ? 'View Community' : 'View Profile'}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={avatarUrl(otherId, otherName, otherPhoto)}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-[var(--border-hairline)] group-hover:ring-2 group-hover:ring-[var(--accent)]/30 transition-all"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getCartoonAvatar(otherName || otherId || 'user');
                          }}
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
                          {otherName}
                        </p>
                        {isGroup ? (
                          <p className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                            Verified Campus Channel
                          </p>
                        ) : (
                          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active on Campus
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>

                  {isGroup ? (
                    <a
                      href={activeChat?.link || activeChat?.channel_link || activeChat?.invite_link || "https://chat.whatsapp.com/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                      title="WhatsApp Channel"
                    >
                      Channel
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Voice Call button */}
                      <button
                        type="button"
                        onClick={() => {
                          startCall({
                            targetUserId: otherId,
                            targetName: otherName,
                            targetPhoto: otherPhoto,
                            bookingId: activeMeeting?.id || null,
                            location: activeMeeting?.location || 'Campus Meetup',
                            callType: 'voice',
                          });
                        }}
                        className="w-9 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                        title="Voice Call (100% End-to-End Encrypted)"
                      >
                        <Phone size={15} strokeWidth={2.2} />
                      </button>

                      {/* Video Call button */}
                      <button
                        type="button"
                        onClick={() => {
                          startCall({
                            targetUserId: otherId,
                            targetName: otherName,
                            targetPhoto: otherPhoto,
                            bookingId: activeMeeting?.id || null,
                            location: activeMeeting?.location || 'Campus Meetup',
                            callType: 'video',
                          });
                        }}
                        className="w-9 h-9 rounded-xl bg-[var(--accent-tint-10)] hover:bg-[var(--accent-tint-20)] text-[var(--accent)] border border-[var(--accent-tint-20)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                        title="Video Call (100% End-to-End Encrypted)"
                      >
                        <Video size={16} strokeWidth={2.2} />
                      </button>

                      <Link
                        href={`/users/${otherId}`}
                        className="w-9 h-9 rounded-xl hover:bg-[var(--accent-tint-10)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-hairline)] flex items-center justify-center transition-colors flex-shrink-0"
                        title="View Profile"
                      >
                        <Info size={17} strokeWidth={2} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1 no-scrollbar bg-[var(--bg-base)]">
              {messages.length === 0 ? (() => {
                const isGroup = activeChat?.isGroup || activeChatId?.startsWith('group_') || Boolean(activeChat?.name);
                return (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <Link
                      href={isGroup ? '/circles' : (otherId ? `/users/${otherId}` : '#')}
                      className="group cursor-pointer inline-flex flex-col items-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden mb-3 border border-[var(--border-hairline)] shadow-sm group-hover:ring-4 group-hover:ring-[var(--accent)]/20 transition-all">
                        <img 
                          src={avatarUrl(otherId, otherName, otherPhoto)} 
                          alt={otherName} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getCartoonAvatar(otherName || otherId || 'user');
                          }}
                        />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{otherName}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mb-4 font-semibold">
                        {isGroup ? 'Verified Campus Community · Official Channel' : 'Campus Student · Meova'}
                      </p>
                    </Link>

                    {isGroup ? (
                      <a 
                        href={activeChat?.link || activeChat?.channel_link || activeChat?.invite_link || "https://chat.whatsapp.com/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                      >
                        Join Official WhatsApp Channel
                      </a>
                    ) : (
                      <Link 
                        href={`/users/${otherId}`}
                        className="px-4 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] text-[var(--text-primary)] text-xs font-bold transition-colors border border-[var(--border-hairline)]"
                      >
                        View profile
                      </Link>
                    )}
                  </div>
                );
              })() : (
                <>
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                      const sender = msg.senderId || msg.sender_id;
                      const isMe = sender === currentUid;
                      const prevMsg = messages[idx - 1];
                      const prevSender = prevMsg ? (prevMsg.senderId || prevMsg.sender_id) : null;
                      const showAvatar = !prevMsg || prevSender !== sender;

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
                </>
              )}
            </div>

            {/* Input Bar */}
            {(() => {
              const isGroup = activeChat?.isGroup || activeChatId?.startsWith('group_') || Boolean(activeChat?.name);
              if (isGroup) {
                return (
                  <div className="p-3.5 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] flex-shrink-0 flex items-center justify-center gap-2">
                    <Radio size={14} className="text-[var(--accent)]" />
                    <p className="text-xs font-bold text-[var(--text-secondary)]">
                      Verified Campus Channel · Broadcast updates only
                    </p>
                  </div>
                );
              }

              const isGenuinelyNewChat = !loadingMessages && (activeChat?.isMock || (messages.length === 0 && !activeChat?.last_message));

              return (
                <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] flex-shrink-0">
                  {/* First message spark indicator */}
                  {isGenuinelyNewChat && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[var(--accent-tint-10)] border-b border-[var(--accent-tint-20)] text-[11px] font-bold text-[var(--accent)]">
                      <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-[var(--accent)] fill-[var(--accent)] flex-shrink-0" />
                        <span>First message starts this conversation (5 Sparks)</span>
                      </div>
                      <span className="font-extrabold text-[var(--accent)] flex-shrink-0 ml-2">Balance: {spendableSparks} Sparks</span>
                    </div>
                  )}

                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:border-transparent transition-all">
                      <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none max-h-28 font-medium"
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
                        className="text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-30 font-bold text-xs transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                      >
                        {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" /> : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[var(--border-hairline)] anim-fade-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-hairline)]">
              <h2 className="text-base font-bold text-[var(--text-primary)]">New Message</h2>
              <button 
                type="button"
                onClick={() => { setShowNewMessageModal(false); setNewMsgSearch(''); }}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Quick Search inside Modal */}
            <div className="p-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl px-3 py-2">
                <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search classmate by name, branch..."
                  value={newMsgSearch}
                  onChange={e => setNewMsgSearch(e.target.value)}
                  className="bg-transparent text-xs text-[var(--text-primary)] font-semibold focus:outline-none w-full placeholder:text-[var(--text-muted)]"
                  autoFocus
                />
                {newMsgSearch && (
                  <button onClick={() => setNewMsgSearch('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2 overflow-y-auto no-scrollbar space-y-1 flex-1">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2">Select a Campus Student</p>
              {(() => {
                const term = newMsgSearch.trim().toLowerCase();
                const filtered = suggestedStudents.filter(s => {
                  if (s.id === currentUid) return false;
                  if (!term) return true;
                  return (
                    (s.full_name || '').toLowerCase().includes(term) ||
                    (s.username || '').toLowerCase().includes(term) ||
                    (s.branch || '').toLowerCase().includes(term) ||
                    (s.year || '').toLowerCase().includes(term)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-[var(--text-muted)] text-xs font-semibold">
                      No classmates found matching &quot;{newMsgSearch}&quot;
                    </div>
                  );
                }

                return filtered.map(student => (
                  <SuggestedStudentItem
                    key={student.id}
                    student={student}
                    currentUid={currentUid}
                    onSelect={openChatWithUser}
                  />
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
