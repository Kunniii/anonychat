import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { containsProfanity } from '../../profanity.js';

export const MessageInput = ({
  onSendMessage,
  onTyping,
  onOpenAdmin,
  onToggleRetroMode,
  onToggleVietnamMode,
  onToggleYahooMode,
  onBuzz,
  isConnected,
  customBlockWords = []
}) => {
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
    const trimmed = message.trim().toLowerCase();
    if (trimmed === 'oldschool' || trimmed === '/oldschool') {
      setMessage('');
      if (onToggleRetroMode) {
        onToggleRetroMode();
      }
      return;
    }

    const normalizedNoAccent = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

    if (
      trimmed === 'tự hào việt nam' ||
      trimmed === '/tự hào việt nam' ||
      normalizedNoAccent === 'tu hao viet nam' ||
      normalizedNoAccent === '/tu hao viet nam' ||
      trimmed.replace(/\s+/g, '') === 'tựhàoviệtnam' ||
      normalizedNoAccent.replace(/\s+/g, '') === 'tuhaovietnam' ||
      normalizedNoAccent.replace(/\s+/g, '') === '/tuhaovietnam'
    ) {
      setMessage('');
      if (onToggleVietnamMode) {
        onToggleVietnamMode();
      }
      return;
    }

    if (trimmed === 'tiemnet' || trimmed === '/tiemnet' || trimmed === 'yahoo' || trimmed === '/yahoo') {
      setMessage('');
      if (onToggleYahooMode) {
        onToggleYahooMode();
      }
      return;
    }

    if (trimmed === 'buzz' || trimmed === '/buzz') {
      setMessage('');
      if (onBuzz) {
        onBuzz();
      }
      return;
    }

    if (trimmed === '/admin') {
      setMessage('');
      onOpenAdmin();
      return;
    }

    setProfanityError('');
    if (containsProfanity(message, customBlockWords)) {
      setProfanityError('Tin nhắn chứa nội dung không phù hợp.');
      return;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
          (result) => (result ? resolve(result) : reject(new Error('Image encoding failed'))),
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
    const imageFile =
      imageItem?.getAsFile() ||
      Array.from(event.clipboardData.files).find((file) => file.type.startsWith('image/'));

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
    <div className="shrink-0 border-t border-white/[0.06] bg-[#0e0f14]/85 backdrop-blur-md p-4 sm:p-5">
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
          className="max-h-[140px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[15.5px] sm:text-[16px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed"
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
          className={`mt-2 px-2 text-[11px] ${
            profanityError ? 'text-rose-400' : 'text-zinc-400'
          }`}
          role={attachmentError || profanityError ? 'alert' : 'status'}
        >
          {attachmentError || profanityError || 'Đang chuẩn bị hình ảnh…'}
        </p>
      )}
    </div>
  );
};

export default MessageInput;
