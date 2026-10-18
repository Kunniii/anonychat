import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const REPORT_REASONS = [
  'Từ ngữ thô tục / Xúc phạm',
  'Quấy rối / Đe dọa',
  'Nội dung khiêu dâm / Đồi trụy',
  'Spam / Lừa đảo',
  'Khác'
];

export const ReportModal = ({ targetMessage, status, onClose, onSubmit }) => {
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
    const reasonText =
      selectedReason === 'Khác' && customDetail.trim()
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
            <h2
              id="report-modal-title"
              className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5"
            >
              <span>🚩</span> Báo cáo nội dung vi phạm
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Báo cáo sẽ được gửi tới admin để xử lý và cập nhật bộ lọc từ.
            </p>
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
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Nội dung bị báo cáo
          </p>
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
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selectedReason === reason ? 'bg-rose-400' : 'bg-zinc-600'
                    }`}
                  />
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
            className={`text-xs ${
              status?.type === 'error'
                ? 'text-rose-300'
                : status?.type === 'success'
                  ? 'text-emerald-300'
                  : 'text-zinc-500'
            }`}
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

export default ReportModal;
