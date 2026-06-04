// Chat Service - Abstraction layer for API calls
// Switch USE_MOCK to false when backend is ready

const USE_MOCK = false;
const API_BASE_URL = '';

// ==================== MOCK DATA ====================
const MOCK_RESPONSES = [
  `Đây là phân tích chi tiêu của bạn trong năm 2026:

· Tổng số tiền đã chi: **73.000đ**
· Số giao dịch: **1**
· Trung bình chi tiêu mỗi ngày: **200đ**

Nếu bạn muốn xem chi tiết theo từng nhóm chi tiêu hoặc so sánh với năm trước, hãy cho Moni biết nhé!`,

  `Ngân sách tổng của bạn đã được thiết lập là **1.000.000đ** cho tháng này.

Hiện tại bạn đã chi tiêu **140.000đ**, còn lại **860.000đ** để sử dụng trong tháng.

Bạn muốn Moni giúp gì tiếp theo? Quản lý chi tiêu hay nhắc nhở khi gần hết ngân sách không?`,

  `Ớ kìa! Moni là trợ lý chi tiêu chứ không phải AI để bạn test độ hack nha 🤪. Gài Moni kiểu này là không chơi đẹp rồi đó!`,

  `Để lập ngân sách hiệu quả, bạn nên:

1. Xác định tổng số tiền muốn chi tiêu trong tháng **(ngân sách tổng)**.
2. Theo dõi chi tiêu thực tế và so sánh với ngân sách đã đặt ra.
3. Xem báo cáo chi tiêu để biết mình đã tiêu bao nhiêu, còn lại bao nhiêu.

Hiện tại, bạn đã sử dụng **140.000đ** trên tổng ngân sách **1.000.000đ**, còn lại **860.000đ** để chi tiêu.`,

  `Moni sẽ giúp bạn theo dõi chi tiêu hàng ngày! Dưới đây là tóm tắt:

· Chi tiêu hôm nay: **0đ**
· Chi tiêu tuần này: **35.000đ**
· Chi tiêu tháng này: **140.000đ**

Bạn đang chi tiêu rất hợp lý, tiếp tục phát huy nhé! 💪`,

  `Moni nhận thấy bạn chi tiêu nhiều nhất cho nhóm **Ăn uống** (chiếm **65%** tổng chi tiêu).

Các nhóm chi tiêu khác:
· Đi lại: **20%**
· Giải trí: **10%**
· Khác: **5%**

Bạn có muốn đặt giới hạn cho từng nhóm chi tiêu không?`,
];

let responseIndex = 0;

// ==================== MOCK IMPLEMENTATION ====================
async function mockSendMessage(message) {
  // Simulate network delay (800-1500ms)
  const delay = 800 + Math.random() * 700;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const response = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length];
  responseIndex++;

  return { text: response };
}

// ==================== REAL API IMPLEMENTATION ====================
async function realSendMessage(message, conversationHistory) {
  const response = await fetch(`${API_BASE_URL}/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: message,
      max_steps: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  // Ensure answer is a string
  const answer = typeof data.answer === 'string' ? data.answer : JSON.stringify(data.answer);
  return { text: answer };
}

// ==================== PUBLIC API ====================

/**
 * Send a message and get a response
 * @param {string} message - User's message text
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<{text: string}>}
 */
export async function sendMessage(message, conversationHistory = []) {
  if (USE_MOCK) {
    return mockSendMessage(message);
  }

  return realSendMessage(message, conversationHistory);
}

/**
 * Get the current mock mode status
 * @returns {boolean}
 */
export function isMockMode() {
  return USE_MOCK;
}
