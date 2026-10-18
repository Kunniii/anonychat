export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍'];

export const ACTIVITY_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export const PARTNER_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#f43f5e'  // rose
];

export const getRandomPartnerColor = () =>
  PARTNER_COLORS[Math.floor(Math.random() * PARTNER_COLORS.length)];

export const EVENT_ICONS = {
  text: '💬',
  image: '🖼️',
  reaction: '💟',
  typing: '⌨️',
  receipt: '📬'
};

export const getCelebrationMessage = ({ kind, count, intensity }) => {
  const messageIntros = ['Mới khởi động', 'Vào guồng rồi', 'Nhịp chat tăng tốc', 'Bùng nổ tin nhắn'];
  const eventIntros = ['Mới khởi động', 'Tăng nhịp rồi', 'Server nóng lên', 'Bùng nổ sự kiện'];
  const intro = (kind === 'messages' ? messageIntros : eventIntros)[intensity - 1];

  return kind === 'messages'
    ? `${intro} — hai bạn đã gửi ${count} tin nhắn cho nhau!`
    : `${intro} — hai bạn đã spam lên server ${count} sự kiện!`;
};
