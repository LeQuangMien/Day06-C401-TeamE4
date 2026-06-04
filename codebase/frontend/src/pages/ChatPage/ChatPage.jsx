import { useState, useCallback } from 'react';
import Header from '../../components/Header/Header';
import ChatArea from '../../components/ChatArea/ChatArea';
import ChatInput from '../../components/ChatInput/ChatInput';
import ChatHistory from '../../components/ChatHistory/ChatHistory';
import './ChatPage.css';

// Mock bot responses for demo
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

function ChatPage() {
  // All conversations: array of { id, messages, createdAt }
  const [conversations, setConversations] = useState([]);
  // Current active conversation id
  const [activeConvId, setActiveConvId] = useState(null);
  // History panel open/close
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Get current conversation's messages
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv ? activeConv.messages : [];

  const handleSendMessage = useCallback((text) => {
    const now = new Date();
    const userMsg = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text,
      timestamp: now,
    };

    setConversations((prev) => {
      // If no active conversation, create one
      if (!prev.find((c) => c.id === activeConvId)) {
        const newConv = {
          id: `conv-${Date.now()}`,
          messages: [userMsg],
          createdAt: now,
        };
        setActiveConvId(newConv.id);
        return [...prev, newConv];
      }

      // Add message to active conversation
      return prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages: [...c.messages, userMsg] }
          : c
      );
    });

    // Simulate bot reply
    setTimeout(() => {
      const botMsg = {
        id: `msg-${Date.now()}-bot`,
        type: 'bot',
        text: MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length],
        timestamp: new Date(),
      };
      responseIndex++;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId || (!activeConvId && c === prev[prev.length - 1])
            ? { ...c, messages: [...c.messages, botMsg] }
            : c
        )
      );
    }, 600);
  }, [activeConvId]);

  const handleOpenHistory = useCallback(() => {
    setIsHistoryOpen(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const handleSelectConversation = useCallback((convId) => {
    setActiveConvId(convId);
    setIsHistoryOpen(false);
  }, []);

  const handleNewConversation = useCallback(() => {
    setActiveConvId(null);
    setIsHistoryOpen(false);
  }, []);

  return (
    <div className="chat-page" id="chat-page">
      <Header />
      <ChatArea messages={messages} />
      <ChatInput
        onSendMessage={handleSendMessage}
        onOpenHistory={handleOpenHistory}
      />
      <ChatHistory
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}

export default ChatPage;
