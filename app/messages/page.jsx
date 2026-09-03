'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, MessageSquare,
  SquarePen, CheckCheck, Zap, Search,
  User, Sparkles, Compass, Info, Smile, Phone, Radio, X
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
      className={`w-full h-[72px] flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer border-b border-[#E7E5E4] ${
        isActive 
          ? 'bg-[#F3EEFC] font-medium' 
          : 'hover:bg-[#FAFAF8] bg-white'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden p-[1px] ring-1 ring-black/[0.08]">
          <img
            src={avatarUrl(otherId, otherName, otherPhoto)}
            alt=""
            className="w-full h-full rounded-full object-cover bg-[#FAFAF8]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getCartoonAvatar(otherName || otherId || 'user');
            }}
          />
        </div>
        {isUserOnline(otherId) && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-[15px] truncate ${unread > 0 ? 'font-bold text-[#1C1917]' : 'font-semibold text-[#1C1917]'}`}>
            {otherName}
          </span>
          <span className="text-[12px] text-[#A8A29E] font-medium flex-shrink-0 ml-2">
            {timeAgo(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-[14px] truncate ${unread > 0 ? 'text-[#1C1917] font-semibold' : 'text-[#78716C] font-normal'}`}>
            {isMe && <span className="text-[#A8A29E]">You: </span>}
            {lastMessage || 'Sent a message'}
          </p>
          {unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#6D28D9] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// â”€â”€â”€ Suggested Student Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SuggestedStudentItem({ student, currentUid, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(student.id)}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#FAFAF8] transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E7E5E4] flex-shrink-0 bg-[#F3EEFC] shadow-xs">
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
          <p className="text-xs sm:text-sm font-bold text-[#1C1917] truncate group-hover:text-[#6D28D9] transition-colors">
            {student.full_name || 'Student'}
          </p>
          <p className="text-xs font-semibold text-[#A8A29E] truncate mt-0.5">
            @{student.username || 'campus_student'} · {student.branch || 'Campus'}
          </p>
        </div>
      </div>
      <button 
        type="button"
        className="px-4 py-1.5 rounded-xl bg-[#6D28D9] text-white text-xs font-bold hover:bg-[#5B21B6] active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-xs"
      >
        Chat
      </button>
    </div>
  );
}

// â”€â”€â”€ Message Bubble â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MessageBubble({ msg, isMe, showAvatar, senderPhoto, senderName, senderId }) {
  const sender = msg.senderId || msg.sender_id;
  const isSystem = sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 bg-[#F3EEFC] text-[#78716C] rounded-full px-4 py-1.5">
          <Zap className="w-3.5 h-3.5 text-[#6D28D9] fill-current" />
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
                className="w-7 h-7 rounded-full object-cover border border-[#E7E5E4]"
              />
            </Link>
          ) : <div className="w-7 h-7" />}
        </div>
      )}

      <div className={`max-w-[78%] sm:max-w-[68%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isMe
              ? 'bg-[#6D28D9] text-white rounded-br-xs font-medium'
              : 'bg-[#F3EEFC] text-[#1C1917] rounded-bl-xs font-medium'
          }`}
        >
          {msg.text}
        </div>
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#A8A29E] font-medium">{formatTime(msg.timestamp || msg.created_at)}</span>
          {isMe && <CheckCheck size={14} className="text-[#6D28D9] opacity-90 flex-shrink-0" />}
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€ Main Messages Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetParam = searchParams.get('uid') || searchParams.get('user') || searchParams.get('group');

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
            return [...prev, newMsg];
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
            return [
              ...prev.filter(m => !m.id?.startsWith('temp-') || m.text !== newMsg.text),
              {
                id: newMsg.id,
                senderId: newMsg.sender_id,
                text: newMsg.text,
                status: newMsg.status || 'sent',
                timestamp: newMsg.created_at ? new Date(newMsg.created_at).getTime() : Date.now(),
                created_at: newMsg.created_at,
              }
            ];
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

  // â”€â”€ Open Chat (With Mark As Read) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openChat = useCallback(async (chat) => {
    setActiveChatId(chat.id);
    setActiveChat(chat);
    setShowList(false);
    setLoadingMessages(true);
    setMessages([]);

    // Optimistically clear unread badge in state
    setChats(prev => prev.map(c => {
      if (c.id === chat.id) {
        return {
          ...c,
          unread_count: { ...(c.unread_count || {}), [currentUid]: 0 },
          unreadCount: { ...(c.unreadCount || {}), [currentUid]: 0 }
        };
      }
      return c;
    }));

    // Reset unread count in database
    if (!chat.isMock && currentUid) {
      fetch(`/api/chats/${chat.id}`, { method: 'PATCH' }).catch(() => {});
    }

    try {
      const res = await fetch(`/api/chats/${chat.id}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
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

    const isUidParam = searchParams.has('uid') || searchParams.has('user');
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

    setMessages(prev => [...prev, newMsg]);
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
        <div className="w-16 h-16 rounded-full bg-[#F3EEFC] flex items-center justify-center mb-4 text-[#1C1917]">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1C1917] mb-1">Sign in to Message</h2>
        <p className="text-xs text-[#78716C] max-w-xs mb-6">
          Connect with campus students directly.
        </p>
        <Link href="/" className="px-6 py-2.5 rounded-full bg-[#6D28D9] text-white font-bold text-xs hover:bg-[#5B21B6] transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className={`flex w-full bg-white text-[#1C1917] overflow-hidden md:border border-[#E7E5E4]/80 md:rounded-3xl shadow-xs ${
        !showList
          ? 'fixed inset-x-0 bottom-0 top-[58px] z-[60] md:static md:top-auto md:z-0 md:rounded-3xl md:border rounded-none border-0 h-[calc(100dvh-58px)] md:h-[calc(100vh-80px)] flex-row'
          : 'h-[calc(100dvh-140px)] md:h-[calc(100vh-80px)] rounded-2xl border flex-row relative'
      }`}
    >
      {/* LEFT SIDEBAR (320px per Blueprint Section 4) */}
      <div className={`
        flex flex-col w-full md:w-[320px] lg:w-[320px] md:flex-shrink-0
        border-r border-[#E7E5E4] bg-white
        ${!showList ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-[#E7E5E4]">
          <span className="font-bold text-lg text-[#1C1917] tracking-tight">
            @{currentUser?.username || currentUser?.full_name?.toLowerCase().replace(/\s+/g, '') || 'messages'}
          </span>
          <button
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="p-2 rounded-full hover:bg-[#F3EEFC] text-[#1C1917] transition-colors cursor-pointer"
            title="New Message"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people or chats..."
              className="w-full h-11 pl-11 pr-9 rounded-full text-[13px] bg-[#FAFAF8] text-[#1C1917] placeholder:text-[#A8A29E] border border-[#E7E5E4] focus:outline-none focus:border-[#6D28D9] font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A8A29E] hover:text-[#1C1917]"
              >
                âœ•
              </button>
            )}
          </div>
        </div>

        <div suppressHydrationWarning className="flex-1 overflow-y-auto no-scrollbar py-2 px-2 space-y-0.5">
          {loadingChats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#A8A29E]" />
            </div>
          ) : (
            <>
              {filteredChats.length > 0 && (
                <div>
                  {q && <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider px-4 py-1">Conversations</p>}
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
                    <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">
                      {q ? 'Campus Directory' : 'Suggested for you'}
                    </span>
                    {!q && <Link href="/discover" className="text-[11px] font-bold text-[#6D28D9] hover:underline">See all</Link>}
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
        flex flex-col flex-1 h-full min-h-0 bg-white
        ${showList && !activeChatId ? 'hidden md:flex' : 'flex'}
      `}>
        {!activeChatId ? (
          <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto no-scrollbar p-6 sm:p-8 bg-[#FAFAF8]/50">
            <div className="max-w-xl mx-auto w-full my-auto py-6 space-y-6">
              
              {/* Top Banner Card */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFC] border border-[#E4D9F7] text-[#6D28D9] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={12} className="fill-current" />
                  <span>Direct Campus Connect</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                  Start a Conversation
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] max-w-sm mx-auto leading-relaxed font-medium">
                  Connect 1-on-1 with verified campus peers to collaborate, study together, or ask questions.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewMessageModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <SquarePen size={14} />
                    <span>New Message</span>
                  </button>
                  <Link
                    href="/discover"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border border-[#E7E5E4] hover:bg-[#F3EEFC] text-[#78716C] font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Compass size={14} className="text-[#6D28D9]" />
                    <span>Explore Campus</span>
                  </Link>
                </div>
              </div>

              {/* 1-Tap Quick Chat Suggestions Card */}
              <div className="bg-white rounded-2xl border border-[#E7E5E4]/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C1917]">
                      Suggested Classmates
                    </span>
                  </div>
                  <Link href="/discover" className="text-[11px] font-bold text-[#6D28D9] hover:underline">
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
                            className="p-3.5 rounded-2xl border border-[#E7E5E4] bg-[#FAFAF8]/70 hover:bg-white hover:border-[#E4D9F7] hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={avatar}
                                  alt=""
                                  className="w-11 h-11 rounded-full object-cover border border-[#E7E5E4] bg-white"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getCartoonAvatar(student.full_name || student.id || 'user');
                                  }}
                                />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1C1917] truncate group-hover:text-[#6D28D9] transition-colors">
                                  {student.full_name || 'Student'}
                                </p>
                                <p className="text-[10px] font-semibold text-[#A8A29E] truncate mt-0.5">
                                  {branchYear}
                                </p>
                                {firstInterest && (
                                  <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.2 rounded-full bg-white border border-[#E7E5E4] text-[#78716C]">
                                    {firstInterest}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openChatWithUser(student.id, student.full_name, student.photo_url)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3EEFC] text-[#6D28D9] hover:bg-[#6D28D9] hover:text-white border border-[#E4D9F7] text-[11px] font-bold transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs"
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
                  <div className="text-center py-6 text-[#A8A29E] text-xs font-medium">
                    Loading campus studentsâ€¦
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
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E5E4] bg-white flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#F3EEFC] active:bg-[#E7E5E4] transition-colors text-[#1C1917] cursor-pointer flex items-center justify-center flex-shrink-0"
                      title="Back"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#1C1917]" strokeWidth={2.5} />
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
                          className="w-10 h-10 rounded-full object-cover border border-[#E7E5E4] group-hover:ring-2 group-hover:ring-[#6D28D9]/30 transition-all"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getCartoonAvatar(otherName || otherId || 'user');
                          }}
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1C1917] group-hover:text-[#6D28D9] truncate transition-colors">
                          {otherName}
                        </p>
                        {isGroup ? (
                          <p className="text-[11px] font-bold text-[#6D28D9] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9] animate-pulse" />
                            Verified Campus Channel
                          </p>
                        ) : (
                          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                      title="WhatsApp Channel"
                    >
                      Channel
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Show Voice Call button ONLY if active meeting is booked between them */}
                      {hasActiveMeeting && (
                        <button
                          type="button"
                          onClick={() => {
                            startCall({
                              targetUserId: otherId,
                              targetName: otherName,
                              targetPhoto: otherPhoto,
                              bookingId: activeMeeting?.id,
                              location: activeMeeting?.location || 'Campus Meetup',
                            });
                          }}
                          className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Call Campus Meetup Peer (100% Private)"
                        >
                          <Phone size={15} />
                        </button>
                      )}

                      <Link
                        href={`/users/${otherId}`}
                        className="w-9 h-9 rounded-xl hover:bg-[#F3EEFC] text-[#78716C] flex items-center justify-center transition-colors"
                        title="View Profile"
                      >
                        <Info size={17} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1 no-scrollbar bg-white">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-[#A8A29E] gap-2.5">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6D28D9]" />
                  <span className="text-xs font-bold text-[#A8A29E] tracking-tight">Loading conversation...</span>
                </div>
              ) : (
                <>
                  {messages.length === 0 && (() => {
                    const isGroup = activeChat?.isGroup || activeChatId?.startsWith('group_') || Boolean(activeChat?.name);
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Link
                          href={isGroup ? '/circles' : (otherId ? `/users/${otherId}` : '#')}
                          className="group cursor-pointer inline-flex flex-col items-center"
                        >
                          <div className="w-20 h-20 rounded-full bg-[#F3EEFC] flex items-center justify-center overflow-hidden mb-3 border border-[#E4D9F7] shadow-sm group-hover:ring-4 group-hover:ring-[#F3EEFC] transition-all">
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
                          <h3 className="text-base font-bold text-[#1C1917] group-hover:text-[#6D28D9] transition-colors">{otherName}</h3>
                          <p className="text-xs text-[#78716C] mb-4 font-semibold">
                            {isGroup ? 'Verified Campus Community · Official Channel' : 'Campus Student · Meova'}
                          </p>
                        </Link>

                        {isGroup ? (
                          <a 
                            href={activeChat?.link || activeChat?.channel_link || activeChat?.invite_link || "https://chat.whatsapp.com/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                          >
                            Join Official WhatsApp Channel
                          </a>
                        ) : (
                          <Link 
                            href={`/users/${otherId}`}
                            className="px-4 py-1.5 rounded-xl bg-[#F3EEFC] hover:bg-[#E7E5E4] text-[#1C1917] text-xs font-bold transition-colors"
                          >
                            View profile
                          </Link>
                        )}
                      </div>
                    );
                  })()}

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
                  <div className="p-3.5 border-t border-[#E7E5E4] bg-[#FAFAF8] flex-shrink-0 flex items-center justify-center gap-2">
                    <Radio size={14} className="text-[#6D28D9]" />
                    <p className="text-xs font-bold text-[#78716C]">
                      Verified Campus Channel · Broadcast updates only
                    </p>
                  </div>
                );
              }

              const isGenuinelyNewChat = !loadingMessages && (activeChat?.isMock || (messages.length === 0 && !activeChat?.last_message));

              return (
                <div className="border-t border-[#E7E5E4] bg-white flex-shrink-0">
                  {/* First message spark indicator */}
                  {isGenuinelyNewChat && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[#F3EEFC]/80 border-b border-[#E4D9F7] text-[11px] font-bold text-purple-950">
                      <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-[#6D28D9] fill-[#6D28D9] flex-shrink-0" />
                        <span>First message starts this conversation (5 Sparks)</span>
                      </div>
                      <span className="font-extrabold text-[#5B21B6] flex-shrink-0 ml-2">Balance: {spendableSparks} Sparks</span>
                    </div>
                  )}

                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-center gap-3 bg-white border border-[#E7E5E4] rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-[#6D28D9] focus-within:border-transparent transition-all">
                      <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-base sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none max-h-28 font-medium"
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
                        className="text-[#6D28D9] hover:text-[#5B21B6] disabled:opacity-30 font-bold text-xs transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                      >
                        {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin text-[#6D28D9]" /> : 'Send'}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E7E5E4] anim-fade-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
              <h2 className="text-base font-bold text-[#1C1917]">New Message</h2>
              <button 
                type="button"
                onClick={() => { setShowNewMessageModal(false); setNewMsgSearch(''); }}
                className="text-xs font-bold text-[#A8A29E] hover:text-[#78716C] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Quick Search inside Modal */}
            <div className="p-3 border-b border-[#E7E5E4] bg-[#FAFAF8]/60">
              <div className="flex items-center gap-2 bg-white border border-[#E7E5E4] rounded-xl px-3 py-2">
                <Search size={14} className="text-[#A8A29E] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search classmate by name, branch..."
                  value={newMsgSearch}
                  onChange={e => setNewMsgSearch(e.target.value)}
                  className="bg-transparent text-xs text-[#1C1917] font-semibold focus:outline-none w-full placeholder:text-[#A8A29E]"
                  autoFocus
                />
                {newMsgSearch && (
                  <button onClick={() => setNewMsgSearch('')} className="text-[#A8A29E] hover:text-[#78716C] cursor-pointer">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2 overflow-y-auto no-scrollbar space-y-1 flex-1">
              <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider px-3 mb-2">Select a Campus Student</p>
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
                    <div className="text-center py-8 text-[#A8A29E] text-xs font-semibold">
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
        <Loader2 className="w-6 h-6 animate-spin text-[#A8A29E]" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
