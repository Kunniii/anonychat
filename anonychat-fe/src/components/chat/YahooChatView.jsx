import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { containsProfanity } from '../../profanity.js';

/**
 * Play authentic Yahoo Messenger dual-tone BUZZ sound using Web Audio API
 */
const playBuzzSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency ramp recreating the famous dual vibration of Yahoo BUZZ
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
    osc.frequency.setValueAtTime(155, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.45);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // audio permission / context disabled
  }
};

/**
 * YahooChatView - Tiệm Nét 2000s / Yahoo! Messenger Easter Egg
 * Recreates the beloved 2000s Vietnamese internet cafe experience:
 * - Purple/Violet & Metallic Silver theme
 * - Instant BUZZ!!! vibration effect with synthesized retro sound
 * - Classic emoticons and nostalgic tiệm nét status lines
 */
export const YahooChatView = ({
  messages = [],
  isUserConnected = false,
  hasActiveConversation = false,
  onlineCount = 0,
  partnerClientId = '',
  partnerColor = null,
  onSendMessage,
  onTyping,
  onEndConversation,
  onOpenReport,
  onReact,
  onToggleYahooMode,
  onToggleVietnamMode,
  customBlockWords = []
}) => {
  const [inputText, setInputText] = useState('');
  const [profanityAlert, setProfanityAlert] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [buzzCooldown, setBuzzCooldown] = useState(false);
  const [userStatus, setUserStatus] = useState('Đang cày Võ Lâm ngoài tiệm nét... ⚔️');

  const logRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const STATUS_PRESETS = [
    'Đang cày Võ Lâm ngoài tiệm nét... ⚔️',
    'Đang nghe: Ưng Hoàng Phúc - Thà Rằng Như Thế 🎵',
    'Chủ quán nét ơi nạp thêm 5k tiền giờ! ☕',
    'Đang bắn Audition - bài Vũ Điệu Hoang Dã 8k 💃',
    'Buzz một phát là bay nóc nhà ⚡'
  ];

  useLayoutEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isUserConnected]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerBuzz = () => {
    if (buzzCooldown) return;
    setIsBuzzing(true);
    setBuzzCooldown(true);
    playBuzzSound();

    // Insert local buzz notification into chat
    if (onSendMessage && isUserConnected) {
      onSendMessage({
        type: 'text',
        data: '⚡⚡⚡ [BUZZ!!!] ⚡⚡⚡',
        id: `buzz_${Date.now()}`
      });
    }

    setTimeout(() => {
      setIsBuzzing(false);
    }, 650);

    setTimeout(() => {
      setBuzzCooldown(false);
    }, 2500);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (onTyping && isUserConnected) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping();
      }, 300);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !isUserConnected) return;

    const trimmed = inputText.trim();
    const lower = trimmed.toLowerCase();

    if (lower === 'tiemnet' || lower === '/tiemnet' || lower === 'yahoo' || lower === '/yahoo') {
      setInputText('');
      if (onToggleYahooMode) onToggleYahooMode();
      return;
    }

    if (lower === 'buzz' || lower === '/buzz') {
      setInputText('');
      triggerBuzz();
      return;
    }

    const normalizedNoAccent = lower
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

    if (
      lower === 'tự hào việt nam' ||
      lower === '/tự hào việt nam' ||
      normalizedNoAccent === 'tu hao viet nam' ||
      normalizedNoAccent === '/tu hao viet nam' ||
      lower.replace(/\s+/g, '') === 'tựhàoviệtnam' ||
      normalizedNoAccent.replace(/\s+/g, '') === 'tuhaovietnam' ||
      normalizedNoAccent.replace(/\s+/g, '') === '/tuhaovietnam'
    ) {
      setInputText('');
      if (onToggleVietnamMode) onToggleVietnamMode();
      return;
    }

    setProfanityAlert('');
    if (containsProfanity(trimmed, customBlockWords)) {
      setProfanityAlert('CẢNH BÁO: Phát hiện từ ngữ vi phạm quy định.');
      return;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (onSendMessage) {
      onSendMessage({
        type: 'text',
        data: trimmed,
        id: messageId
      });
    }
    setInputText('');
  };

  const insertEmoticon = (smiley) => {
    setInputText((prev) => (prev ? `${prev} ${smiley}` : smiley));
    inputRef.current?.focus();
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isUserConnected || isProcessingImage) return;

    if (!file.type.startsWith('image/')) {
      alert('Lỗi: Tệp được chọn không phải là định dạng hình ảnh hợp lệ.');
      return;
    }

    setIsProcessingImage(true);
    try {
      const bitmap = await createImageBitmap(file);
      const longestSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, 1600 / longestSide);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        );
        if (blob && onSendMessage) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            onSendMessage({
              type: 'image',
              data: reader.result,
              id: messageId
            });
            setIsProcessingImage(false);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    } catch {
      alert('Lỗi: Không thể xử lý ảnh tải lên.');
    }
    setIsProcessingImage(false);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`yahoo-messenger-window w-full h-full max-w-4xl mx-auto flex flex-col select-text transition-transform ${
        isBuzzing ? 'animate-yahoo-buzz' : ''
      }`}
      style={{
        backgroundColor: '#ece9d8',
        fontFamily: "Tahoma, Verdana, Arial, sans-serif",
        color: '#000000',
        border: '3px solid #7a3fa0',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* ── WINDOW TITLE BAR ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 select-none"
        style={{
          background: 'linear-gradient(180deg, #7b3294 0%, #541d6b 100%)',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '12px',
          textShadow: '1px 1px 1px #000000'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-400 text-[#541d6b] flex items-center justify-center font-extrabold text-xs shadow-inner">
            Y!
          </span>
          <span className="truncate">
            Yahoo! Messenger - [Trò chuyện với: {partnerClientId ? `nguoila_${partnerClientId.slice(0, 6)}` : 'Người lạ'}]
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Thu nhỏ"
            className="w-4 h-4 rounded bg-purple-200/20 text-white flex items-center justify-center text-[10px] font-bold hover:bg-purple-200/40"
          >
            _
          </button>
          <button
            type="button"
            title="Phóng to"
            className="w-4 h-4 rounded bg-purple-200/20 text-white flex items-center justify-center text-[10px] font-bold hover:bg-purple-200/40"
          >
            □
          </button>
          <button
            type="button"
            onClick={onToggleYahooMode}
            title="Đóng giao diện Yahoo (Về hiện đại)"
            className="w-4 h-4 rounded bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-rose-500 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── MENU STRIP ── */}
      <div
        className="flex items-center justify-between px-3 py-1 border-b select-none text-xs"
        style={{
          backgroundColor: '#f1eef8',
          borderColor: '#d2c7e5',
          fontSize: '11px',
          color: '#333333'
        }}
      >
        <div className="flex items-center gap-4">
          <span className="hover:text-[#541d6b] hover:underline cursor-pointer">Messenger</span>
          <span className="hover:text-[#541d6b] hover:underline cursor-pointer">Contacts</span>
          <span className="hover:text-[#541d6b] hover:underline cursor-pointer">Actions</span>
          <span className="hover:text-[#541d6b] hover:underline cursor-pointer">Help</span>
        </div>
        <button
          type="button"
          onClick={onToggleYahooMode}
          title="Quay lại giao diện hiện đại"
          className="px-2.5 py-0.5 rounded text-[11px] font-bold text-[#541d6b] bg-white border border-[#bda6d6] hover:bg-[#541d6b] hover:text-white transition-colors cursor-pointer"
        >
          [ 🗗 Về Giao Diện Hiện Đại ]
        </button>
      </div>

      {/* ── NOSTALGIC TIỆM NÉT STATUS BAR ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b text-xs select-none"
        style={{
          backgroundColor: '#f8f6fc',
          borderColor: '#e2dbe9'
        }}
      >
        <div className="flex items-center gap-2 text-[11px] truncate flex-1 mr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-bold text-[#541d6b]">Status:</span>
          <select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value)}
            className="bg-white border border-[#c4b5d8] rounded px-1.5 py-0.5 text-[11px] text-[#333333] outline-none max-w-xs truncate cursor-pointer"
          >
            {STATUS_PRESETS.map((st, i) => (
              <option key={i} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono-clean">
          Online: {onlineCount}
        </div>
      </div>

      {/* ── CHAT LOG VIEWPORT ── */}
      <div
        ref={logRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-1.5 text-xs bg-white"
        style={{
          borderBottom: '2px solid #bda6d6',
          minHeight: '220px'
        }}
      >
        <div className="text-[11px] text-zinc-500 italic pb-2 mb-2 border-b border-zinc-200">
          *** Đã tham gia phòng chat Yahoo! Messenger Tiệm Nét 2000s ***
          <br />
          Mẹo hoài niệm: Bấm nút <strong>[ ⚡ BUZZ!!! ]</strong> để rung lắc màn hình bạn chat!
        </div>

        {messages.length === 0 ? (
          <div className="py-8 text-center text-zinc-400">
            <p className="font-bold text-[#541d6b]">
              {isUserConnected ? 'Đã kết nối với người lạ. Hãy gửi lời chào đầu tiên!' : 'Đang tìm kiếm đối tác chat ngẫu nhiên...'}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const timeStr = formatTime(msg.timestamp);

            if (msg.system) {
              return (
                <div key={idx} className="text-[#541d6b] font-bold text-[11px] py-0.5">
                  *** {msg.system} ***
                </div>
              );
            }

            if (msg.announcement) {
              return (
                <div key={idx} className="bg-amber-100 text-amber-900 p-1.5 rounded border border-amber-300 font-bold text-[11px]">
                  [THÔNG BÁO]: {msg.announcement}
                </div>
              );
            }

            if (msg.type === 'typing') {
              return (
                <div key={idx} className="text-zinc-500 italic text-[11px]">
                  Người lạ đang gõ phím cạch cạch...
                </div>
              );
            }

            const isMine = msg.isMine;
            const senderName = isMine ? 'ban_la_so_mot' : (partnerClientId ? `nguoila_${partnerClientId.slice(0, 6)}` : 'nguoi_la');
            const senderColor = isMine ? '#0033cc' : '#cc0033';
            const isBuzzMessage = typeof msg.data === 'string' && msg.data.includes('BUZZ');

            return (
              <div
                key={msg.id || idx}
                className={`py-0.5 leading-relaxed break-words ${
                  isBuzzMessage ? 'bg-amber-100/70 p-1 rounded font-bold text-amber-900' : ''
                }`}
              >
                <span className="text-zinc-400 mr-1 select-none text-[10px]">({timeStr})</span>
                <span style={{ color: senderColor, fontWeight: 'bold' }} className="mr-1.5">
                  {senderName}:
                </span>

                {msg.type === 'image' ? (
                  <div className="mt-1 inline-block">
                    <img
                      src={msg.data}
                      alt="Ảnh Yahoo gửi"
                      className="max-w-xs max-h-52 rounded border border-[#bda6d6] shadow-sm bg-white"
                    />
                    <div className="text-[10px] text-zinc-500 mt-0.5">[Tệp hình ảnh đính kèm]</div>
                  </div>
                ) : (
                  <span className="text-black whitespace-pre-wrap">{msg.data}</span>
                )}

                {/* Reaction badge */}
                <div className="inline-flex items-center gap-1 ml-2 text-[10px]">
                  {msg.reactions &&
                    Object.entries(msg.reactions).map(([type, count]) => {
                      if (!count) return null;
                      return (
                        <span key={type} className="px-1.5 rounded bg-purple-50 text-[#541d6b] border border-purple-200">
                          {type === 'heart' ? '❤️' : type === 'laugh' ? '😆' : '👍'} {count}
                        </span>
                      );
                    })}
                  {!isMine && isUserConnected && onReact && (
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onReact(msg.id, 'heart')}
                        className="hover:scale-125 transition-transform cursor-pointer"
                        title="Thả tim"
                      >
                        ❤️
                      </button>
                      <button
                        type="button"
                        onClick={() => onReact(msg.id, 'laugh')}
                        className="hover:scale-125 transition-transform cursor-pointer"
                        title="Haha"
                      >
                        😆
                      </button>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── PROFANITY ALERT ── */}
      {profanityAlert && (
        <div className="mx-2 my-1 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold rounded">
          [!] {profanityAlert}
        </div>
      )}

      {/* ── EMOTICON & TOOLBAR STRIP ── */}
      <div
        className="flex items-center justify-between px-3 py-1 border-b select-none text-xs"
        style={{
          backgroundColor: '#f1eef8',
          borderColor: '#d2c7e5'
        }}
      >
        <div className="flex items-center gap-1.5">
          {/* THE LEGENDARY BUZZ BUTTON */}
          <button
            type="button"
            onClick={triggerBuzz}
            disabled={!isUserConnected || buzzCooldown}
            className="px-3 py-1 rounded font-extrabold text-xs tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(180deg, #ffdb4d 0%, #ff9900 100%)',
              color: '#3d1c00',
              border: '1px solid #cc7a00',
              textShadow: '0 1px 0 rgba(255,255,255,0.7)'
            }}
            title="Làm rung màn hình bạn chat!"
          >
            ⚡ BUZZ!!!
          </button>

          {/* Quick Emoticons */}
          <div className="hidden sm:flex items-center gap-1 ml-2 text-sm">
            {[':)', ':D', ';-)', ':P', ':x', 'B-)'].map((em, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertEmoticon(em)}
                className="px-1.5 py-0.5 rounded hover:bg-white text-xs font-bold text-[#541d6b] cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isUserConnected || isProcessingImage}
            className="px-2 py-0.5 rounded text-[11px] bg-white border border-[#bda6d6] hover:bg-purple-50 text-zinc-700 cursor-pointer"
          >
            {isProcessingImage ? 'Đang tải...' : '📷 Gửi ảnh'}
          </button>

          {hasActiveConversation && onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="px-2 py-0.5 rounded text-[11px] bg-rose-50 border border-rose-300 text-rose-700 font-medium hover:bg-rose-100 cursor-pointer"
            >
              🛡️ Báo Cáo
            </button>
          )}

          {hasActiveConversation && onEndConversation && (
            <button
              type="button"
              onClick={onEndConversation}
              className="px-2 py-0.5 rounded text-[11px] bg-zinc-200 border border-zinc-400 text-zinc-800 font-bold hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
            >
              Rời phòng &gt;&gt;
            </button>
          )}
        </div>
      </div>

      {/* ── INPUT & SEND CONSOLE ── */}
      <form
        onSubmit={handleFormSubmit}
        className="p-2 flex gap-2 items-center"
        style={{ backgroundColor: '#f8f6fc' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          disabled={!isUserConnected}
          placeholder={isUserConnected ? 'Nhập tin nhắn (gõ "tiemnet" để đổi giao diện, gõ "buzz" để rung)...' : 'Đang đợi người lạ kết nối...'}
          className="flex-1 px-3 py-1.5 text-xs rounded border border-[#bda6d6] bg-white text-black outline-none focus:border-[#7b3294] shadow-inner"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || !isUserConnected}
          className="px-5 py-1.5 rounded font-bold text-xs text-white uppercase transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(180deg, #7b3294 0%, #541d6b 100%)',
            border: '1px solid #421355'
          }}
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

export default YahooChatView;
