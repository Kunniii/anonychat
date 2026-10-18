import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Heart,
  LogOut,
  Send,
  Image as ImageIcon,
  Flag,
  MessageSquare,
  X
} from 'lucide-react';
import { containsProfanity } from './profanity.js';
import AdminConsole from './AdminConsole.jsx';
import LandingPage from './LandingPage.jsx';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍'];
const ACTIVITY_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const PARTNER_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#f43f5e'  // rose
];
const getRandomPartnerColor = () => PARTNER_COLORS[Math.floor(Math.random() * PARTNER_COLORS.length)];
const EVENT_ICONS = {
  text: '💬',
  image: '🖼️',
  reaction: '💟',
  typing: '⌨️',
  receipt: '📬'
};

const getCelebrationMessage = ({ kind, count, intensity }) => {
  const messageIntros = ['Mới khởi động', 'Vào guồng rồi', 'Nhịp chat tăng tốc', 'Bùng nổ tin nhắn'];
  const eventIntros = ['Mới khởi động', 'Tăng nhịp rồi', 'Server nóng lên', 'Bùng nổ sự kiện'];
  const intro = (kind === 'messages' ? messageIntros : eventIntros)[intensity - 1];

  return kind === 'messages'
    ? `${intro} — hai bạn đã gửi ${count} tin nhắn cho nhau!`
    : `${intro} — hai bạn đã spam lên server ${count} sự kiện!`;
};

const EasterEggCelebration = ({ celebration }) => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    <div className="easter-egg-toast-wrap absolute left-1/2 top-[6%]">
      <div className={`easter-egg-toast easter-egg-toast--${celebration.intensity} flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-zinc-950/95 px-4 py-2 text-center text-xs text-emerald-100`}>
        <span className={`easter-egg-emoji easter-egg-emoji--${celebration.intensity}`} aria-hidden="true">
          {celebration.icon}
        </span>
        <span className="break-words">{getCelebrationMessage(celebration)}</span>
      </div>
    </div>
  </div>
);

const useAudio = () => {
  const audioRefs = useRef({
    connect: new Audio('/sounds/activity.mp3'),
    disconnect: new Audio('/sounds/activity.mp3'),
    send: new Audio('/sounds/message.mp3'),
    receive: new Audio('/sounds/message.mp3')
  });

  const playSound = useCallback((type) => {
    try {
      const audio = audioRefs.current[type];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((e) => console.log('Audio play failed:', e));
      }
    } catch (error) {
      console.log('Audio error:', error);
    }
  }, []);

  return { playSound };
};

const useWebSocket = (playSound) => {
  const [ws, setWs] = useState(null);
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [hasActiveConversation, setHasActiveConversation] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activityEventCount, setActivityEventCount] = useState(0);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [customBlockWords, setCustomBlockWords] = useState([]);
  const [partnerColor, setPartnerColor] = useState(getRandomPartnerColor);
  const activityEventCountRef = useRef(0);
  const eventMilestoneTypesRef = useRef(new Map());
  const typingTimeoutRef = useRef(null);
  const reconnectGraceRef = useRef(30);
  const nextMessageIndexRef = useRef(0);
  const imageTransfersRef = useRef(new Map());
  // Map<transferId, {totalChunks, totalBytes, messageId, messageIndex, chunks: Uint8Array[], received: number}>
  const blobUrlsRef = useRef([]);

  const recordActivityEvent = useCallback((type) => {
    const count = ++activityEventCountRef.current;
    if (ACTIVITY_MILESTONES.includes(count) || (count > 1000 && count % 1000 === 0)) {
      eventMilestoneTypesRef.current.set(count, type);
    }
    setActivityEventCount(count);
  }, []);

  useEffect(() => {
    const storageKey = 'anonychat-client-id';
    let clientId = window.localStorage.getItem(storageKey);
    if (!clientId) {
      clientId = window.crypto.randomUUID();
      window.localStorage.setItem(storageKey, clientId);
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?clientId=${encodeURIComponent(clientId)}`;
    let websocket;
    let reconnectTimeout;
    let keepaliveInterval;
    let reconnectDelay = 500;
    let disposed = false;
    let hasLostConnection = false;
    let isReconnecting = false;

    // Application-level keepalive: send a ping every 20s so proxy (Traefik/Nginx)
    // doesn't close the idle WebSocket before the server's WS ping fires.
    const CLIENT_KEEPALIVE_MS = 20_000;

    const connect = () => {
      if (disposed) return;

      websocket = new WebSocket(wsUrl);
      websocket.binaryType = 'arraybuffer';

      websocket.onopen = () => {
        reconnectDelay = 500;
        setWs(websocket);
        hasLostConnection = false;
        setMessages((prev) => prev.map((message) => (
          message.reconnectSeconds && !message.reconnectEndedAt
            ? { ...message, reconnectEndedAt: Date.now() }
            : message
        )));

        // Start application-level keepalive to prevent proxy idle-timeout
        window.clearInterval(keepaliveInterval);
        keepaliveInterval = window.setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'ping' }));
          }
        }, CLIENT_KEEPALIVE_MS);
      };

      websocket.onmessage = (event) => {
        // Handle binary frames (image chunks from server relay)
        if (event.data instanceof ArrayBuffer) {
          const buffer = event.data;
          const HEADER = 40;
          if (buffer.byteLength < HEADER) return;

          const bytes = new Uint8Array(buffer, 0, 36);
          let transferId = '';
          for (let i = 0; i < 36; i++) transferId += String.fromCharCode(bytes[i]);

          const view = new DataView(buffer);
          const chunkIndex = view.getUint32(36, false);

          const transfer = imageTransfersRef.current.get(transferId);
          if (!transfer || chunkIndex >= transfer.totalChunks || transfer.chunks[chunkIndex]) return;

          transfer.chunks[chunkIndex] = new Uint8Array(buffer, HEADER);
          transfer.received++;

          const progress = Math.round((transfer.received / transfer.totalChunks) * 100);
          setMessages((prev) => prev.map((m) =>
            m.imageTransferId === transferId ? { ...m, imageProgress: progress } : m
          ));

          if (transfer.received >= transfer.totalChunks) {
            // Assemble all chunks into a single Uint8Array
            let totalSize = 0;
            for (const chunk of transfer.chunks) totalSize += chunk.length;
            const assembled = new Uint8Array(totalSize);
            let offset = 0;
            for (const chunk of transfer.chunks) { assembled.set(chunk, offset); offset += chunk.length; }

            imageTransfersRef.current.delete(transferId);

            const blob = new Blob([assembled], { type: 'image/jpeg' });
            const blobUrl = URL.createObjectURL(blob);
            blobUrlsRef.current.push(blobUrl);

            recordActivityEvent('image');
            playSound('receive');

            setMessages((prev) => prev.map((m) =>
              m.imageTransferId === transferId
                ? { ...m, data: blobUrl, imageProgress: undefined, imageTransferId: undefined, delivered: true }
                : m
            ));

            // Send delivery receipt
            if (transfer.messageId && websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({ type: 'receipt', messageId: transfer.messageId }));
              recordActivityEvent('receipt');
            }
          }
          return;
        }

        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          msg = { system: event.data };
        }

        if (msg.type === 'config' && Number.isInteger(msg.reconnectGraceSeconds) && msg.reconnectGraceSeconds > 0) {
          reconnectGraceRef.current = msg.reconnectGraceSeconds;
        }

        if (msg.type === 'blockList' && Array.isArray(msg.words)) {
          setCustomBlockWords(msg.words.filter((w) => typeof w === 'string' && w.length > 0));
          return;
        }

        if (msg.type === 'image_start') {
          const { id, messageId, messageIndex, totalChunks, totalBytes } = msg;
          if (!id || !Number.isSafeInteger(totalChunks) || totalChunks < 1) return;

          imageTransfersRef.current.set(id, {
            totalChunks,
            totalBytes,
            messageId: typeof messageId === 'string' ? messageId : null,
            chunks: new Array(totalChunks).fill(null),
            received: 0
          });

          const msgIndex = Number.isSafeInteger(messageIndex) ? messageIndex : nextMessageIndexRef.current++;
          setMessages((prev) => [
            ...prev.filter((item) => item.type !== 'typing'),
            {
              id: typeof messageId === 'string' ? messageId : `img_transfer_${id}`,
              index: msgIndex,
              originIndex: Number.isSafeInteger(messageIndex) ? messageIndex : null,
              author: 'peer',
              type: 'image',
              data: null,
              from: 'stranger',
              isMine: false,
              delivered: false,
              reactions: { self: null, peer: null },
              timestamp: Date.now(),
              imageProgress: 0,
              imageTransferId: id
            }
          ]);
          return;
        }

        if (msg.type === 'image_cancel') {
          const { id } = msg;
          imageTransfersRef.current.delete(id);
          setMessages((prev) => prev.map((m) =>
            m.imageTransferId === id ? { ...m, imageFailed: true, imageProgress: undefined, imageTransferId: undefined } : m
          ));
          return;
        }

        if (msg.type === 'announcement' && typeof msg.message === 'string') {
          setMessages((prev) => [
            ...prev.filter((item) => item.type !== 'typing'),
            { announcement: msg.message, timestamp: Date.now() }
          ]);
          return;
        }

        if (msg.type === 'stats' && msg.onlineCount !== undefined) {
          setOnlineCount(msg.onlineCount);
        }

        if (msg.type === 'feedbackResult') {
          setFeedbackStatus({
            type: msg.ok === true ? 'success' : 'error',
            message: typeof msg.message === 'string' ? msg.message : 'Không nhận được phản hồi từ server.'
          });
          return;
        }

        if (msg.type === 'receipt') {
          recordActivityEvent('receipt');
          setMessages((prev) => prev.map((m) => (m.id === msg.messageId ? { ...m, delivered: true } : m)));
          return;
        }

        if (msg.type === 'reaction') {
          if (
            !Number.isSafeInteger(msg.messageIndex)
            || (msg.author !== 'self' && msg.author !== 'peer')
            || (msg.emoji !== null && !REACTION_EMOJIS.includes(msg.emoji))
          ) {
            return;
          }
          recordActivityEvent('reaction');
          const targetAuthor = msg.author === 'self' ? 'peer' : 'self';
          setMessages((prev) => prev.map((message) => (
            message.originIndex === msg.messageIndex && message.author === targetAuthor
              ? {
                ...message,
                reactions: { ...message.reactions, peer: msg.emoji },
                reactionAnimation: {
                  emoji: msg.emoji ?? message.reactions.peer,
                  revision: (message.reactionAnimation?.revision ?? 0) + 1
                }
              }
              : message
          )));
          return;
        }

        if (msg.system?.includes('Connected to a stranger')) {
          setIsUserConnected(true);
          setHasActiveConversation(true);
          if (!isReconnecting) {
            setMessages([]);
            setPartnerColor(getRandomPartnerColor());
            nextMessageIndexRef.current = 0;
            setActivityEventCount(0);
            activityEventCountRef.current = 0;
            eventMilestoneTypesRef.current.clear();
          }
          isReconnecting = false;
          playSound('connect');
        }

        if (msg.system?.toLowerCase().includes('reconnected')) {
          setIsUserConnected(true);
          setHasActiveConversation(true);
          isReconnecting = false;
        }

        if (msg.system?.includes('Waiting for a stranger') || msg.system?.includes('No partner available')) {
          setIsUserConnected(false);
          setHasActiveConversation(false);
          if (msg.system.includes('Waiting for a stranger')) {
            isReconnecting = false;
          }
        }

        if (msg.system?.toLowerCase().includes('conversation ended')) {
          setIsUserConnected(false);
          setHasActiveConversation(false);
          isReconnecting = false;
        }

        if (msg.system?.toLowerCase().includes('connection lost')) {
          setIsUserConnected(false);
        }

        if (msg.system?.includes('disconnected')) {
          setIsUserConnected(false);
          setHasActiveConversation(false);
          playSound('disconnect');
        }

        if (msg.type === 'text' || msg.type === 'image') {
          if (msg.from === 'stranger') {
            recordActivityEvent(msg.type);
          }
          const soundType = msg.from === 'self' ? 'send' : 'receive';
          playSound(soundType);

          const incomingMessage = {
            id: msg.id,
            index: msg.from === 'self' && Number.isSafeInteger(msg.messageIndex)
              ? msg.messageIndex
              : nextMessageIndexRef.current++,
            originIndex: Number.isSafeInteger(msg.messageIndex) ? msg.messageIndex : null,
            author: msg.from === 'self' ? 'self' : 'peer',
            type: msg.type,
            data: msg.data,
            from: msg.from,
            isMine: msg.from === 'self',
            delivered: msg.from === 'self' ? false : true,
            reactions: { self: null, peer: null },
            timestamp: Date.now()
          };

          if (msg.from === 'stranger' && msg.id && websocket.readyState === WebSocket.OPEN) {
            websocket.send(
              JSON.stringify({
                type: 'receipt',
                messageId: msg.id
              })
            );
            recordActivityEvent('receipt');
          }

          window.clearTimeout(typingTimeoutRef.current);

          setMessages((prev) => [
            ...prev.filter((item) => item.type !== 'typing'),
            incomingMessage
          ]);
        }

        if (msg.type === 'typing') {
          recordActivityEvent('typing');
          window.clearTimeout(typingTimeoutRef.current);
          setMessages((prev) => (
            prev.some((item) => item.type === 'typing')
              ? prev
              : [...prev, { id: 'typing-indicator', type: 'typing', timestamp: Date.now() }]
          ));
          typingTimeoutRef.current = window.setTimeout(() => {
            setMessages((prev) => prev.filter((item) => item.type !== 'typing'));
          }, 2000);
        }

        if (msg.system) {
          const isReconnect = msg.system.toLowerCase().includes('reconnected')
            || msg.system.toLowerCase().includes('connection restored');
          setMessages((prev) => [
            ...prev.map((message) => (
              isReconnect && message.reconnectSeconds && !message.reconnectEndedAt
                ? { ...message, reconnectEndedAt: Date.now() }
                : message
            )),
            {
              system: msg.system,
              timestamp: Date.now(),
              reconnectSeconds: Number.isInteger(msg.reconnectSeconds) && msg.reconnectSeconds > 0
                ? msg.reconnectSeconds
                : undefined,
              reconnectStartedAt: Number.isInteger(msg.reconnectSeconds) && msg.reconnectSeconds > 0
                ? Date.now()
                : undefined
            }
          ]);
        }
      };

      websocket.onclose = (event) => {
        if (disposed) return;

        window.clearInterval(keepaliveInterval);
        setWs(null);
        setIsUserConnected(false);
        if (event.code === 4001 && event.reason === 'Reconnected from this client') {
          setMessages((prev) => [
            ...prev,
            {
              system: '[SYSTEM] Phiên chat đã được tiếp tục ở một kết nối khác.',
              timestamp: Date.now()
            }
          ]);
          return;
        }

        isReconnecting = true;
        if (!hasLostConnection) {
          hasLostConnection = true;
          setMessages((prev) => [
            ...prev,
            {
              system: '[SYSTEM] Connection lost. Retrying…',
              timestamp: Date.now(),
              reconnectSeconds: reconnectGraceRef.current,
              reconnectStartedAt: Date.now()
            }
          ]);
        }
        reconnectTimeout = window.setTimeout(() => {
          connect();
        }, reconnectDelay);
        // Cap at 5s (not 10s) so we reconnect within the 120s server grace window
        reconnectDelay = Math.min(reconnectDelay * 2, 5000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        websocket.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimeout);
      window.clearInterval(keepaliveInterval);
      window.clearTimeout(typingTimeoutRef.current);
      if (websocket && websocket.readyState !== WebSocket.CLOSING && websocket.readyState !== WebSocket.CLOSED) {
        websocket.close();
      }
    };
  }, [playSound, recordActivityEvent]);

  const sendMessage = (data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (data.type === 'text' || data.type === 'image') {
        const messageIndex = nextMessageIndexRef.current++;
        ws.send(JSON.stringify({ ...data, messageIndex }));
        recordActivityEvent(data.type);
      } else {
        ws.send(JSON.stringify(data));
        if (data.type === 'typing') {
          recordActivityEvent('typing');
        }
      }
    }
  };

  const sendReaction = (targetMessage, emoji) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'reaction',
        messageIndex: targetMessage.originIndex,
        author: targetMessage.author,
        emoji
      }));
      recordActivityEvent('reaction');
      setMessages((prev) => prev.map((message) => (
        message.index === targetMessage.index
          ? {
            ...message,
            reactions: { ...message.reactions, self: emoji },
            reactionAnimation: {
              emoji: emoji ?? message.reactions.self,
              revision: (message.reactionAnimation?.revision ?? 0) + 1
            }
          }
          : message
      )));
      return true;
    }
    return false;
  };

  const sendFeedback = useCallback(({ feedback, username }) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setFeedbackStatus({ type: 'error', message: 'Chưa kết nối được server. Bạn thử lại sau nhé.' });
      return false;
    }
    ws.send(JSON.stringify({ type: 'feedback', data: feedback, username }));
    setFeedbackStatus({ type: 'pending', message: 'Đang gửi góp ý…' });
    return true;
  }, [ws]);

  const clearFeedbackStatus = useCallback(() => setFeedbackStatus(null), []);

  return {
    isUserConnected,
    hasActiveConversation,
    messages,
    sendMessage,
    sendReaction,
    sendFeedback,
    feedbackStatus,
    clearFeedbackStatus,
    onlineCount,
    activityEventCount,
    eventMilestoneTypesRef,
    customBlockWords,
    partnerColor
  };
};

const ChatMessage = ({
  message,
  image,
  isMine,
  delivered,
  isLastDelivered,
  partnerColor,
  timestamp,
  reactions,
  reactionAnimation,
  index,
  originIndex,
  author,
  onReact,
  onReport
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isDelayedSending, setIsDelayedSending] = useState(false);

  useEffect(() => {
    if (isMine && !delivered) {
      const elapsed = Date.now() - (timestamp || Date.now());
      if (elapsed >= 1000) {
        setIsDelayedSending(true);
      } else {
        const timer = window.setTimeout(() => {
          setIsDelayedSending(true);
        }, Math.max(0, 1000 - elapsed));
        return () => window.clearTimeout(timer);
      }
    } else {
      setIsDelayedSending(false);
    }
  }, [isMine, delivered, timestamp]);

  const selectedReaction = reactions?.self ?? null;
  const ownReaction = reactions?.self ?? null;
  const peerReaction = reactions?.peer ?? null;

  const handleReaction = (emoji) => {
    const sent = onReact({ index, originIndex, author }, emoji);
    if (sent) setPickerOpen(false);
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const hasReaction = Boolean(peerReaction || ownReaction);

  return (
    <div className={`flex w-full items-start ${isMine ? 'justify-end' : 'justify-start'} ${hasReaction ? 'my-2 mb-4' : 'my-2'}`}>
      <div className={`group relative flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-xl lg:max-w-2xl`}>
        {/* Floating reaction picker toolbar */}
        <div
          className={`absolute -top-11 z-20 flex items-center gap-1 rounded-full border border-white/10 bg-[#121318]/95 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)] opacity-0 pointer-events-none transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${
            isMine ? 'right-0' : 'left-0'
          } ${pickerOpen ? 'pointer-events-auto opacity-100' : ''}`}
          role="group"
          aria-label="Chọn cảm xúc"
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Phản ứng ${emoji}`}
              aria-pressed={selectedReaction === emoji}
              onClick={() => handleReaction(emoji)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-colors hover:bg-white/10 ${
                selectedReaction === emoji ? 'bg-white/15' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
          {selectedReaction && (
            <button
              type="button"
              aria-label="Bỏ reaction"
              onClick={() => handleReaction(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!isMine && onReport && (
            <button
              type="button"
              aria-label="Báo cáo tin nhắn"
              title="Báo cáo nội dung vi phạm"
              onClick={() => onReport({ text: message || '[ảnh]', image: !!image })}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-rose-400"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bubble */}
        <button
          type="button"
          title={formattedTime}
          aria-label="Chạm hoặc nhấn Enter để chọn cảm xúc"
          onClick={() => setPickerOpen((prev) => !prev)}
          className={`animate-chat-message ${isMine ? 'origin-bottom-right' : 'origin-bottom-left'} relative w-fit max-w-full break-words px-4 py-3 text-sm leading-relaxed transition-all duration-200 text-left cursor-pointer ${
            isMine
              ? 'rounded-2xl rounded-tr-sm bg-white text-zinc-950 font-medium shadow-[0_2px_12px_rgba(255,255,255,0.06)]'
              : 'rounded-2xl rounded-tl-sm bg-[#16171d] border border-white/[0.08] text-zinc-100'
          }`}
        >
          {image ? (
            <img
              src={image}
              alt="Ảnh trong cuộc trò chuyện"
              className="max-h-96 max-w-full rounded-xl object-contain"
            />
          ) : (
            <span className="block whitespace-pre-wrap">{message}</span>
          )}

          {/* Unified reaction capsule overlay */}
          {hasReaction && (
            <span
              className={`absolute ${
                isMine ? '-bottom-2.5 right-3' : '-bottom-2.5 left-3'
              } z-10 inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#121318] px-2 py-0.5 text-xs shadow-md`}
            >
              {peerReaction && (
                <span
                  title="Cảm xúc từ người lạ"
                  className={reactionAnimation?.emoji === peerReaction ? 'animate-reaction-spring inline-block' : 'inline-block'}
                >
                  {peerReaction}
                </span>
              )}
              {ownReaction && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact({ index, originIndex, author }, null);
                  }}
                  title="Bỏ cảm xúc của bạn"
                  className={`inline-block cursor-pointer hover:scale-110 transition-transform ${
                    reactionAnimation?.emoji === ownReaction ? 'animate-reaction-spring' : ''
                  }`}
                >
                  {ownReaction}
                </span>
              )}
            </span>
          )}
        </button>

        {/* Status indicator under bubble: only if delayed sending (>1s) or peer read dot */}
        {((isMine && !delivered && isDelayedSending) || (isMine && delivered && isLastDelivered)) && (
          <div className={`flex justify-end items-center px-1.5 ${hasReaction ? 'mt-4' : 'mt-1.5'}`}>
            {isMine && !delivered && isDelayedSending && (
              <span className="font-mono-clean text-[10px] text-zinc-500 italic">
                Đang gửi…
              </span>
            )}
            {isMine && delivered && isLastDelivered && (
              <span
                title="Người lạ đã nhận và đọc đến tin nhắn này"
                className="inline-block w-3 h-3 rounded-full ring-2 ring-[#0c0d12] shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: partnerColor || '#10b981',
                  boxShadow: `0 0 8px ${partnerColor || '#10b981'}80`
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SystemMessage = ({ message }) => {
  const normalizedMessage = message.system.toLowerCase();
  const hasCountdown = Number.isInteger(message.reconnectSeconds) && message.reconnectSeconds > 0;
  const countdownStartedAt = message.reconnectStartedAt || message.timestamp;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!hasCountdown || message.reconnectEndedAt) return undefined;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasCountdown, message.reconnectEndedAt]);

  const remainingSeconds = Math.max(
    0,
    Math.ceil((countdownStartedAt + message.reconnectSeconds * 1000 - now) / 1000)
  );
  const countdownActive = hasCountdown && !message.reconnectEndedAt && remainingSeconds > 0;
  const isConnected = normalizedMessage.includes('connected to a stranger')
    || normalizedMessage.includes('reconnected')
    || normalizedMessage.includes('connection restored')
    || normalizedMessage.includes('connection established');
  const isReconnecting = normalizedMessage.includes('connection lost');
  const dotStyle = isConnected
    ? 'bg-emerald-300'
    : isReconnecting
      ? 'bg-amber-300'
      : 'bg-zinc-500';
  const textStyle = isConnected
    ? 'text-emerald-200/80'
    : isReconnecting
      ? 'text-amber-200/80'
      : 'text-zinc-500';
  const label = normalizedMessage.includes('connection restored')
    ? 'Đã kết nối lại với máy chủ'
    : normalizedMessage.includes('conversation ended')
      ? 'Đã kết thúc · Đang tìm người mới'
      : normalizedMessage.includes('connection lost. retrying')
        ? 'Đang kết nối lại với máy chủ'
        : normalizedMessage.includes('connection lost')
          ? 'Người lạ mất kết nối · Đang thử lại'
          : normalizedMessage.includes('reconnected to your stranger')
            ? 'Đã kết nối lại'
            : normalizedMessage.includes('stranger reconnected')
              ? 'Người lạ đã kết nối lại'
              : normalizedMessage.includes('connected to a stranger')
                ? 'Đã kết nối'
                : normalizedMessage.includes('stranger disconnected')
                  ? 'Đã ngắt kết nối'
                  : normalizedMessage.includes('waiting for a stranger')
                    ? 'Đang chờ người lạ'
                    : message.system.replace(/^\[SYSTEM\]\s*/i, '');

  return (
    <div className="my-2 flex items-center gap-2.5 py-1" role="status">
      <span className="h-px flex-1 bg-zinc-800/80" />
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyle} ${countdownActive ? 'motion-safe:animate-pulse' : ''}`} />
      <span className={`text-center text-[9px] font-medium tracking-wide ${textStyle}`}>
        {label}
        {hasCountdown && !message.reconnectEndedAt ? ` · ${remainingSeconds}s` : ''}
      </span>
      <span className="h-px flex-1 bg-zinc-800/80" />
    </div>
  );
};

const TypingBubble = ({ partnerColor }) => (
  <div
    className="mr-auto my-2 flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-[#16171d] px-4 py-3"
    role="status"
    aria-label="Người lạ đang nhập"
  >
    <span
      className="h-2 w-2 rounded-full animate-bounce"
      style={{ backgroundColor: partnerColor || '#a1a1aa' }}
    />
    <span
      className="h-2 w-2 rounded-full animate-bounce [animation-delay:150ms]"
      style={{ backgroundColor: partnerColor || '#a1a1aa' }}
    />
    <span
      className="h-2 w-2 rounded-full animate-bounce [animation-delay:300ms]"
      style={{ backgroundColor: partnerColor || '#a1a1aa' }}
    />
  </div>
);

const OnlineCounter = ({ count }) => {
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== prevCount) {
      setIsAnimating(true);
      const timer = window.setTimeout(() => {
        setIsAnimating(false);
        setPrevCount(count);
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [count, prevCount]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono-clean text-zinc-300 transition-all duration-300 ${
        isAnimating ? 'scale-[1.03]' : 'scale-100'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span>{count ?? 0} online</span>
    </div>
  );
};

const ChatLog = ({ messages, isUserConnected, onReact, onReport, partnerColor }) => {
  const logRef = useRef(null);

  useLayoutEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isUserConnected]);

  const lastDeliveredMessageId = [...messages]
    .reverse()
    .find((m) => m.isMine && m.delivered && m.type !== 'typing')?.id;

  return (
    <div
      ref={logRef}
      className="relative min-h-0 flex-1 overflow-y-auto bg-transparent px-4 sm:px-6 py-4 md:py-5"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.12) transparent'
      }}
    >
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[240px] items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400">
              <MessageSquare className="h-6 w-6 stroke-[1.8]" />
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-light text-white tracking-tight">
              {isUserConnected ? 'Đã kết nối với người lạ' : 'Đang tìm kiếm người trò chuyện…'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans-clean">
              {isUserConnected
                ? 'Hãy gửi lời chào đầu tiên một cách lịch sự và tự nhiên.'
                : 'Hệ thống đang ghép cặp ngẫu nhiên. Xin bạn chờ trong giây lát.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div key={msg.index ?? msg.id ?? `${msg.timestamp}-${idx}`}>
              {msg.announcement ? (
                <>
                  <SystemMessage message={{ system: `[ADMIN] ${msg.announcement}`, timestamp: msg.timestamp }} />
                  <SystemMessage message={{ system: 'Admin chỉ gửi thông báo này và không thể biết bạn đang nhắn gì.', timestamp: msg.timestamp }} />
                </>
              ) : msg.system ? (
                <SystemMessage message={msg} />
              ) : msg.type === 'typing' ? (
                <TypingBubble partnerColor={partnerColor} />
              ) : (
                <ChatMessage
                  message={msg.data}
                  image={msg.type === 'image' ? msg.data : null}
                  isMine={msg.isMine}
                  delivered={msg.delivered}
                  isLastDelivered={msg.id === lastDeliveredMessageId}
                  partnerColor={partnerColor}
                  timestamp={msg.timestamp}
                  reactions={msg.reactions}
                  reactionAnimation={msg.reactionAnimation}
                  index={msg.index}
                  originIndex={msg.originIndex}
                  author={msg.author}
                  onReact={onReact}
                  onReport={onReport}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageInput = ({ onSendMessage, onTyping, onOpenAdmin, isConnected, customBlockWords = [] }) => {
  const [message, setMessage] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const [profanityError, setProfanityError] = useState('');
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

  const handleTyping = () => {
    if (!isConnected) return;
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping();
    }, 300);
  };

  const submitMessage = () => {
    if (!message.trim() || !isConnected) return;
    if (message.trim().toLowerCase() === '/admin') {
      setMessage('');
      onOpenAdmin();
      return;
    }

    setProfanityError('');
    if (containsProfanity(message, customBlockWords)) {
      setProfanityError('Tin nhắn chứa nội dung không phù hợp.');
      return;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onSendMessage({
      type: 'text',
      data: message,
      id: messageId
    });
    setMessage('');
  };

  const processImage = async (file) => {
    setAttachmentError('');
    if (!file) return;
    if (!isConnected || isProcessingImage) return;

    if (!file.type.startsWith('image/')) {
      setAttachmentError('Chỉ hỗ trợ tệp hình ảnh.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setAttachmentError('Ảnh gốc phải nhỏ hơn 20 MB.');
      return;
    }

    setIsProcessingImage(true);
    let bitmap;

    try {
      bitmap = await createImageBitmap(file);
      const longestSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, 1600 / longestSide);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context is unavailable');

      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('Image encoding failed')),
          'image/jpeg',
          0.82
        );
      });

      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('Ảnh sau khi nén vẫn vượt quá 5 MB.');
      }

      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Image reading failed'));
        reader.readAsDataURL(blob);
      });
      if (typeof data !== 'string') {
        throw new Error('Image encoding did not produce a data URL');
      }

      onSendMessage({
        type: 'image',
        data,
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      });
    } catch (error) {
      console.error('Image processing failed:', error);
      setAttachmentError(error.message || 'Không thể xử lý ảnh này.');
    } finally {
      bitmap?.close();
      setIsProcessingImage(false);
    }
  };

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    processImage(file);
  };

  const handlePaste = (event) => {
    const clipboardItems = Array.from(event.clipboardData.items);
    const imageItem = clipboardItems.find((item) => item.type.startsWith('image/'));
    const imageFile = imageItem?.getAsFile()
      || Array.from(event.clipboardData.files).find((file) => file.type.startsWith('image/'));

    if (!imageFile) return;

    event.preventDefault();
    processImage(imageFile);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#0e0f14]/85 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleImageSelected}
        tabIndex={-1}
        aria-label="Chọn hình ảnh"
      />
      <div className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#13141a] pl-4 pr-2 py-1.5 sm:py-2 focus-within:border-white/25 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
        <textarea
          ref={inputRef}
          rows={1}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (profanityError) setProfanityError('');
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="max-h-[140px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed font-sans-clean"
          placeholder={isConnected ? 'Nhập tin nhắn (gõ /admin để gửi góp ý)...' : 'Đang kết nối...'}
          autoComplete="off"
          autoFocus
          disabled={!isConnected}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          {isConnected ? (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isProcessingImage}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              aria-label="Gửi hình ảnh"
              title="Chọn ảnh hoặc dán ảnh bằng Ctrl+V"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-mono-clean text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              góp ý dev
            </button>
          )}
          <button
            type="button"
            onClick={submitMessage}
            disabled={!isConnected || !message.trim()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950 font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Gửi tin nhắn"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>
      {(attachmentError || profanityError || isProcessingImage) && (
        <p
          className={`mt-2 px-2 text-[11px] ${profanityError ? 'text-rose-400' : 'text-zinc-400'}`}
          role={attachmentError || profanityError ? 'alert' : 'status'}
        >
          {attachmentError || profanityError || 'Đang chuẩn bị hình ảnh…'}
        </p>
      )}
    </div>
  );
};

const FeedbackModal = ({ status, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
  const [username, setUsername] = useState('');
  const textareaRef = useRef(null);
  const isPending = status?.type === 'pending';
  const isSent = status?.type === 'success';

  useEffect(() => {
    textareaRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPending, onClose]);

  const submit = (event) => {
    event.preventDefault();
    if (!feedback.trim() || isPending || isSent) return;
    onSubmit({ feedback: feedback.trim(), username: username.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-[#111214] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.35)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="feedback-title" className="text-sm font-semibold text-zinc-100">Góp ý với admin</h2>
            <p className="mt-1 text-xs text-zinc-500">Tin nhắn sẽ được gửi ẩn danh.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value.slice(0, 2000))}
          maxLength={2000}
          rows={5}
          disabled={isPending || isSent}
          placeholder="Bạn muốn góp ý điều gì?"
          className="w-full resize-y rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
        />
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value.slice(0, 80))}
          maxLength={80}
          disabled={isPending || isSent}
          placeholder="Tên của bạn (không bắt buộc)"
          aria-label="Tên của bạn (không bắt buộc)"
          className="mt-3 w-full rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p
            className={`text-xs ${status?.type === 'error' ? 'text-rose-300' : status?.type === 'success' ? 'text-emerald-300' : 'text-zinc-500'}`}
            role={status?.type === 'error' ? 'alert' : 'status'}
          >
            {status?.message || `${feedback.length}/2000`}
          </p>
          <button
            type="submit"
            disabled={!feedback.trim() || isPending || isSent}
            className="shrink-0 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? 'Đang gửi…' : isSent ? 'Đã gửi' : 'Gửi góp ý'}
          </button>
        </div>
      </form>
    </div>
  );
};

const REPORT_REASONS = [
  'Từ ngữ thô tục / Xúc phạm',
  'Quấy rối / Đe dọa',
  'Nội dung khiêu dâm / Đồi trụy',
  'Spam / Lừa đảo',
  'Khác'
];

const ReportModal = ({ targetMessage, status, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customDetail, setCustomDetail] = useState('');
  const isPending = status?.type === 'pending';
  const isSent = status?.type === 'success';

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPending, onClose]);

  const submit = (event) => {
    event.preventDefault();
    if (isPending || isSent) return;
    const reportedText = targetMessage?.text || (targetMessage?.image ? '[Hình ảnh]' : '');
    if (!reportedText) return;
    const reasonText = selectedReason === 'Khác' && customDetail.trim()
      ? customDetail.trim()
      : selectedReason + (customDetail.trim() ? `: ${customDetail.trim()}` : '');
    onSubmit({ reportedText, reason: reasonText });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-[#111214] p-5 shadow-[0_12px_48px_rgba(0,0,0,0.35)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="report-modal-title" className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <span>🚩</span> Báo cáo nội dung vi phạm
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Báo cáo sẽ được gửi tới admin để xử lý và cập nhật bộ lọc từ.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Nội dung bị báo cáo</p>
          <p className="text-xs text-zinc-200 line-clamp-4 break-words">
            {targetMessage?.text || (targetMessage?.image ? '[Hình ảnh]' : '')}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Lý do báo cáo</label>
            <div className="grid grid-cols-1 gap-1.5">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                      : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="sr-only"
                    disabled={isPending || isSent}
                  />
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedReason === reason ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="report-detail" className="block text-xs text-zinc-400 mb-1">
              Chi tiết thêm (không bắt buộc)
            </label>
            <textarea
              id="report-detail"
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={2}
              disabled={isPending || isSent}
              placeholder="Thêm mô tả hoặc chỉ rõ từ vi phạm nếu cần..."
              className="w-full resize-none rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p
            className={`text-xs ${status?.type === 'error' ? 'text-rose-300' : status?.type === 'success' ? 'text-emerald-300' : 'text-zinc-500'}`}
            role={status?.type === 'error' ? 'alert' : 'status'}
          >
            {status?.message || ''}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || isSent}
              className="rounded-lg bg-rose-500 hover:bg-rose-600 px-3.5 py-2 text-xs font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? 'Đang gửi…' : isSent ? 'Đã gửi' : 'Gửi báo cáo'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};


const DonationModal = ({ onClose }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      className="donation-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
        aria-describedby="donation-description"
        className="donation-modal-card relative w-full max-w-sm rounded-[1.75rem] border border-zinc-700/70 bg-[#111214] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-6"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
          aria-label="Đóng cửa sổ ủng hộ"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <h2 id="donation-title" className="text-base font-semibold text-zinc-100">
          Ủng hộ AnonyChat
        </h2>
        <p id="donation-description" className="mx-auto mt-1.5 max-w-[17rem] text-xs leading-relaxed text-zinc-400">
          Quét mã QR bằng ứng dụng ngân hàng để gửi một chút yêu thương.
        </p>
        <div className="mx-auto mt-5 w-full max-w-[18rem] overflow-hidden rounded-2xl bg-white p-2.5">
          <img
            src="/donate-qr-crop.jpg"
            alt="Mã QR VietQR để chuyển khoản qua ngân hàng MB"
            className="block aspect-square w-full rounded-xl object-cover"
          />
        </div>
        <p className="mt-3 text-[10px] tracking-wide text-zinc-500">
          Cảm ơn bạn đã đồng hành 💗
        </p>
      </section>
    </div>
  );
};

const ChatHeader = ({ onlineCount, hasActiveConversation, isUserConnected, onEndConversation, onOpenDonation, onGoHome }) => (
  <header className="flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/[0.06] bg-[#0e0f14]/85 backdrop-blur-md">
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Về trang chủ AnonyChat"
          aria-label="Về trang chủ"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trang chủ</span>
        </button>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${isUserConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400/80'}`}
          role="status"
          aria-label={isUserConnected ? 'Đã kết nối' : 'Đang tìm người chat'}
        />
        <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-none">
          {isUserConnected ? 'Đang trò chuyện' : 'Đang tìm người lạ…'}
        </span>
      </div>
    </div>
    <div className="flex min-w-0 items-center justify-end gap-2">
      <OnlineCounter count={onlineCount} />
      <button
        type="button"
        onClick={onOpenDonation}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Ủng hộ AnonyChat"
      >
        <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
        <span>Ủng hộ</span>
      </button>
      {hasActiveConversation && (
        <button
          type="button"
          onClick={onEndConversation}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-950/60 hover:border-rose-500/30 hover:text-rose-200 transition-all cursor-pointer"
        >
          <LogOut className="w-3 h-3 text-rose-400" />
          <span>Rời phòng</span>
        </button>
      )}
    </div>
  </header>
);

const ChatContainer = ({ children }) => (
  <div className="relative h-full min-h-0 w-full flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
    <div className="relative flex h-full min-h-0 w-full max-w-4xl xl:max-w-5xl flex-col rounded-none sm:rounded-2xl border-0 sm:border sm:border-white/[0.08] bg-[#0c0d12] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
      {children}
    </div>
  </div>
);

const ChatApp = ({ onGoHome }) => {
  const { playSound } = useAudio();
  const {
    isUserConnected,
    hasActiveConversation,
    messages,
    sendMessage,
    sendReaction,
    onlineCount,
    activityEventCount,
    eventMilestoneTypesRef,
    sendFeedback,
    feedbackStatus,
    clearFeedbackStatus,
    customBlockWords,
    partnerColor
  } = useWebSocket(playSound);

  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);

  const handleOpenReport = useCallback((messageData) => {
    setReportStatus(null);
    setReportingMessage(messageData);
  }, []);

  const handleCloseReport = useCallback(() => {
    setReportingMessage(null);
    setReportStatus(null);
  }, []);

  const handleSubmitReport = useCallback(async ({ reportedText, reason }) => {
    setReportStatus({ type: 'pending', message: 'Đang gửi báo cáo…' });
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedText, reason })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể gửi báo cáo.');
      setReportStatus({ type: 'success', message: 'Đã gửi báo cáo vi phạm. Cảm ơn bạn!' });
      window.setTimeout(() => {
        setReportingMessage(null);
        setReportStatus(null);
      }, 1800);
    } catch (err) {
      setReportStatus({ type: 'error', message: err.message || 'Lỗi khi gửi báo cáo.' });
    }
  }, []);

  useEffect(() => {
    const pageTitle = 'AnonyChat | Anonymous Chat with Strangers Online';
    const pageDescription = 'AnonyChat is a free anonymous chat app for one-on-one stranger conversations and instant online messaging. Trò chuyện ẩn danh miễn phí với người lạ trực tuyến và gửi tin nhắn riêng tư ngay tức thì.';
    const pageKeywords = 'anonymous chat, random chat, stranger chat, online chat, private chat, trò chuyện ẩn danh, chat với người lạ, chat trực tuyến, tin nhắn ẩn danh';

    document.title = pageTitle;

    const setMeta = (selector, content) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const attributeName = selector.match(/meta\[name="([^"]+)"\]/)?.[1];
          if (attributeName) {
            element.setAttribute('name', attributeName);
          }
        } else if (selector.startsWith('meta[property=')) {
          const attributeName = selector.match(/meta\[property="([^"]+)"\]/)?.[1];
          if (attributeName) {
            element.setAttribute('property', attributeName);
          }
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', pageDescription);
    setMeta('meta[name="keywords"]', pageKeywords);
    setMeta('meta[property="og:title"]', pageTitle);
    setMeta('meta[property="og:description"]', pageDescription);
  }, []);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [easterEggQueue, setEasterEggQueue] = useState([]);
  const lastCelebratedMilestonesRef = useRef({ messages: 0, events: 0 });
  const celebrationRevisionRef = useRef(0);

  useEffect(() => {
    const messageCount = messages.filter((message) => (
      message.type === 'text' || message.type === 'image'
    )).length;
    if (messageCount === 0) {
      lastCelebratedMilestonesRef.current.messages = 0;
    }
    if (activityEventCount === 0) {
      lastCelebratedMilestonesRef.current.events = 0;
    }
    if (messageCount === 0 && activityEventCount === 0) {
      setEasterEggQueue((queue) => (queue.length > 0 ? [] : queue));
    }

    const getNewMilestones = (previousCount, currentCount) => {
      const milestones = ACTIVITY_MILESTONES.filter((value) => (
        value > previousCount && value <= currentCount
      ));
      if (currentCount > 1000) {
        for (let value = Math.max(2000, Math.ceil((previousCount + 1) / 1000) * 1000); value <= currentCount; value += 1000) {
          milestones.push(value);
        }
      }
      return milestones;
    };

    const newMessageMilestones = getNewMilestones(
      lastCelebratedMilestonesRef.current.messages,
      messageCount
    );
    const newEventMilestones = getNewMilestones(
      lastCelebratedMilestonesRef.current.events,
      activityEventCount
    );
    lastCelebratedMilestonesRef.current = {
      messages: Math.max(lastCelebratedMilestonesRef.current.messages, messageCount),
      events: Math.max(lastCelebratedMilestonesRef.current.events, activityEventCount)
    };

    if (newMessageMilestones.length > 0 || newEventMilestones.length > 0) {
      const chatMessages = messages.filter((message) => (
        message.type === 'text' || message.type === 'image'
      ));
      const celebrationsWithIcons = [
        ...newMessageMilestones.map((count) => ({
          kind: 'messages',
          count,
          icon: EVENT_ICONS[chatMessages[count - 1]?.type] ?? '💬'
        })),
        ...newEventMilestones.map((count) => ({
          kind: 'events',
          count,
          icon: EVENT_ICONS[eventMilestoneTypesRef.current.get(count)] ?? '✨'
        }))
      ];
      setEasterEggQueue((queue) => [
        ...queue,
        ...celebrationsWithIcons.map((celebration) => ({
          ...celebration,
          intensity: celebration.count <= 25 ? 1 : celebration.count <= 100 ? 2 : celebration.count <= 500 ? 3 : 4,
          revision: ++celebrationRevisionRef.current
        }))
      ])
    }
  }, [messages, activityEventCount, eventMilestoneTypesRef]);

  const activeCelebration = easterEggQueue[0];
  const activeCelebrationRevision = activeCelebration?.revision;
  useEffect(() => {
    if (activeCelebrationRevision === undefined) return undefined;

    const timeout = window.setTimeout(() => setEasterEggQueue((queue) => queue.slice(1)), 7800);
    return () => window.clearTimeout(timeout);
  }, [activeCelebrationRevision]);

  const activeCelebrationIntensity = activeCelebration?.intensity;
  const activeCelebrationIcon = activeCelebration?.icon;
  useEffect(() => {
    if (
      activeCelebrationIntensity === undefined
      || !activeCelebrationIcon
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    const intensity = activeCelebrationIntensity;
    const iconShape = confetti.shapeFromText({
      text: activeCelebrationIcon,
      scalar: 1.4 + intensity * 0.12
    });
    const burst = (particleRatio, options) => confetti({
      angle: options.angle,
      spread: options.spread,
      startVelocity: 34 + intensity * 6,
      decay: 0.9,
      gravity: 0.85,
      ticks: 180 + intensity * 50,
      particleCount: Math.round((18 + intensity * 18) * particleRatio),
      origin: { x: options.originX, y: 0.1 },
      colors: ['#a7f3d0', '#bfdbfe', '#fde68a', '#fbcfe8', '#ffffff'],
      scalar: 0.9 + intensity * 0.12,
      shapes: [iconShape]
    });

    burst(0.5, { angle: 60, spread: 55, originX: 0.12 });
    burst(0.5, { angle: 120, spread: 55, originX: 0.88 });
    if (intensity >= 3) {
      const secondBurst = window.setTimeout(() => {
        burst(0.35, { angle: 90, spread: 100, originX: 0.5 });
      }, 240);
      return () => window.clearTimeout(secondBurst);
    }
    return undefined;
  }, [activeCelebrationIcon, activeCelebrationIntensity, activeCelebrationRevision]);

  useEffect(() => {
    const updateHeight = () => {
      const visualViewport = window.visualViewport;
      const height = visualViewport?.height || window.innerHeight;
      const offset = visualViewport ? Math.max(0, window.innerHeight - height) : 0;

      setViewportHeight(height);
      setKeyboardOffset(offset);
    };

    const resizeHandler = () => {
      updateHeight();
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resizeHandler);
      window.visualViewport.addEventListener('scroll', resizeHandler);
    } else {
      window.addEventListener('resize', resizeHandler);
    }

    updateHeight();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', resizeHandler);
        window.visualViewport.removeEventListener('scroll', resizeHandler);
      } else {
        window.removeEventListener('resize', resizeHandler);
      }
    };
  }, []);

  const handleSendMessage = (data) => {
    sendMessage(data);
  };

  const handleTyping = () => {
    if (isUserConnected) {
      sendMessage({ type: 'typing' });
    }
  };

  const handleEndConversation = () => {
    sendMessage({ type: 'endConversation' });
  };

  const handleOpenFeedback = useCallback(() => {
    clearFeedbackStatus();
    if (isUserConnected) {
      sendMessage({ type: 'adminFeedback' });
    }
    setIsFeedbackOpen(true);
  }, [clearFeedbackStatus, isUserConnected, sendMessage]);

  const handleCloseFeedback = useCallback(() => {
    setIsFeedbackOpen(false);
    clearFeedbackStatus();
  }, [clearFeedbackStatus]);

  const handleSubmitFeedback = useCallback((feedback) => {
    sendFeedback(feedback);
  }, [sendFeedback]);

  const handleCloseDonation = useCallback(() => {
    setIsDonationOpen(false);
  }, []);

  return (
    <div
      className="anonychat-app-root fixed inset-0 flex items-center justify-center overflow-hidden bg-[#08090b] text-zinc-100 font-sans-clean"
      style={{
        height: `${viewportHeight}px`,
        paddingBottom: keyboardOffset > 0 ? 'max(0.75rem, env(safe-area-inset-bottom))' : undefined,
        paddingTop: keyboardOffset > 0 ? 'max(0.75rem, env(safe-area-inset-top))' : undefined,
        justifyContent: keyboardOffset > 0 ? 'flex-start' : 'center'
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
            radial-gradient(circle at 85% 50%, rgba(110, 231, 183, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 15% 80%, rgba(147, 197, 253, 0.03) 0%, transparent 50%)
          `
        }}
      />

      {activeCelebration && (
        <EasterEggCelebration
          key={activeCelebration.revision}
          celebration={activeCelebration}
        />
      )}

      <div className="sr-only" aria-live="polite">
        <h1>AnonyChat</h1>
        <p>Anonymous chat with strangers online, private one-to-one conversations, real-time messaging, and instant matching.</p>
        <p>Trò chuyện ẩn danh với người lạ trực tuyến, cuộc trò chuyện riêng tư theo cặp, nhắn tin thời gian thực và ghép cặp tức thì.</p>
      </div>

      <ChatContainer>
        <ChatHeader
          onlineCount={onlineCount}
          hasActiveConversation={hasActiveConversation}
          isUserConnected={isUserConnected}
          onEndConversation={handleEndConversation}
          onOpenDonation={() => setIsDonationOpen(true)}
          onGoHome={onGoHome}
        />
        <ChatLog
          messages={messages}
          isUserConnected={isUserConnected}
          onReact={sendReaction}
          onReport={handleOpenReport}
          partnerColor={partnerColor}
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onOpenAdmin={handleOpenFeedback}
          isConnected={isUserConnected}
          customBlockWords={customBlockWords}
        />
      </ChatContainer>
      {isFeedbackOpen && (
        <FeedbackModal
          status={feedbackStatus}
          onClose={handleCloseFeedback}
          onSubmit={handleSubmitFeedback}
        />
      )}
      {reportingMessage && (
        <ReportModal
          targetMessage={reportingMessage}
          status={reportStatus}
          onClose={handleCloseReport}
          onSubmit={handleSubmitReport}
        />
      )}
      {isDonationOpen && <DonationModal onClose={handleCloseDonation} />}
    </div>
  );
};


const AnonyChat = () => {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.replace(/\/+$/, '') || '/';
    }
    return '/';
  });
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.replace(/\/+$/, '') || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path.replace(/\/+$/, '') || '/');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  if (currentPath === '/admin') {
    return <AdminConsole />;
  }

  if (currentPath === '/chats') {
    return <ChatApp onGoHome={() => navigateTo('/')} />;
  }

  return (
    <>
      <LandingPage
        onStartChat={() => navigateTo('/chats')}
        onOpenDonation={() => setIsDonationOpen(true)}
      />
      {isDonationOpen && <DonationModal onClose={() => setIsDonationOpen(false)} />}
    </>
  );
};

export default AnonyChat;
