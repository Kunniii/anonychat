import { useEffect, useRef } from 'react';
import { X, Heart } from 'lucide-react';

export const DonationModal = ({ onClose }) => {
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
        <p
          id="donation-description"
          className="mx-auto mt-1.5 max-w-[17rem] text-xs leading-relaxed text-zinc-400"
        >
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

export default DonationModal;
