import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list !== null) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <p className="chat-list__empty">
        Answer a few questions here, or upload a resume on the left, and the preview fills in as you
        go.
      </p>
    );
  }

  return (
    <ul className="chat-list" ref={listRef}>
      {messages.map((message) => (
        <li key={message.id} className={`chat-message chat-message--${message.role}`}>
          {message.text}
        </li>
      ))}
    </ul>
  );
}
