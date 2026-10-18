import { useRef, useLayoutEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import SystemMessage from './SystemMessage.jsx';
import TypingBubble from './TypingBubble.jsx';
import ChatMessage from './ChatMessage.jsx';

export const ChatLog = ({ messages, isUserConnected, onReact, onReport, partnerColor }) => {
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
      className="relative min-h-0 flex-1 overflow-y-auto bg-transparent p-4 sm:p-6"
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
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight">
              {isUserConnected ? 'Đã kết nối với người lạ' : 'Đang tìm kiếm người trò chuyện…'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
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
                  <SystemMessage
                    message={{
                      system: `[ADMIN] ${msg.announcement}`,
                      timestamp: msg.timestamp
                    }}
                  />
                  <SystemMessage
                    message={{
                      system:
                        'Admin chỉ gửi thông báo này và không thể biết bạn đang nhắn gì.',
                      timestamp: msg.timestamp
                    }}
                  />
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

export default ChatLog;
