import React, { useState, useEffect } from 'react';

/**
 * Tactical Industrial Brutalist Admin Console
 * Archetype: Tactical Telemetry & CRT Terminal (Dark Mode)
 * Aesthetic Directives:
 * - Rigid 90-degree geometry (strictly border-radius: 0)
 * - Monospaced dominance, high data density
 * - Tactical Color Palette: Off-black CRT (#090A0D), White Phosphor (#EAEAEA), Hazard Red (#FF2A2A), Terminal Green (#4AF626)
 * - ASCII brackets, mechanical framing, technical telemetry coordinates
 */
export const AdminConsole = () => {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [isAdminStatsLoading, setIsAdminStatsLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [reportFilter, setReportFilter] = useState('pending'); // 'pending' | 'all' | 'resolved'
  const [resolvingReportId, setResolvingReportId] = useState('');
  const [activeBlockInputs, setActiveBlockInputs] = useState({});

  // Block list state
  const [blockList, setBlockList] = useState([]);
  const [isBlockListLoading, setIsBlockListLoading] = useState(false);
  const [newBlockWord, setNewBlockWord] = useState('');

  // Ban management state
  const [bans, setBans] = useState([]);
  const [isBansLoading, setIsBansLoading] = useState(false);
  const [bansError, setBansError] = useState('');
  const [newBanClientId, setNewBanClientId] = useState('');
  const [newBanReason, setNewBanReason] = useState('Vi phạm quy định ứng dụng (Spam / Quấy rối)');
  const [newBanDurationMinutes, setNewBanDurationMinutes] = useState(60);

  // UI state
  const [copiedId, setCopiedId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);

  // Live system clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAdminStats = async (adminToken) => {
    setIsAdminStatsLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const result = await response.json();
      if (response.status === 401) setToken('');
      if (!response.ok) return;
      setAdminStats(result);
    } catch {
      // ignore
    } finally {
      setIsAdminStatsLoading(false);
    }
  };

  const loadFeedback = async (adminToken) => {
    setIsFeedbackLoading(true);
    setFeedbackError('');
    try {
      const response = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const result = await response.json();
      if (response.status === 401) setToken('');
      if (!response.ok) throw new Error(result.error || 'Không thể tải góp ý.');
      setFeedbackEntries(result.feedback || []);
    } catch (error) {
      setFeedbackError(error.message || 'Không thể kết nối tới server.');
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const loadReports = async (adminToken) => {
    setIsReportsLoading(true);
    setReportsError('');
    try {
      const response = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const result = await response.json();
      if (response.status === 401) setToken('');
      if (!response.ok) throw new Error(result.error || 'Không thể tải báo cáo.');
      setReports(result.reports || []);
    } catch (error) {
      setReportsError(error.message || 'Không thể kết nối tới server.');
    } finally {
      setIsReportsLoading(false);
    }
  };

  const loadBlockList = async (adminToken) => {
    setIsBlockListLoading(true);
    try {
      const response = await fetch('/api/admin/block-list', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const result = await response.json();
      if (response.status === 401) setToken('');
      if (!response.ok) return;
      setBlockList(result.blockList || []);
    } catch {
      // ignore
    } finally {
      setIsBlockListLoading(false);
    }
  };

  const loadBans = async (adminToken) => {
    setIsBansLoading(true);
    setBansError('');
    try {
      const response = await fetch('/api/admin/bans', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const result = await response.json();
      if (response.status === 401) setToken('');
      if (!response.ok) throw new Error(result.error || 'Không thể tải danh sách cấm.');
      setBans(result.bans || []);
    } catch (error) {
      setBansError(error.message || 'Không thể kết nối tới server.');
    } finally {
      setIsBansLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Mật khẩu admin không đúng.');

      setToken(result.token);
      setPassword('');
      setStatus({ type: 'success', message: 'SECURE_AUTH_GRANTED // SESSION_LIFETIME: 8_HOURS' });
      await Promise.all([
        loadFeedback(result.token),
        loadAdminStats(result.token),
        loadReports(result.token),
        loadBlockList(result.token),
        loadBans(result.token)
      ]);
    } catch (error) {
      setStatus({ type: 'error', message: `AUTH_REJECTED // ${error.message || 'Lỗi xác thực'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnnouncement = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !token) return;

    setIsSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: trimmedMessage })
      });
      const result = await response.json();
      if (response.status === 401) setToken('');
      if (!response.ok) throw new Error(result.error || 'Không thể gửi thông báo.');

      setMessage('');
      setStatus({
        type: 'success',
        message: `DISPATCH_CONFIRMED // BROADCASTED_TO_${result.recipientCount}_CLIENT_NODES`
      });
    } catch (error) {
      setStatus({ type: 'error', message: `DISPATCH_FAILED // ${error.message || 'Lỗi server'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBlockWord = async (wordToAdd) => {
    const word = (wordToAdd || newBlockWord).trim().toLowerCase();
    if (!word || !token) return;
    try {
      const response = await fetch('/api/admin/block-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ word })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể thêm từ.');
      setBlockList(result.blockList || []);
      setNewBlockWord('');
      setStatus({ type: 'success', message: `RULE_COMMITTED // TOKEN_BLOCKED: "${word}"` });
    } catch (error) {
      setStatus({ type: 'error', message: `RULE_REJECTED // ${error.message || 'Lỗi'}` });
    }
  };

  const handleRemoveBlockWord = async (wordToRemove) => {
    if (!wordToRemove || !token) return;
    try {
      const response = await fetch(`/api/admin/block-list/${encodeURIComponent(wordToRemove)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể xóa từ.');
      setBlockList(result.blockList || []);
      setStatus({ type: 'success', message: `RULE_REVOKED // TOKEN_UNBLOCKED: "${wordToRemove}"` });
    } catch (error) {
      setStatus({ type: 'error', message: `RULE_REVOCATION_FAILED // ${error.message || 'Lỗi'}` });
    }
  };

  const handleCreateBan = async (event) => {
    if (event) event.preventDefault();
    const trimmedClientId = newBanClientId.trim();
    if (!trimmedClientId || !token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/bans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId: trimmedClientId,
          reason: newBanReason.trim() || 'Vi phạm điều khoản dịch vụ (Spam / Quấy rối)',
          durationMinutes: Number(newBanDurationMinutes) || 60
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể áp dụng lệnh cấm.');

      setStatus({
        type: 'success',
        message: `BAN_ENFORCED // CLIENT_UUID: "${trimmedClientId}" TERMINATED & RESTRICTED (${newBanDurationMinutes}m)`
      });
      setNewBanClientId('');
      await loadBans(token);
    } catch (error) {
      setStatus({ type: 'error', message: `BAN_DISPATCH_FAILED // ${error.message || 'Lỗi hệ thống'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBan = async (clientIdToUnban) => {
    if (!clientIdToUnban || !token) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/bans/${encodeURIComponent(clientIdToUnban)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể gỡ bỏ lệnh cấm.');

      setStatus({
        type: 'success',
        message: `BAN_REVOKED // CLIENT_UUID: "${clientIdToUnban}" RESTORED`
      });
      await loadBans(token);
    } catch (error) {
      setStatus({ type: 'error', message: `UNBAN_FAILED // ${error.message || 'Lỗi hệ thống'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBanFromReport = (reportedClientId, reportReason) => {
    if (!reportedClientId) return;
    setNewBanClientId(reportedClientId);
    if (reportReason) {
      setNewBanReason(`Báo cáo vi phạm: ${reportReason}`);
    }
    const inputEl = document.getElementById('ban-client-id-input');
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputEl.focus();
    }
  };

  const handleResolveReport = async (reportId, action = 'resolved', blockWord = '') => {
    if (!reportId || !token) return;
    setResolvingReportId(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, blockWord: blockWord.trim().toLowerCase() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể xử lý báo cáo.');
      if (result.blockList) setBlockList(result.blockList);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, resolved: true, resolution: result.resolution } : r
        )
      );
      setActiveBlockInputs((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      setStatus({
        type: 'success',
        message: blockWord
          ? `INCIDENT_RESOLVED // PHRASE_SUPPRESSED: "${blockWord}"`
          : `INCIDENT_RESOLVED // TICKET_CLOSED`
      });
    } catch (error) {
      setStatus({ type: 'error', message: `RESOLUTION_ERROR // ${error.message || 'Lỗi'}` });
    } finally {
      setResolvingReportId('');
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok && response.status !== 401) {
        const result = await response.json();
        throw new Error(result.error || 'Không thể thu hồi phiên admin.');
      }
      setToken('');
      setStatus({ type: 'success', message: 'SESSION_TERMINATED // LOGOUT_COMPLETE' });
    } catch (error) {
      setToken('');
      setStatus({
        type: 'error',
        message: `SESSION_CLEARED_LOCAL // ${error.message || 'Lỗi'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const pendingReportsCount = reports.filter((r) => !r.resolved).length;
  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'pending') return !r.resolved;
    if (reportFilter === 'resolved') return r.resolved;
    return true;
  });

  const formattedUtcTime = currentTime.toISOString().replace('T', ' // ').slice(0, 22) + 'Z';

  const getRemainingTimeString = (expiresAt) => {
    if (!expiresAt) return 'PERMANENT';
    const diff = new Date(expiresAt).getTime() - currentTime.getTime();
    if (diff <= 0) return 'EXPIRED';
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#08090C] text-[#EDEDED] font-mono selection:bg-[#FF2A2A] selection:text-black tactical-grid-bg relative overflow-x-hidden">
      {/* Optional CRT scanline degradation overlay */}
      {scanlinesEnabled && (
        <div className="crt-scanlines fixed inset-0 pointer-events-none z-50 opacity-40" aria-hidden="true" />
      )}

      {/* ── TOP TELEMETRY STRIP ── */}
      <header className="border-b border-[#222834] bg-[#0C0E14] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#4AF626] animate-pulse" aria-hidden="true" />
            <span className="font-bold tracking-wider text-white">SYS_ADMIN</span>
          </div>
          <span className="text-[#3F485A]">|</span>
          <span className="text-[#8892A6] text-[11px] hidden sm:inline">ANONYCHAT TELEMETRY TERMINAL</span>
          <span className="text-[#3F485A] hidden sm:inline">|</span>
          <span className="text-[#FF2A2A] font-bold text-[10px] tracking-widest hidden md:inline">REV: 2.6.4_PROD</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="text-[#8892A6] hidden lg:flex items-center gap-1 font-mono">
            <span className="text-[#556075]">TIME:</span>
            <span className="text-[#D0D6E2]">{formattedUtcTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setScanlinesEnabled((prev) => !prev)}
            title="Toggle CRT scanlines overlay"
            className={`border px-2 py-0.5 text-[10px] tracking-wider transition-colors ${
              scanlinesEnabled
                ? 'border-[#333D4F] text-[#4AF626] bg-[#4AF626]/5'
                : 'border-[#222834] text-[#556075] hover:text-[#8892A6]'
            }`}
          >
            CRT: {scanlinesEnabled ? 'ON' : 'OFF'}
          </button>

          <a
            href="/"
            className="border border-[#2D3546] bg-[#12151D] px-2.5 py-1 text-xs text-[#C8D0DE] hover:border-[#FF2A2A] hover:text-white transition-colors"
          >
            [ &lt;&lt;&lt; EXIT_TO_CHAT ]
          </a>

          {token && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className="border border-[#FF2A2A]/40 bg-[#FF2A2A]/10 px-2.5 py-1 text-xs text-[#FF6B6B] hover:bg-[#FF2A2A] hover:text-black transition-colors font-bold disabled:opacity-40"
            >
              [ ⊗ TERMINATE_SESSION ]
            </button>
          )}
        </div>
      </header>

      {/* ── STATUS ALERT BROADCASTER ── */}
      {status && (
        <aside
          role={status.type === 'error' ? 'alert' : 'status'}
          className={`border-b px-4 py-2 text-xs flex items-center justify-between gap-2 font-mono ${
            status.type === 'error'
              ? 'border-[#FF2A2A] bg-[#FF2A2A]/15 text-[#FF6B6B]'
              : 'border-[#4AF626] bg-[#4AF626]/10 text-[#4AF626]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">{status.type === 'error' ? '[ALERT_ERR]' : '[TELEMETRY_OK]'}</span>
            <span>{status.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatus(null)}
            className="text-current hover:opacity-70 px-2 py-0.5"
            aria-label="Đóng thông báo"
          >
            [×]
          </button>
        </aside>
      )}

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        {!token ? (
          /* ══════════════════════════════════════════════════════════════
             UNAUTHENTICATED GATEWAY: INDUSTRIAL ACCESS CONTROL
             ══════════════════════════════════════════════════════════════ */
          <div className="min-h-[75vh] flex items-center justify-center">
            <section className="w-full max-w-md border-2 border-[#262C3A] bg-[#0E1017] shadow-2xl relative">
              {/* Corner crosshairs */}
              <span className="absolute -top-2 -left-2 text-[#FF2A2A] text-sm select-none" aria-hidden="true">+</span>
              <span className="absolute -top-2 -right-2 text-[#FF2A2A] text-sm select-none" aria-hidden="true">+</span>
              <span className="absolute -bottom-2 -left-2 text-[#FF2A2A] text-sm select-none" aria-hidden="true">+</span>
              <span className="absolute -bottom-2 -right-2 text-[#FF2A2A] text-sm select-none" aria-hidden="true">+</span>

              {/* Hazard header stripe */}
              <div className="h-1.5 w-full hazard-stripes" aria-hidden="true" />

              <div className="p-5 sm:p-6 border-b border-[#1E2432]">
                <div className="flex items-center justify-between text-[10px] text-[#637089] uppercase tracking-wider mb-2">
                  <span>TERMINAL_ID: SEC-NODE-01</span>
                  <span>SECURITY_LVL: 04</span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                  <span className="text-[#FF2A2A]">&gt;&gt;&gt;</span> ADMIN_CONSOLE
                </h1>
                <p className="mt-2 text-xs text-[#8E9BB0] leading-relaxed border-l-2 border-[#FF2A2A] pl-3 py-0.5">
                  RESTRICTED AREA. Yêu cầu nhập mật khẩu quản trị viên để điều khiển hệ thống, kiểm duyệt nội dung và xem telemetry.
                </p>
              </div>

              <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="admin-password" className="text-xs font-bold text-[#A8B4C7] uppercase tracking-wider">
                      PASSCODE_KEY &gt;_
                    </label>
                    <span className="text-[10px] text-[#556075]">SHA256_VERIFIED</span>
                  </div>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    placeholder="Nhập mật khẩu admin..."
                    className="w-full border border-[#2B3344] bg-[#07080B] px-3.5 py-2.5 text-sm text-white placeholder-[#454E62] outline-none focus:border-[#FF2A2A] transition-colors disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!password || isSubmitting}
                  className="w-full border border-[#FF2A2A] bg-[#FF2A2A] hover:bg-[#E61919] active:translate-y-px text-black font-extrabold uppercase py-3 text-xs tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? '[ INITIATING_HANDSHAKE... ]' : '[ INITIATE_SESSION >>> ]'}
                </button>

                <div className="pt-2 border-t border-[#1E2432] flex justify-between text-[10px] text-[#556075]">
                  <span>PORT: 3000 // HTTPS_TLS</span>
                  <span>SESSION_TTL: 8.0_HRS</span>
                </div>
              </form>
            </section>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════
             AUTHENTICATED WORKSPACE: TACTICAL TELEMETRY & OPERATIONS
             ══════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* ── SUBSTRATE 01: TELEMETRY METRIC READOUTS ── */}
            <section aria-labelledby="telemetry-readouts-title">
              <div className="border border-[#262C3A] bg-[#0D0F16]">
                <div className="border-b border-[#1E2432] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#0B0D13]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF2A2A] font-bold text-xs" aria-hidden="true">&gt;</span>
                    <h2 id="telemetry-readouts-title" className="text-xs font-bold text-white uppercase tracking-wider">
                      TELEMETRY_STATUS // LIVE_METRICS
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#637089]">AUTO_LINK: NOMINAL</span>
                    <button
                      type="button"
                      onClick={() => loadAdminStats(token)}
                      disabled={isAdminStatsLoading}
                      className="border border-[#2C3446] bg-[#12151D] px-2.5 py-1 text-[11px] text-[#BAC4D6] hover:border-[#FF2A2A] hover:text-white transition-colors disabled:opacity-40"
                    >
                      {isAdminStatsLoading ? '[ SYNCING... ]' : '[ ↺ RE-POLL ]'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E2432]">
                  {/* Gauge 1: Online Users */}
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-center text-[10px] text-[#717E96] uppercase tracking-wider">
                      <span>CH_01: ONLINE_NODES</span>
                      <span className="flex items-center gap-1 text-[#4AF626]">
                        <span className="w-1.5 h-1.5 rounded-none bg-[#4AF626]" /> LIVE
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
                        {adminStats?.onlineCount ?? '0'}
                      </span>
                      <span className="text-xs text-[#717E96]">active_sockets</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#556075]">Kết nối đồng thời thời gian thực</p>
                  </div>

                  {/* Gauge 2: Active Chat Pairs */}
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-center text-[10px] text-[#717E96] uppercase tracking-wider">
                      <span>CH_02: ACTIVE_PAIRS</span>
                      <span className="text-[#38BDF8]">LINKED</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#38BDF8] tabular-nums tracking-tight">
                        {adminStats?.activePairs ?? '0'}
                      </span>
                      <span className="text-xs text-[#717E96]">
                        [ {(adminStats?.activePairs ?? 0) * 2} nodes ]
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#556075]">Đang trong phòng trò chuyện</p>
                  </div>

                  {/* Gauge 3: Match Queue */}
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-center text-[10px] text-[#717E96] uppercase tracking-wider">
                      <span>CH_03: MATCH_QUEUE</span>
                      <span className="text-[#FFB800]">POOL</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#FFB800] tabular-nums tracking-tight">
                        {adminStats?.waitingUsers ?? '0'}
                      </span>
                      <span className="text-xs text-[#717E96]">waiting</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#556075]">Đang chờ thuật toán ghép cặp</p>
                  </div>

                  {/* Gauge 4: Incident Reports Queue */}
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-center text-[10px] text-[#717E96] uppercase tracking-wider">
                      <span>CH_04: VIOLATION_ALERTS</span>
                      {pendingReportsCount > 0 ? (
                        <span className="text-[#FF2A2A] font-bold">ATTN_REQ</span>
                      ) : (
                        <span className="text-[#4AF626]">CLEAR</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                        pendingReportsCount > 0 ? 'text-[#FF2A2A]' : 'text-white'
                      }`}>
                        {pendingReportsCount}
                      </span>
                      <span className="text-xs text-[#717E96]">pending</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#556075]">
                      {pendingReportsCount > 0 ? 'Cần xử lý báo cáo vi phạm' : 'Không có vi phạm tồn đọng'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── WORKSPACE BLUEPRINT GRID (2 COLUMNS) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ══════════════════════════════════════════════════
                 LEFT WORKSPACE COLUMN: TRANSMIT & FILTER MODULES
                 ══════════════════════════════════════════════════ */}
              <div className="space-y-6">
                {/* ── MODULE 01: SYSTEM ANNOUNCEMENT BROADCAST ── */}
                <section
                  className="border border-[#262C3A] bg-[#0E1017]"
                  aria-labelledby="broadcast-module-title"
                >
                  <div className="border-b border-[#1E2432] px-4 py-2.5 bg-[#0B0D13] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF2A2A] font-bold text-xs" aria-hidden="true">&gt;&gt;</span>
                      <h3 id="broadcast-module-title" className="text-xs font-bold text-white uppercase tracking-wider">
                        MODULE_01 // GLOBAL_ANNOUNCEMENT_BROADCAST
                      </h3>
                    </div>
                    <span className="text-[10px] text-[#637089]">SCOPE: ALL_ACTIVE_CLIENTS</span>
                  </div>

                  <form onSubmit={handleSendAnnouncement} className="p-4 sm:p-5 space-y-4">
                    <div className="text-xs text-[#8E9BB0] border-l-2 border-[#3A455A] pl-3 py-0.5">
                      Gửi tin nhắn thông báo khẩn cấp tới tất cả người dùng đang trực tuyến qua WebSocket socket.
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5 text-[11px]">
                        <label htmlFor="admin-announcement" className="text-[#A8B4C7] uppercase font-bold">
                          PAYLOAD_CONTENT &gt;_
                        </label>
                        <span className={`tabular-nums text-[10px] ${
                          message.length > 900 ? 'text-[#FF2A2A]' : 'text-[#717E96]'
                        }`}>
                          {String(message.length).padStart(4, '0')} / 1000 CHARS
                        </span>
                      </div>
                      <textarea
                        id="admin-announcement"
                        value={message}
                        onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
                        maxLength={1000}
                        rows={4}
                        required
                        disabled={isSubmitting}
                        placeholder="Nhập nội dung thông báo hệ thống..."
                        className="w-full border border-[#2B3344] bg-[#07080B] p-3 text-xs leading-relaxed text-white placeholder-[#454E62] outline-none focus:border-[#FF2A2A] transition-colors resize-y disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[10px] text-[#556075]">PRIORITY: BROADCAST_HIGH</span>
                      <button
                        type="submit"
                        disabled={!message.trim() || isSubmitting}
                        className="border border-[#FF2A2A] bg-[#FF2A2A] hover:bg-[#E61919] active:translate-y-px text-black font-extrabold uppercase px-4 py-2 text-xs tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSubmitting ? '[ TRANSMITTING... ]' : '[ TRANSMIT_BROADCAST >>> ]'}
                      </button>
                    </div>
                  </form>
                </section>

                {/* ── MODULE 02: LEXICAL FILTER ENFORCEMENT (BLOCK LIST) ── */}
                <section
                  className="border border-[#262C3A] bg-[#0E1017]"
                  aria-labelledby="blocklist-module-title"
                >
                  <div className="border-b border-[#1E2432] px-4 py-2.5 bg-[#0B0D13] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF2A2A] font-bold text-xs" aria-hidden="true">&gt;&gt;</span>
                      <h3 id="blocklist-module-title" className="text-xs font-bold text-white uppercase tracking-wider">
                        MODULE_02 // LEXICAL_FILTER_ENFORCEMENT
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#BAC4D6] tabular-nums font-bold">
                        [{blockList.length}_RULES]
                      </span>
                      <button
                        type="button"
                        onClick={() => loadBlockList(token)}
                        disabled={isBlockListLoading}
                        className="border border-[#2C3446] bg-[#12151D] px-2 py-0.5 text-[10px] text-[#BAC4D6] hover:border-[#FF2A2A] hover:text-white transition-colors disabled:opacity-40"
                      >
                        {isBlockListLoading ? '[ ... ]' : '[ ↺ ]'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    <p className="text-xs text-[#8E9BB0] border-l-2 border-[#3A455A] pl-3 py-0.5">
                      Danh sách từ khóa vi phạm tùy chỉnh. Tin nhắn chứa các từ này sẽ bị máy chủ chặn phát tán.
                    </p>

                    {/* Add keyword form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddBlockWord();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={newBlockWord}
                        onChange={(e) => setNewBlockWord(e.target.value)}
                        placeholder="Nhập từ hoặc cụm từ vi phạm cần chặn..."
                        className="flex-1 border border-[#2B3344] bg-[#07080B] px-3 py-2 text-xs text-white placeholder-[#454E62] outline-none focus:border-[#FF2A2A] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!newBlockWord.trim()}
                        className="border border-[#384257] bg-[#1B202C] hover:border-white hover:text-white text-[#BAC4D6] font-bold px-3 py-2 text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        [ + ENFORCE ]
                      </button>
                    </form>

                    {/* Keywords token catalog */}
                    <div className="border border-[#1E2432] bg-[#07080B] p-3 max-h-56 overflow-y-auto terminal-scroll">
                      {blockList.length === 0 ? (
                        <div className="text-center py-4 text-xs text-[#556075]">
                          [ -- KHÔNG CÓ TỪ CHẶN TÙY CHỈNH -- ]
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {blockList.map((word) => (
                            <div
                              key={word}
                              className="border border-[#2B3344] bg-[#11141D] px-2 py-1 text-xs text-[#D8E0EE] flex items-center gap-2 group hover:border-[#FF2A2A]/60"
                            >
                              <span className="font-mono">{word}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBlockWord(word)}
                                title={`Gỡ bỏ từ cấm "${word}"`}
                                className="text-[#637089] hover:text-[#FF2A2A] font-bold text-xs transition-colors px-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* ── MODULE 04: CLIENT UUID BAN ENFORCEMENT ── */}
                <section
                  id="ban-enforcement-section"
                  className="border border-[#262C3A] bg-[#0E1017]"
                  aria-labelledby="ban-module-title"
                >
                  <div className="border-b border-[#1E2432] px-4 py-2.5 bg-[#0B0D13] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF2A2A] font-bold text-xs" aria-hidden="true">&gt;&gt;</span>
                      <h3 id="ban-module-title" className="text-xs font-bold text-white uppercase tracking-wider">
                        MODULE_04 // CLIENT_UUID_BAN_ENFORCEMENT
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#FF6B6B] tabular-nums font-bold">
                        [{bans.length}_BANNED]
                      </span>
                      <button
                        type="button"
                        onClick={() => loadBans(token)}
                        disabled={isBansLoading}
                        className="border border-[#2C3446] bg-[#12151D] px-2 py-0.5 text-[10px] text-[#BAC4D6] hover:border-[#FF2A2A] hover:text-white transition-colors disabled:opacity-40"
                      >
                        {isBansLoading ? '[ ... ]' : '[ ↺ ]'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    <p className="text-xs text-[#8E9BB0] border-l-2 border-[#3A455A] pl-3 py-0.5">
                      Khóa quyền truy cập của máy khách qua Client UUID. Ngắt kết nối socket ngay tức thì và áp dụng màn hình đếm ngược khóa trên thiết bị người dùng.
                    </p>

                    {bansError && (
                      <div className="border border-[#FF2A2A] bg-[#FF2A2A]/10 text-[#FF6B6B] p-2.5 text-xs">
                        [BAN_FETCH_ERROR]: {bansError}
                      </div>
                    )}

                    {/* Ban Creation Form */}
                    <form onSubmit={handleCreateBan} className="space-y-3">
                      <div>
                        <label htmlFor="ban-client-id-input" className="block text-[11px] font-bold text-[#A8B4C7] uppercase mb-1">
                          TARGET_CLIENT_UUID &gt;_
                        </label>
                        <input
                          id="ban-client-id-input"
                          type="text"
                          value={newBanClientId}
                          onChange={(e) => setNewBanClientId(e.target.value.trim())}
                          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                          required
                          disabled={isSubmitting}
                          className="w-full border border-[#2B3344] bg-[#07080B] px-3 py-2 text-xs font-mono text-white placeholder-[#454E62] outline-none focus:border-[#FF2A2A] transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="ban-reason-input" className="block text-[11px] font-bold text-[#A8B4C7] uppercase mb-1">
                          REASON_FOR_RESTRICTION &gt;_
                        </label>
                        <input
                          id="ban-reason-input"
                          type="text"
                          value={newBanReason}
                          onChange={(e) => setNewBanReason(e.target.value)}
                          placeholder="Nhập lý do cấm..."
                          required
                          disabled={isSubmitting}
                          className="w-full border border-[#2B3344] bg-[#07080B] px-3 py-2 text-xs text-white placeholder-[#454E62] outline-none focus:border-[#FF2A2A] transition-colors"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-[#A8B4C7] uppercase mb-1.5">
                          RESTRICTION_DURATION:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 text-[10px] font-mono">
                          {[
                            { label: '5m', val: 5 },
                            { label: '15m', val: 15 },
                            { label: '1h', val: 60 },
                            { label: '24h', val: 1440 },
                            { label: '7d', val: 10080 },
                            { label: '30d', val: 43200 },
                            { label: '1y (Perm)', val: 525600 }
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setNewBanDurationMinutes(item.val)}
                              className={`border px-2 py-1.5 font-bold transition-colors ${
                                Number(newBanDurationMinutes) === item.val
                                  ? 'border-[#FF2A2A] bg-[#FF2A2A] text-black'
                                  : 'border-[#283042] bg-[#0D1017] text-[#BAC4D6] hover:border-[#4B566D]'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!newBanClientId.trim() || isSubmitting}
                        className="w-full border border-[#FF2A2A] bg-[#FF2A2A] hover:bg-[#E61919] active:translate-y-px text-black font-extrabold uppercase py-2 text-xs tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSubmitting ? '[ EXECUTING_BAN... ]' : '[ ⛔ ENFORCE_BAN_AND_DISCONNECT >>> ]'}
                      </button>
                    </form>

                    {/* Active Banned UUIDs catalog */}
                    <div className="pt-2 border-t border-[#1E2432]">
                      <div className="flex justify-between items-center text-[10px] text-[#637089] uppercase tracking-wider mb-2">
                        <span>ACTIVE_UUID_RESTRICTIONS:</span>
                        <span className="text-[#FF6B6B]">{bans.length} ACTIVE</span>
                      </div>

                      <div className="border border-[#1E2432] bg-[#07080B] p-3 max-h-64 overflow-y-auto terminal-scroll space-y-2">
                        {isBansLoading && bans.length === 0 ? (
                          <div className="text-center py-4 text-xs text-[#556075]">
                            [ SYNCING_BANS... ]
                          </div>
                        ) : bans.length === 0 ? (
                          <div className="text-center py-4 text-xs text-[#556075]">
                            [ -- KHÔNG CÓ CLIENT NÀO ĐANG BỊ CẤM -- ]
                          </div>
                        ) : (
                          bans.map((ban) => {
                            const isExpired =
                              ban.expiresAt && new Date(ban.expiresAt).getTime() <= currentTime.getTime();
                            const remaining = getRemainingTimeString(ban.expiresAt);

                            return (
                              <div
                                key={ban.clientId}
                                className={`border p-2.5 space-y-1.5 transition-colors ${
                                  isExpired
                                    ? 'border-[#1E2432] bg-[#090B10] opacity-60'
                                    : 'border-[#3D2024] bg-[#140C0E] hover:border-[#FF2A2A]'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="text-[#FF2A2A] font-bold">⛔</span>
                                    <span className="text-white font-bold select-all">
                                      {ban.clientId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(ban.clientId, `ban-${ban.clientId}`)}
                                      className="border border-[#2C3446] px-1.5 py-0.5 text-[9px] text-[#8E9BB0] hover:text-white"
                                    >
                                      {copiedId === `ban-${ban.clientId}` ? 'COPIED' : 'COPY'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBan(ban.clientId)}
                                      disabled={isSubmitting}
                                      className="border border-[#4AF626]/40 bg-[#4AF626]/10 hover:bg-[#4AF626] hover:text-black text-[#4AF626] font-bold px-1.5 py-0.5 text-[9px] uppercase transition-colors"
                                    >
                                      [ 🔓 UNBAN ]
                                    </button>
                                  </div>
                                </div>

                                <div className="text-[10px] text-[#FF8585] font-mono">
                                  <span className="text-[#8892A6]">REASON:</span> {ban.reason}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] text-[#637089] pt-1 border-t border-[#231518]">
                                  <span>BANNED: {new Date(ban.bannedAt).toLocaleTimeString()}</span>
                                  <span className="text-[#FFB800] font-bold font-mono">
                                    REMAINING: {remaining}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* ══════════════════════════════════════════════════
                 RIGHT WORKSPACE COLUMN: REPORTS & FEEDBACK LOGS
                 ══════════════════════════════════════════════════ */}
              <div className="space-y-6">
                {/* ── MODULE 03: INCIDENT REPORTS (VIOLATION TICKETS) ── */}
                <section
                  className="border border-[#262C3A] bg-[#0E1017]"
                  aria-labelledby="reports-module-title"
                >
                  <div className="border-b border-[#1E2432] px-4 py-2.5 bg-[#0B0D13] flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF2A2A] font-bold text-xs" aria-hidden="true">&gt;&gt;</span>
                      <h3 id="reports-module-title" className="text-xs font-bold text-white uppercase tracking-wider">
                        MODULE_03 // INCIDENT_REPORTS_DISPATCH
                      </h3>
                      {pendingReportsCount > 0 && (
                        <span className="bg-[#FF2A2A] text-black text-[10px] font-extrabold px-1.5 py-0.2 tracking-wider">
                          {pendingReportsCount}_PENDING
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => loadReports(token)}
                      disabled={isReportsLoading}
                      className="border border-[#2C3446] bg-[#12151D] px-2.5 py-1 text-[11px] text-[#BAC4D6] hover:border-[#FF2A2A] hover:text-white transition-colors disabled:opacity-40"
                    >
                      {isReportsLoading ? '[ SYNCING... ]' : '[ ↺ SYNC ]'}
                    </button>
                  </div>

                  {/* Filter Sub-nav */}
                  <div className="border-b border-[#1E2432] bg-[#08090D] px-4 py-2 flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setReportFilter('pending')}
                      className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${
                        reportFilter === 'pending'
                          ? 'border-[#FF2A2A] bg-[#FF2A2A]/10 text-[#FF2A2A]'
                          : 'border-transparent text-[#717E96] hover:text-white'
                      }`}
                    >
                      PENDING ({pendingReportsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilter('all')}
                      className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${
                        reportFilter === 'all'
                          ? 'border-white bg-white/10 text-white'
                          : 'border-transparent text-[#717E96] hover:text-white'
                      }`}
                    >
                      ALL ({reports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilter('resolved')}
                      className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${
                        reportFilter === 'resolved'
                          ? 'border-[#4AF626] bg-[#4AF626]/10 text-[#4AF626]'
                          : 'border-transparent text-[#717E96] hover:text-white'
                      }`}
                    >
                      RESOLVED ({reports.length - pendingReportsCount})
                    </button>
                  </div>

                  <div className="p-4 sm:p-5">
                    {reportsError && (
                      <div className="border border-[#FF2A2A] bg-[#FF2A2A]/10 text-[#FF6B6B] p-3 text-xs mb-3">
                        [ERROR_LOADING_REPORTS]: {reportsError}
                      </div>
                    )}

                    {!reportsError && !isReportsLoading && filteredReports.length === 0 && (
                      <div className="text-center py-8 border border-dashed border-[#1E2432] text-xs text-[#556075]">
                        {reportFilter === 'pending'
                          ? '[ -- ZERO_PENDING_INCIDENTS_DETECTED -- ]'
                          : '[ -- NO_INCIDENT_RECORDS_FOUND -- ]'}
                      </div>
                    )}

                    {filteredReports.length > 0 && (
                      <ol className="space-y-3 max-h-[30rem] overflow-y-auto terminal-scroll pr-1">
                        {filteredReports.map((report) => {
                          const isResolving = resolvingReportId === report.id;
                          const currentInput = activeBlockInputs[report.id] ?? '';

                          return (
                            <li
                              key={report.id}
                              className={`border p-3.5 space-y-2.5 transition-colors ${
                                report.resolved
                                  ? 'border-[#1E2432] bg-[#0A0C11] opacity-75'
                                  : 'border-[#2F374A] bg-[#0E1119] hover:border-[#FF2A2A]/60'
                              }`}
                            >
                              {/* Ticket Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    [TICKET #{report.id.slice(0, 8)}]
                                  </span>
                                  <span className="border border-[#FF2A2A]/50 bg-[#FF2A2A]/10 text-[#FF6B6B] px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                    {report.reason || 'VIOLATION'}
                                  </span>
                                  {report.resolved ? (
                                    <span className="border border-[#4AF626]/50 bg-[#4AF626]/10 text-[#4AF626] px-1.5 py-0.5 text-[10px] font-bold">
                                      RESOLVED
                                    </span>
                                  ) : (
                                    <span className="border border-[#FFB800]/50 bg-[#FFB800]/10 text-[#FFB800] px-1.5 py-0.5 text-[10px] font-bold animate-pulse">
                                      ACTION_REQ
                                    </span>
                                  )}
                                </div>
                                <time className="text-[10px] text-[#637089]" dateTime={report.timestamp}>
                                  {new Date(report.timestamp).toLocaleString()}
                                </time>
                              </div>

                              {/* Reported Client UUID info banner */}
                              {report.reportedClientId && (
                                <div className="border border-[#232B3D] bg-[#0A0D14] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="text-[#8892A6]">REPORTED_UUID:</span>
                                    <span className="text-[#FFB800] font-bold select-all tracking-tight">
                                      {report.reportedClientId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(report.reportedClientId, `uuid-${report.id}`)}
                                      className="border border-[#2C3446] px-1.5 py-0.5 text-[9px] text-[#8E9BB0] hover:text-white"
                                    >
                                      {copiedId === `uuid-${report.id}` ? 'COPIED' : 'COPY'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickBanFromReport(report.reportedClientId, report.reason)}
                                      className="border border-[#FF2A2A]/60 bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] hover:text-black text-[#FF6B6B] font-bold px-2 py-0.5 text-[9px] uppercase transition-colors cursor-pointer"
                                    >
                                      [ ⛔ BAN_THIS_UUID ]
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Reported Payload Box */}
                              <div className="border border-[#202636] bg-[#06070A] p-2.5">
                                <div className="flex justify-between items-center text-[10px] text-[#637089] uppercase tracking-wider mb-1">
                                  <span>INTERCEPTED_PAYLOAD:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(report.reportedText, report.id)}
                                    className="hover:text-white transition-colors"
                                  >
                                    {copiedId === report.id ? '[ COPIED! ]' : '[ COPY ]'}
                                  </button>
                                </div>
                                <p className="text-xs text-[#E0E6F0] whitespace-pre-wrap break-words font-mono select-all">
                                  {report.reportedText}
                                </p>
                              </div>

                              {/* Ticket Resolution info or Actions */}
                              {report.resolved ? (
                                <div className="text-[11px] text-[#717E96] pt-1 border-t border-[#181D29] flex flex-wrap items-center gap-2">
                                  <span>
                                    RESOLVED_AT: {new Date(report.resolution?.resolvedAt || report.timestamp).toLocaleTimeString()}
                                  </span>
                                  {report.resolution?.blockWord && (
                                    <span className="border border-[#2C3446] bg-[#12151D] px-2 py-0.5 text-[#E0E6F0] font-mono text-[10px]">
                                      BLOCKED: "{report.resolution.blockWord}"
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="pt-2 border-t border-[#1E2432] space-y-2">
                                  {activeBlockInputs[report.id] !== undefined ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="text"
                                        value={currentInput}
                                        onChange={(e) =>
                                          setActiveBlockInputs((prev) => ({
                                            ...prev,
                                            [report.id]: e.target.value
                                          }))
                                        }
                                        placeholder="Nhập từ hoặc cụm từ vi phạm để chặn..."
                                        className="flex-1 min-w-[170px] border border-[#2B3344] bg-[#07080B] px-2.5 py-1.5 text-xs text-white placeholder-[#454E62] outline-none focus:border-[#FF2A2A]"
                                      />
                                      <button
                                        type="button"
                                        disabled={!currentInput.trim() || isResolving}
                                        onClick={() =>
                                          handleResolveReport(report.id, 'blocked', currentInput.trim())
                                        }
                                        className="border border-[#FF2A2A] bg-[#FF2A2A] hover:bg-[#E61919] text-black font-extrabold px-3 py-1.5 text-xs uppercase transition-colors disabled:opacity-40 cursor-pointer"
                                      >
                                        {isResolving ? '[ ENFORCING... ]' : '[ CONFIRM_BLOCK &amp; RESOLVE ]'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveBlockInputs((prev) => {
                                            const next = { ...prev };
                                            delete next[report.id];
                                            return next;
                                          })
                                        }
                                        className="border border-[#2C3446] px-2.5 py-1.5 text-xs text-[#8E9BB0] hover:text-white"
                                      >
                                        [ CANCEL ]
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isResolving}
                                        onClick={() =>
                                          setActiveBlockInputs((prev) => ({
                                            ...prev,
                                            [report.id]:
                                              report.reportedText.length <= 40
                                                ? report.reportedText.trim()
                                                : ''
                                          }))
                                        }
                                        className="border border-[#FF2A2A]/50 bg-[#FF2A2A]/10 hover:bg-[#FF2A2A] hover:text-black text-[#FF6B6B] font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                                      >
                                        [ + BLOCK_VIOLATION_PHRASE ]
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isResolving}
                                        onClick={() => handleResolveReport(report.id, 'dismissed')}
                                        className="border border-[#2C3446] bg-[#12151D] hover:border-white hover:text-white text-[#BAC4D6] px-3 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                                      >
                                        [ DISMISS_TICKET ]
                                      </button>
                                      {report.reportedClientId && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickBanFromReport(report.reportedClientId, report.reason)}
                                          className="border border-[#FF2A2A]/60 bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] hover:text-black text-[#FF6B6B] font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                          [ ⛔ QUICK_BAN ]
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </section>

                {/* ── MODULE 05: USER COMMUNICATIONS FEEDBACK WIRE ── */}
                <section
                  className="border border-[#262C3A] bg-[#0E1017]"
                  aria-labelledby="feedback-module-title"
                >
                  <div className="border-b border-[#1E2432] px-4 py-2.5 bg-[#0B0D13] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF2A2A] font-bold text-xs" aria-hidden="true">&gt;&gt;</span>
                      <h3 id="feedback-module-title" className="text-xs font-bold text-white uppercase tracking-wider">
                        MODULE_05 // USER_DISPATCH_FEEDBACK
                      </h3>
                      <span className="text-[10px] text-[#637089]">
                        [MAX_100_LOGS]
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadFeedback(token)}
                      disabled={isFeedbackLoading}
                      className="border border-[#2C3446] bg-[#12151D] px-2.5 py-1 text-[11px] text-[#BAC4D6] hover:border-[#FF2A2A] hover:text-white transition-colors disabled:opacity-40"
                    >
                      {isFeedbackLoading ? '[ SYNCING... ]' : '[ ↺ REFRESH ]'}
                    </button>
                  </div>

                  <div className="p-4 sm:p-5">
                    {feedbackError && (
                      <div className="border border-[#FF2A2A] bg-[#FF2A2A]/10 text-[#FF6B6B] p-3 text-xs mb-3">
                        [ERROR_LOADING_FEEDBACK]: {feedbackError}
                      </div>
                    )}

                    {!feedbackError && !isFeedbackLoading && feedbackEntries.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-[#1E2432] text-xs text-[#556075]">
                        [ -- NO_USER_DISPATCHES_FOUND -- ]
                      </div>
                    )}

                    {feedbackEntries.length > 0 && (
                      <ol className="space-y-3 max-h-80 overflow-y-auto terminal-scroll pr-1">
                        {feedbackEntries.map((entry, index) => (
                          <li
                            key={`${entry.timestamp}-${index}`}
                            className="border border-[#1E2432] bg-[#090B10] p-3 space-y-1.5 hover:border-[#2F374A] transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-[#E0E6F0] flex items-center gap-1.5">
                                <span className="text-[#556075]">ORIGIN:</span>
                                <span>{entry.username || 'ANONYMOUS_USER'}</span>
                              </span>
                              <time className="text-[10px] text-[#637089]" dateTime={entry.timestamp}>
                                {new Date(entry.timestamp).toLocaleString()}
                              </time>
                            </div>
                            <p className="text-xs text-[#C8D2E2] whitespace-pre-wrap break-words leading-relaxed pl-2 border-l border-[#2B3344] font-mono">
                              {entry.feedback}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── INDUSTRIAL FOOTER ── */}
      <footer className="border-t border-[#1E2432] bg-[#07080C] px-4 py-3 mt-12 text-[10px] text-[#556075] flex flex-wrap justify-between items-center gap-3">
        <div>
          <span>TACTICAL TELEMETRY INTERFACE // ANONYCHAT CORE ENGINE</span>
        </div>
        <div className="flex items-center gap-3">
          <span>COORDINATES: SEC-01</span>
          <span>PROTOCOL: WS://ANONYCHAT/WS</span>
          <span className="text-[#717E96]">STATUS: [SECURE]</span>
        </div>
      </footer>
    </div>
  );
};

export default AdminConsole;
