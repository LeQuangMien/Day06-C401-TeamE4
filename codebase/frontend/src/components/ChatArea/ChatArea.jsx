import { useEffect, useRef } from 'react';
import BotAvatar from '../BotAvatar/BotAvatar';
import MessageBubble from '../MessageBubble/MessageBubble';
import FeedbackBar from '../FeedbackBar/FeedbackBar';
import './ChatArea.css';

function ChatArea({ messages = [] }) {
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Format timestamp: dd/mm/yyyy, HH:mm
  const formatTimestamp = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  // Check if we should show timestamp (first message or > 5 min gap)
  const shouldShowTimestamp = (index) => {
    if (index === 0) return true;
    const current = new Date(messages[index].timestamp);
    const prev = new Date(messages[index - 1].timestamp);
    return (current - prev) > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <main
      className={`chat-area ${hasMessages ? 'chat-area--has-messages' : ''}`}
      id="chat-area"
      ref={chatAreaRef}
    >
      {/* Background gradient decorations */}
      <div className="chat-area__bg-decor chat-area__bg-decor--right"></div>
      <div className="chat-area__bg-decor chat-area__bg-decor--left"></div>

      {!hasMessages ? (
        /* Welcome content */
        <div className="chat-area__welcome">
          <BotAvatar />
          <h2 className="chat-area__greeting">
            Chào Giang, mình là Trợ thủ AI
            <br />
            của riêng bạn
          </h2>
        </div>
      ) : (
        /* Messages list */
        <div className="chat-area__messages">
          {messages.map((msg, index) => (
            <div key={msg.id} className="chat-area__message-group">
              {shouldShowTimestamp(index) && (
                <div className="chat-area__timestamp">
                  {formatTimestamp(msg.timestamp)}
                </div>
              )}
              <MessageBubble message={msg} />
              {msg.type === 'bot' && (
                <FeedbackBar messageId={msg.id} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </main>
  );
}

export default ChatArea;
