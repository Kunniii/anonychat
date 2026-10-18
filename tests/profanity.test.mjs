import { containsProfanity } from '../anonychat-fe/src/profanity.js';

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🧪 RUNNING COMPREHENSIVE PROFANITY FILTER TEST SUITE');
console.log('======================================================\n');

// ── GROUP 1: False Positive Tests (Everyday normal sentences MUST NOT be flagged) ──
console.log('[GROUP 1] Testing Innocent Sentences (Must NOT trigger profanity filter)');

const innocentCases = [
  // "buổi" / "bưởi"
  'Chào bạn, chúc bạn buổi sáng tốt lành!',
  'Buổi trưa vui vẻ nha',
  'Buổi chiều mát mẻ nhé',
  'Buổi tối an lành',
  'Hôm nay mình ăn chè bưởi rất ngon',
  'Quả bưởi Năm Roi ngọt lắm',
  'Tối nay có buổi hòa nhạc hay lắm',
  'Buổi học hôm nay rất thú vị',

  // "ngủ" / "ngũ" / "ngụ"
  'Tối nay chúc bạn ngủ ngon nhé',
  'Mình đi ngủ đây, mai nói chuyện tiếp nha',
  'Buồn ngủ quá rồi',
  'Bữa sáng mình ăn ngũ cốc dinh dưỡng',
  'Truyện ngụ ngôn Ê-dốp',

  // "các"
  'Chào các bạn nhé',
  'Cảm ơn các anh chị rất nhiều',
  'Các em học bài chưa?',
  'Xin chào tất cả các bạn',
  'Các bác hàng xóm rất thân thiện',

  // "lớn" / "lon" / "lợn"
  'Cho mình xin một lon nước ngọt',
  'Uống thử một lon bia Sài Gòn nhé',
  'Món thịt lợn kho tàu mẹ nấu',
  'Khi lớn lên mình muốn làm lập trình viên',
  'Người lớn thường có nhiều nỗi lo toan',
  'Tòa nhà này to lớn thật đấy',

  // "đeo" / "đèo" / "dẻo"
  'Mình bị cận nên phải đeo kính',
  'Nhớ đeo khẩu trang khi ra ngoài đường nhé',
  'Đeo đồng hồ thông minh tiện ghê',
  'Đi qua con đèo Hải Vân cảnh đẹp lắm',
  'Bánh dẻo Trung Thu rất thơm',

  // "điện" / "diễn" / "điền" / "diện"
  'Điện thoại mình sắp hết pin rồi',
  'Diễn viên này đóng phim hay quá',
  'Bạn điền form giúp mình nha',
  'Trời nóng mà lại cúp điện',
  'Diện tích căn phòng này khá rộng',

  // "du" / "đu" / "đủ"
  'Hè này mình định đi du lịch Đà Nẵng',
  'Bạn có thích đi du học không?',
  'Ví dụ như trường hợp này thì sao?',
  'Ăn uống đầy đủ giữ gìn sức khỏe nha',
  'Đu đưa theo điệu nhạc',

  // "dài" / "đài" / "đại"
  'Con đường này dài thật',
  'Đại học Quốc Gia Hà Nội',
  'Đài truyền hình Việt Nam',
  'Bài văn dài dòng quá',

  // "vai" / "vải"
  'Bờ vai vững chắc',
  'Đóng vai trò quan trọng trong dự án',
  'Chiếc áo bằng vải cotton thoáng mát',
  'Mùa hè có quả vải thiều Lục Ngạn',

  // "cắt" / "cột" / "cụt" / "cut"
  'Hôm nay mình đi cắt tóc mới',
  'Cột tóc lên cho gọn gàng',
  'Dùng phím tắt shortcut cho nhanh',

  // "từ từ" / "con bò" / "thần kinh" / "chim cút"
  'Bạn cứ từ từ, không cần vội đâu',
  'Đàn bò đang gặm cỏ trên đồng xanh',
  'Con bò sữa rất dễ thương',
  'Khoa thần kinh bệnh viện Bạch Mai',
  'Hệ thần kinh trung ương',
  'Chim cút nướng rất thơm ngon',
  'Mình thích ăn trứng cút lộn',
  'Cụm từ này có nghĩa là gì?',
  'Cụm rạp chiếu phim CGV',
  'Đau bụng quá đi đái cái đã',
  'Mai mình đi thi đại học',
  'Bài hát này giai điệu hay quá',
  'Mình mới mua cái bàn học',
  'Bạn có biết quán phở nào ngon không?',
  'Nhà mình có nuôi một con mèo tam thể',
  'Sáng nay trời se lạnh ghê',
  'Hôm nay tôi đi làm muộn mất 5 phút',
  'Công nghệ thông tin phát triển nhanh thật',
  'Hãy kiên nhẫn một chút nhé',
  'Mình thích đọc sách khoa học viễn tưởng',
  'Anh em mình giao lưu tí nha',
  'Cho hỏi đường đi sân bay Nội Bài',
  'Học sinh cấp ba thường ôn thi vất vả',
  'Uống trà sữa trân châu đường đen',
  'Cái áo này size M vừa in',
  'Bạn sinh năm bao nhiêu thế?',
  'Nấu ăn tại nhà vừa ngon vừa sạch',
  'Chúc mừng sinh nhật bạn của tôi',
  'Chúng mình làm bạn nhé',
  'Hôm qua mình vừa xem phim rạp'
];

for (const sentence of innocentCases) {
  const flagged = containsProfanity(sentence);
  assert(!flagged, `Innocent: "${sentence}"`, flagged ? 'INCORRECTLY FLAGGED' : '');
}

// ── GROUP 2: True Positive Tests (Real toxic/swear words MUST be flagged) ──
console.log('\n[GROUP 2] Testing Vulgar & Toxic Sentences (Must BE flagged)');

const vulgarCases = [
  // Vietnamese accented
  'địt mẹ mày',
  'đ!t mẹ',
  'đụ má',
  'đụ mẹ mày',
  'thằng mặt lồn',
  'cái lồn gì vậy',
  'vãi lồn',
  'vãi cả lồn',
  'ngu vãi lồn',
  'hãm lồn',
  'ngu như con cặc',
  'đầu buồi',
  'đéo hiểu kiểu gì',
  'đéo cần nhé',
  'mày ngu như chó',
  'đồ ngu',
  'thằng ngu này',
  'thằng chó',
  'đồ chó',
  'chó má thật sự',
  'súc vật này',
  'đồ súc sinh',
  'đồ óc chó',
  'đồ khốn nạn',
  'ăn cứt đi',
  'cút đi',
  'cút xéo ngay',
  'cút ngay cho khuất mắt',
  'mày đi chết đi',
  'chết mẹ mày đi',
  'tự tử đi',
  'tự sát đi',
  'con mẹ mày',
  'mẹ kiếp thằng khốn',
  'bị điên à thằng kia',
  'thằng điên này',
  'mày ngu như bò',
  'bố mày nhịn mày lâu rồi',

  // Vietnamese unaccented / teencode / acronyms
  'dm',
  'd.m',
  'dcm',
  'd_c_m',
  'vcl',
  'v.c.l',
  'clgt',
  'c.l.g.t',
  'vkl',
  'dkm',
  'd-k-m',
  'dmm',
  'dit me may',
  'dit con me',
  'dit cu may',
  'du ma may',
  'vai lon',
  'vai cut',
  'vai ca lon',
  'an cut di',
  'cut di con cho',
  'oc cho vcl',
  'do ngu hoc',
  'thang ngu',
  'deo biet gi',
  'cai deo gi the',
  'deo can dau',
  'dau buoi',
  'con cac',
  'mut cac',
  'ngu vcl',
  'loz',
  'vlon',
  'djt me',

  // English
  'fuck you',
  'what the fuck',
  'f*ck',
  'you are a bitch',
  'asshole',
  'kill yourself',
  'kys',
  'go die',
  'shut the fuck up',
  'motherfucker',
  'dickhead'
];

for (const sentence of vulgarCases) {
  const flagged = containsProfanity(sentence);
  assert(flagged, `Vulgar: "${sentence}"`, !flagged ? 'MISSED DETECTION' : '');
}

// ── GROUP 3: Custom Block Words from Admin ──
console.log('\n[GROUP 3] Testing Admin Custom Block Words');

const customList = ['crypto-scam', 'telegram-bot'];
assert(
  containsProfanity('Join our crypto-scam now', customList),
  'Custom block word exact match'
);
assert(
  containsProfanity('Join our c.r.y.p.t.o-s.c.a.m now', customList),
  'Custom block word noise-tolerant match'
);
assert(
  !containsProfanity('Hello normal message', customList),
  'Custom block word does not flag normal text'
);

console.log('\n======================================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
