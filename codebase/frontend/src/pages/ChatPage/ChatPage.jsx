import { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../../components/Header/Header';
import ChatArea from '../../components/ChatArea/ChatArea';
import ChatInput from '../../components/ChatInput/ChatInput';
import ChatHistory from '../../components/ChatHistory/ChatHistory';
import { sendMessage } from '../../services/chatService';
import './ChatPage.css';

// localStorage key
const STORAGE_KEY = 'moni-conversations';

// Streaming speed (ms per character)
const STREAM_SPEED = 20;

function ChatPage() {
  // All conversations: array of { id, messages, createdAt }
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current active conversation id
  const [activeConvId, setActiveConvId] = useState(null);

  // History panel open/close
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Bot is "thinking" (showing typing indicator)
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Streaming state: which message is currently streaming and its displayed text
  const [streamingMsgId, setStreamingMsgId] = useState(null);
  const [streamingText, setStreamingText] = useState('');

  // Ref for streaming interval to clean up on unmount
  const streamingRef = useRef(null);

  // Get current conversation's messages
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv ? activeConv.messages : [];

  // Persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // localStorage full or unavailable - silently ignore
    }
  }, [conversations]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        clearInterval(streamingRef.current);
      }
    };
  }, []);

  // Start streaming effect for a bot message
  const startStreaming = useCallback((msgId, fullText) => {
    const text = String(fullText || '');
    setStreamingMsgId(msgId);
    setStreamingText('');

    let charIndex = 0;

    streamingRef.current = setInterval(() => {
      charIndex++;
      const partial = text.slice(0, charIndex);
      setStreamingText(partial);

      if (charIndex >= text.length) {
        clearInterval(streamingRef.current);
        streamingRef.current = null;
        setStreamingMsgId(null);
        setStreamingText('');
      }
    }, STREAM_SPEED);
  }, []);

  const handleSendMessage = useCallback((text) => {
    const now = new Date();
    const userMsg = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text,
      timestamp: now,
    };

    // Compute target conversation ID BEFORE state update
    const existingConv = conversations.find((c) => c.id === activeConvId);
    let targetConvId = activeConvId;

    if (!existingConv) {
      // Create new conversation ID upfront
      targetConvId = `conv-${Date.now()}`;
      const newConv = {
        id: targetConvId,
        messages: [userMsg],
        createdAt: now,
      };
      setActiveConvId(targetConvId);
      setConversations((prev) => [...prev, newConv]);
    } else {
      // Add message to existing conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, messages: [...c.messages, userMsg] }
            : c
        )
      );
    }

    // Show typing indicator
    setIsBotTyping(true);

    // Call chat service
    sendMessage(text)
      .then((response) => {
        setIsBotTyping(false);

        const botMsg = {
          id: `msg-${Date.now()}-bot`,
          type: 'bot',
          text: response.text,
          timestamp: new Date(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? { ...c, messages: [...c.messages, botMsg] }
              : c
          )
        );

        // Start streaming effect after a short delay
        setTimeout(() => {
          startStreaming(botMsg.id, response.text);
        }, 100);
      })
      .catch((error) => {
        console.error('Chat service error:', error);
        setIsBotTyping(false);

        const errorMsg = {
          id: `msg-${Date.now()}-err`,
          type: 'bot',
          text: 'Xin lỗi, Moni gặp lỗi khi xử lý. Bạn thử lại nhé! 😅',
          timestamp: new Date(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? { ...c, messages: [...c.messages, errorMsg] }
              : c
          )
        );
      });
  }, [activeConvId, conversations, startStreaming]);

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
      <ChatArea
        messages={messages}
        isBotTyping={isBotTyping}
        streamingMsgId={streamingMsgId}
        streamingText={streamingText}
      />
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
