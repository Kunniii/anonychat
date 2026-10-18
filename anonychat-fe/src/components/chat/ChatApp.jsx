import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAudio } from '../../hooks/useAudio.js';
import { useChatWebSocket } from '../../hooks/useChatWebSocket.js';
import { ACTIVITY_MILESTONES, EVENT_ICONS } from '../../constants/chat.js';
import ChatContainer from './ChatContainer.jsx';
import ChatHeader from './ChatHeader.jsx';
import ChatLog from './ChatLog.jsx';
import MessageInput from './MessageInput.jsx';
import EasterEggCelebration from './EasterEggCelebration.jsx';
import FeedbackModal from '../modals/FeedbackModal.jsx';
import ReportModal from '../modals/ReportModal.jsx';
import DonationModal from '../modals/DonationModal.jsx';
import BannedOverlay from '../modals/BannedOverlay.jsx';
import RetroChatView from './RetroChatView.jsx';
import VietnamCelebrationOverlay from './VietnamCelebrationOverlay.jsx';
import YahooChatView from './YahooChatView.jsx';

export const ChatApp = ({ onGoHome }) => {
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
    partnerColor,
    partnerClientId,
    bannedInfo,
    clearBannedInfo
  } = useChatWebSocket(playSound);

  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);

  const handleOpenReport = useCallback((messageData) => {
    setReportStatus(null);
    setReportingMessage({
      ...messageData,
      reportedClientId: messageData?.reportedClientId || partnerClientId
    });
  }, [partnerClientId]);

  const handleOpenNavReport = useCallback(() => {
    setReportStatus(null);
    setReportingMessage({
      text: '[Báo cáo hành vi người lạ trong cuộc trò chuyện]',
      reportedClientId: partnerClientId
    });
  }, [partnerClientId]);

  const handleCloseReport = useCallback(() => {
    setReportingMessage(null);
    setReportStatus(null);
  }, []);

  const handleSubmitReport = useCallback(async ({ reportedText, reason, reportedClientId }) => {
    setReportStatus({ type: 'pending', message: 'Đang gửi báo cáo…' });
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedText, reason, reportedClientId })
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
    const pageDescription =
      'AnonyChat is a free anonymous chat app for one-on-one stranger conversations and instant online messaging. Trò chuyện ẩn danh miễn phí với người lạ trực tuyến và gửi tin nhắn riêng tư ngay tức thì.';
    const pageKeywords =
      'anonymous chat, random chat, stranger chat, online chat, private chat, trò chuyện ẩn danh, chat với người lạ, chat trực tuyến, tin nhắn ẩn danh';

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
  const [isRetroMode, setIsRetroMode] = useState(false);
  const [isYahooMode, setIsYahooMode] = useState(false);
  const [isVietnamCelebrationOpen, setIsVietnamCelebrationOpen] = useState(false);
  const [isVietnamTheme, setIsVietnamTheme] = useState(false);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [easterEggQueue, setEasterEggQueue] = useState([]);
  const lastCelebratedMilestonesRef = useRef({ messages: 0, events: 0 });
  const celebrationRevisionRef = useRef(0);

  const handleToggleRetroMode = useCallback(() => {
    setIsRetroMode((prev) => !prev);
    if (isYahooMode) setIsYahooMode(false);
    playSound?.('message');
  }, [isYahooMode, playSound]);

  const handleToggleYahooMode = useCallback(() => {
    setIsYahooMode((prev) => !prev);
    if (isRetroMode) setIsRetroMode(false);
    playSound?.('message');
  }, [isRetroMode, playSound]);

  const handleToggleVietnamMode = useCallback(() => {
    setIsVietnamCelebrationOpen(true);
    setIsVietnamTheme((prev) => !prev);
    playSound?.('message');
  }, [playSound]);

  const handleBuzz = useCallback(() => {
    setIsBuzzing(true);
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.45);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}

    setTimeout(() => {
      setIsBuzzing(false);
    }, 650);
  }, []);

  useEffect(() => {
    const messageCount = messages.filter(
      (message) => message.type === 'text' || message.type === 'image'
    ).length;
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
      const milestones = ACTIVITY_MILESTONES.filter(
        (value) => value > previousCount && value <= currentCount
      );
      if (currentCount > 1000) {
        for (
          let value = Math.max(2000, Math.ceil((previousCount + 1) / 1000) * 1000);
          value <= currentCount;
          value += 1000
        ) {
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
      const chatMessages = messages.filter(
        (message) => message.type === 'text' || message.type === 'image'
      );
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
          intensity:
            celebration.count <= 25 ? 1 : celebration.count <= 100 ? 2 : celebration.count <= 500 ? 3 : 4,
          revision: ++celebrationRevisionRef.current
        }))
      ]);
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
      activeCelebrationIntensity === undefined ||
      !activeCelebrationIcon ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const intensity = activeCelebrationIntensity;
    const iconShape = confetti.shapeFromText({
      text: activeCelebrationIcon,
      scalar: 1.4 + intensity * 0.12
    });
    const burst = (particleRatio, options) =>
      confetti({
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
    window.sessionStorage.removeItem('anonychat-active-messages');
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

  const handleSubmitFeedback = useCallback(
    (feedback) => {
      sendFeedback(feedback);
    },
    [sendFeedback]
  );

  const handleCloseDonation = useCallback(() => {
    setIsDonationOpen(false);
  }, []);

  return (
    <div
      className={`anonychat-app-root fixed inset-0 flex items-center justify-center overflow-hidden font-chat-mono transition-colors duration-300 ${
        isRetroMode ? 'anonychat-retro-root text-black' : isYahooMode ? 'text-zinc-900' : 'text-zinc-100'
      } ${isBuzzing ? 'animate-yahoo-buzz' : ''}`}
      style={{
        backgroundColor: isRetroMode
          ? '#008080'
          : isYahooMode
          ? '#431952'
          : isVietnamTheme
          ? '#180407'
          : '#08090b',
        height: `${viewportHeight}px`,
        paddingBottom: keyboardOffset > 0 ? 'max(0.75rem, env(safe-area-inset-bottom))' : undefined,
        paddingTop: keyboardOffset > 0 ? 'max(0.75rem, env(safe-area-inset-top))' : undefined,
        justifyContent: keyboardOffset > 0 ? 'flex-start' : 'center'
      }}
    >
      {!isRetroMode && !isYahooMode && !isVietnamTheme && (
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
      )}

      {/* ── VIETNAM RADIAL AMBIENT GLOW ── */}
      {isVietnamTheme && !isRetroMode && !isYahooMode && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 20%, rgba(218, 37, 29, 0.4) 0%, transparent 65%)'
          }}
        />
      )}

      {activeCelebration && (
        <EasterEggCelebration
          key={activeCelebration.revision}
          celebration={activeCelebration}
        />
      )}

      <div className="sr-only" aria-live="polite">
        <h1>AnonyChat</h1>
        <p>
          Anonymous chat with strangers online, private one-to-one conversations, real-time messaging,
          and instant matching.
        </p>
        <p>
          Trò chuyện ẩn danh với người lạ trực tuyến, cuộc trò chuyện riêng tư theo cặp, nhắn tin thời
          gian thực và ghép cặp tức thì.
        </p>
      </div>

      {isRetroMode ? (
        <div className="relative z-10 w-full h-full p-0 sm:p-4 flex items-center justify-center">
          <RetroChatView
            messages={messages}
            isUserConnected={isUserConnected}
            hasActiveConversation={hasActiveConversation}
            onlineCount={onlineCount}
            partnerClientId={partnerClientId}
            partnerColor={partnerColor}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onEndConversation={handleEndConversation}
            onOpenReport={hasActiveConversation ? handleOpenNavReport : undefined}
            onReact={sendReaction}
            onToggleRetroMode={handleToggleRetroMode}
            onToggleVietnamMode={handleToggleVietnamMode}
            onToggleYahooMode={handleToggleYahooMode}
            customBlockWords={customBlockWords}
          />
        </div>
      ) : isYahooMode ? (
        <div className="relative z-10 w-full h-full p-0 sm:p-4 flex items-center justify-center">
          <YahooChatView
            messages={messages}
            isUserConnected={isUserConnected}
            hasActiveConversation={hasActiveConversation}
            onlineCount={onlineCount}
            partnerClientId={partnerClientId}
            partnerColor={partnerColor}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onEndConversation={handleEndConversation}
            onOpenReport={hasActiveConversation ? handleOpenNavReport : undefined}
            onReact={sendReaction}
            onToggleYahooMode={handleToggleYahooMode}
            onToggleVietnamMode={handleToggleVietnamMode}
            customBlockWords={customBlockWords}
          />
        </div>
      ) : (
        <ChatContainer isVietnamTheme={isVietnamTheme}>
          <ChatHeader
            onlineCount={onlineCount}
            hasActiveConversation={hasActiveConversation}
            isUserConnected={isUserConnected}
            onEndConversation={handleEndConversation}
            onOpenReport={hasActiveConversation ? handleOpenNavReport : undefined}
            onOpenDonation={() => setIsDonationOpen(true)}
            onGoHome={onGoHome}
            isVietnamTheme={isVietnamTheme}
            onToggleVietnamTheme={handleToggleVietnamMode}
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
            onToggleRetroMode={handleToggleRetroMode}
            onToggleVietnamMode={handleToggleVietnamMode}
            onToggleYahooMode={handleToggleYahooMode}
            onBuzz={handleBuzz}
            isConnected={isUserConnected}
            customBlockWords={customBlockWords}
            isVietnamTheme={isVietnamTheme}
          />
        </ChatContainer>
      )}

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
      {bannedInfo && <BannedOverlay banInfo={bannedInfo} onDismiss={clearBannedInfo} />}

      <VietnamCelebrationOverlay
        isOpen={isVietnamCelebrationOpen}
        isVietnamTheme={isVietnamTheme}
        onClose={() => setIsVietnamCelebrationOpen(false)}
        onToggleVietnamTheme={() => {
          setIsVietnamTheme((prev) => !prev);
          setIsVietnamCelebrationOpen(false);
        }}
      />
    </div>
  );
};

export default ChatApp;
