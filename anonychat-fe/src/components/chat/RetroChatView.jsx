import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { containsProfanity } from "../../profanity.js";

/**
 * Retro 90s Web 1.0 / Windows 95 Interface
 * Triggered via secret easter egg keyword 'oldschool'.
 * Strict 90s desktop aesthetic:
 * - Gray #c0c0c0 3D raised bevels
 * - Sunken white inputs and viewport
 * - Monospace Courier New / Lucida Console
 * - Classic Windows 95 navy title bar with _, □, X
 * - 3-panel dial-up status bar
 */
export const RetroChatView = ({
  messages = [],
  isUserConnected = false,
  hasActiveConversation = false,
  onlineCount = 0,
  partnerClientId = "",
  partnerColor = null,
  onSendMessage,
  onTyping,
  onEndConversation,
  onOpenReport,
  onReact,
  onToggleRetroMode,
  onToggleVietnamMode,
  onToggleYahooMode,
  customBlockWords = [],
}) => {
  const [inputText, setInputText] = useState("");
  const [profanityAlert, setProfanityAlert] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useLayoutEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isUserConnected]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (lower === "oldschool" || lower === "/oldschool") {
      setInputText("");
      if (onToggleRetroMode) onToggleRetroMode();
      return;
    }

    if (lower === "vietnam" || lower === "/vietnam" || lower === "vn" || lower === "/vn") {
      setInputText("");
      if (onToggleVietnamMode) onToggleVietnamMode();
      return;
    }

    if (lower === "tiemnet" || lower === "/tiemnet" || lower === "yahoo" || lower === "/yahoo") {
      setInputText("");
      if (onToggleYahooMode) onToggleYahooMode();
      return;
    }

    setProfanityAlert("");
    if (containsProfanity(trimmed, customBlockWords)) {
      setProfanityAlert("CẢNH BÁO: Phát hiện từ ngữ vi phạm quy định.");
      return;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (onSendMessage) {
      onSendMessage({
        type: "text",
        data: trimmed,
        id: messageId,
      });
    }
    setInputText("");
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isUserConnected || isProcessingImage) return;

    if (!file.type.startsWith("image/")) {
      alert("Lỗi: Tệp được chọn không phải là định dạng hình ảnh hợp lệ.");
      return;
    }

    setIsProcessingImage(true);
    try {
      const bitmap = await createImageBitmap(file);
      const longestSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, 1600 / longestSide);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.8),
        );
        if (blob && onSendMessage) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            onSendMessage({
              type: "image",
              data: reader.result,
              id: messageId,
            });
            setIsProcessingImage(false);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    } catch {
      alert("Lỗi: Không thể xử lý ảnh tải lên.");
    }
    setIsProcessingImage(false);
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className="retro-90s-window w-full h-full max-w-4xl mx-auto flex flex-col select-text"
      style={{
        backgroundColor: "#c0c0c0",
        fontFamily:
          "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
        color: "#000000",
        border: "3px solid",
        borderColor: "#ffffff #808080 #808080 #ffffff",
        boxShadow: "2px 2px 0px #000000",
        boxSizing: "border-box",
      }}
    >
      {/* ── WINDOW TITLE BAR ── */}
      <div
        className="flex items-center justify-between px-2 py-1 select-none"
        style={{
          background: "linear-gradient(90deg, #000080 0%, #1084d0 100%)",
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        <div className="flex items-center gap-2">
          <span>🗔</span>
          <span>AnonyChat 95 - [Phiên Trò Chuyện #1995-V1.0]</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Thu nhỏ"
            className="w-4 h-3.5 flex items-center justify-center font-bold text-[9px]"
            style={{
              backgroundColor: "#c0c0c0",
              color: "#000000",
              border: "1px solid",
              borderColor: "#ffffff #808080 #808080 #ffffff",
              lineHeight: "1",
              cursor: "default",
            }}
          >
            _
          </button>
          <button
            type="button"
            title="Phóng to"
            className="w-4 h-3.5 flex items-center justify-center font-bold text-[9px]"
            style={{
              backgroundColor: "#c0c0c0",
              color: "#000000",
              border: "1px solid",
              borderColor: "#ffffff #808080 #808080 #ffffff",
              lineHeight: "1",
              cursor: "default",
            }}
          >
            □
          </button>
          <button
            type="button"
            onClick={onToggleRetroMode}
            title="Đóng Retro (Về giao diện hiện đại)"
            className="w-4 h-3.5 flex items-center justify-center font-bold text-[9px]"
            style={{
              backgroundColor: "#c0c0c0",
              color: "#000000",
              border: "1px solid",
              borderColor: "#ffffff #808080 #808080 #ffffff",
              lineHeight: "1",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── MENU STRIP ── */}
      <div
        className="flex items-center justify-between px-2 py-0.5 border-b select-none text-xs"
        style={{
          backgroundColor: "#c0c0c0",
          borderColor: "#808080",
          fontSize: "11px",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">
            <u>T</u>ệp
          </span>
          <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">
            <u>S</u>ửa
          </span>
          <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">
            <u>X</u>em
          </span>
          <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">
            <u>T</u>rợ giúp
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleRetroMode}
          title="Quay lại giao diện hiện đại"
          className="px-2 py-0.5 text-[10px] font-bold text-black cursor-pointer hover:bg-white"
          style={{
            backgroundColor: "#d4d0c8",
            border: "1px solid",
            borderColor: "#ffffff #808080 #808080 #ffffff",
          }}
        >
          [ 🗗 Về Giao Diện Hiện Đại ]
        </button>
      </div>

      {/* ── RETRO NOTICE BANNER ── */}
      <div
        className="px-3 py-1 text-[11px] border-b"
        style={{
          backgroundColor: "#ffffcc",
          color: "#333300",
          borderColor: "#cccc99",
        }}
      >
        <span>
          <strong>*** ĐÃ TÌM THẤY ESTER EGG ***</strong> Bạn đang trải nghiệm
          AnonyChat giao diện Web 1.0 năm 1995. Gõ <code>oldschool</code> một
          lần nữa hoặc bấm nút trên để quay về giao diện hiện đại.
        </span>
      </div>

      {/* ── RETRO CHAT LOG (SUNKEN WHITE VIEWPORT) ── */}
      <div
        ref={logRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 text-xs"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "2px solid",
          borderColor: "#808080 #ffffff #ffffff #808080",
          boxShadow: "inset 1px 1px 0px #000000",
          margin: "4px",
          minHeight: "200px",
        }}
      >
        <div className="text-[11px] text-[#666666] border-b border-[#cccccc] pb-1 mb-2">
          [Hệ thống khởi tạo: Đang quay số modem BBS...]
          <br />
          [Tốc độ truyền: 57,600 bps | Giao thức: TCP/IP AnonySocket]
          <br />
          [Mã hóa: Văn bản thuần Web 1.0]
        </div>

        {messages.length === 0 ? (
          <div className="py-6 text-center text-[#555555]">
            <p>
              ***{" "}
              {isUserConnected
                ? "ĐÃ KẾT NỐI VỚI MÁY NGƯỜI LẠ."
                : "ĐANG TÌM KIẾM NGƯỜI LẠ TRỰC TUYẾN..."}{" "}
              ***
            </p>
            <p className="mt-1 text-[11px]">
              Nhập tin nhắn vào ô bên dưới và bấm phím [Enter].
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const timeStr = formatTime(msg.timestamp);

            if (msg.system) {
              return (
                <div
                  key={idx}
                  className="text-[#000080] font-bold text-[11px] py-0.5"
                >
                  *** {msg.system} ***
                </div>
              );
            }

            if (msg.announcement) {
              return (
                <div
                  key={idx}
                  className="bg-[#ffff99] text-[#cc0000] p-1 border border-[#999900] font-bold text-[11px]"
                >
                  [THÔNG BÁO]: {msg.announcement}
                </div>
              );
            }

            if (msg.type === "typing") {
              return (
                <div key={idx} className="text-[#666666] italic text-[11px]">
                  *** Người lạ đang gõ phím trên bàn phím... ***
                </div>
              );
            }

            const isMine = msg.isMine;
            const senderName = isMine ? "<Bạn>" : "<Người Lạ>";
            const senderColor = isMine ? "#008000" : partnerColor || "#000080";

            return (
              <div
                key={msg.id || idx}
                className="py-0.5 leading-relaxed break-words hover:bg-[#f0f0f0]"
              >
                <span className="text-[#808080] mr-1.5 select-none">
                  [{timeStr}]
                </span>
                <span
                  style={{ color: senderColor, fontWeight: "bold" }}
                  className="mr-1.5"
                >
                  {senderName}
                </span>

                {msg.type === "image" ? (
                  <div className="mt-1 inline-block">
                    <img
                      src={msg.data}
                      alt="Ảnh nhận được"
                      className="max-w-xs max-h-48 border border-black p-0.5 bg-white"
                    />
                    <div className="text-[10px] text-[#666666] mt-0.5">
                      [Tệp đính kèm]
                    </div>
                  </div>
                ) : (
                  <span className="text-black whitespace-pre-wrap">
                    {msg.data}
                  </span>
                )}

                {/* Retro reaction counter & trigger */}
                <div className="inline-flex items-center gap-1.5 ml-2 text-[10px]">
                  {msg.reactions &&
                    Object.entries(msg.reactions).map(([type, count]) => {
                      if (!count) return null;
                      return (
                        <span
                          key={type}
                          className="px-1 border border-[#999999] bg-[#eeeeee] text-[#333333]"
                        >
                          [
                          {type === "heart"
                            ? "<3"
                            : type === "laugh"
                              ? ":-D"
                              : ":)"}{" "}
                          x{count}]
                        </span>
                      );
                    })}
                  {!isMine && isUserConnected && onReact && (
                    <span className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onReact(msg.id, "heart")}
                        title="Thả tim <3"
                        className="text-[#cc0000] hover:underline cursor-pointer"
                      >
                        [&lt;3]
                      </button>
                      <button
                        type="button"
                        onClick={() => onReact(msg.id, "laugh")}
                        title="Cười :-D"
                        className="text-[#996600] hover:underline cursor-pointer"
                      >
                        [:-D]
                      </button>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── PROFANITY / ALERT BAR ── */}
      {profanityAlert && (
        <div className="mx-1 px-2 py-1 bg-[#ffcccc] border border-[#ff0000] text-[#cc0000] text-[11px] font-bold">
          [!] {profanityAlert}
        </div>
      )}

      {/* ── RETRO INPUT & CONTROL CONSOLE ── */}
      <form
        onSubmit={handleFormSubmit}
        className="p-1 space-y-1"
        style={{ backgroundColor: "#c0c0c0" }}
      >
        <div className="flex gap-1 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            disabled={!isUserConnected}
            placeholder={
              isUserConnected
                ? 'Nhập tin nhắn vào đây... (gõ "oldschool" để đổi giao diện)'
                : "Đang đợi người lạ kết nối..."
            }
            className="flex-1 px-2 py-1 text-xs outline-none"
            style={{
              backgroundColor: isUserConnected ? "#ffffff" : "#e0e0e0",
              color: "#000000",
              border: "2px solid",
              borderColor: "#808080 #ffffff #ffffff #808080",
              boxShadow: "inset 1px 1px 0px #000000",
              fontFamily: "'Courier New', Courier, monospace",
              borderRadius: 0,
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || !isUserConnected}
            className="px-3 py-1 text-xs font-bold uppercase transition-all"
            style={{
              backgroundColor: "#c0c0c0",
              color: "#000000",
              border: "2px solid",
              borderColor: "#ffffff #808080 #808080 #ffffff",
              boxShadow: "1px 1px 0px #000000",
              borderRadius: 0,
              cursor:
                isUserConnected && inputText.trim() ? "pointer" : "default",
              opacity: isUserConnected && inputText.trim() ? 1 : 0.6,
            }}
          >
            Gửi &gt;
          </button>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 text-xs">
          <div className="flex items-center gap-1">
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
              className="px-2 py-0.5 text-[11px]"
              style={{
                backgroundColor: "#c0c0c0",
                border: "1px solid",
                borderColor: "#ffffff #808080 #808080 #ffffff",
                boxShadow: "1px 1px 0px #000000",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              {isProcessingImage
                ? "[ Đang nén ảnh... ]"
                : "[ Đính Kèm Ảnh... ]"}
            </button>

            {hasActiveConversation && onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="px-2 py-0.5 text-[11px] text-[#800000] font-bold"
                style={{
                  backgroundColor: "#c0c0c0",
                  border: "1px solid",
                  borderColor: "#ffffff #808080 #808080 #ffffff",
                  boxShadow: "1px 1px 0px #000000",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                [ ! Báo Cáo Vi Phạm ! ]
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasActiveConversation && onEndConversation && (
              <button
                type="button"
                onClick={onEndConversation}
                className="px-2.5 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: "#c0c0c0",
                  color: "#990000",
                  border: "1px solid",
                  borderColor: "#ffffff #808080 #808080 #ffffff",
                  boxShadow: "1px 1px 0px #000000",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                [ Rời Phòng / Người Mới &gt;&gt; ]
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ── 3-PANEL DIAL-UP STATUS BAR ── */}
      <div
        className="flex items-center justify-between text-[10px] select-none border-t border-[#ffffff] p-0.5"
        style={{ backgroundColor: "#c0c0c0" }}
      >
        <div
          className="flex-1 px-2 py-0.5 truncate"
          style={{
            border: "1px solid",
            borderColor: "#808080 #ffffff #ffffff #808080",
            boxShadow: "inset 1px 1px 0px #000000",
          }}
        >
          {isUserConnected
            ? "TRẠNG THÁI: ĐÃ KẾT NỐI (Quay số 56.6 Kbps)"
            : "TRẠNG THÁI: ĐANG TÌM GIAO THỨC..."}
        </div>
        <div
          className="w-28 px-2 py-0.5 text-center truncate mx-0.5"
          style={{
            border: "1px solid",
            borderColor: "#808080 #ffffff #ffffff #808080",
            boxShadow: "inset 1px 1px 0px #000000",
          }}
        >
          NGƯỜI DÙNG: {onlineCount}
        </div>
        <div
          className="w-36 px-2 py-0.5 text-right truncate"
          style={{
            border: "1px solid",
            borderColor: "#808080 #ffffff #ffffff #808080",
            boxShadow: "inset 1px 1px 0px #000000",
          }}
        >
          {partnerClientId
            ? `MÃ MÁY: ${partnerClientId.slice(0, 8)}`
            : "ĐỘC LẬP"}
        </div>
      </div>
    </div>
  );
};

export default RetroChatView;
