import React, { useState, useEffect, useRef } from 'react';
import notification from '../sources/notification.mp3'; // Import the notification sound

const ChatComponent = ({ connection }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null); // Reference to track message container
  const chatContainerRef = useRef(null); // Reference for detecting scroll position

  // Function to play notification sound
  const playNotificationSound = () => {
    const audio = new Audio(notification);
    audio.play().catch(err => console.error("Audio play error:", err));
  };

  // Auto-scroll to bottom if user is not scrolling up
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px tolerance
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (connection) {
      const messageHandler = (username, message) => {
        setMessages((prevMessages) => [...prevMessages, { username, message }]);

        if (username !== localStorage.getItem('username')) {
          playNotificationSound();
        }

        setTimeout(scrollToBottom, 100); // Ensure smooth scrolling after React updates DOM
      };

      connection.on("ReceiveMessage", messageHandler);

      return () => {
        connection.off("ReceiveMessage", messageHandler);
      };
    }
  }, [connection]);

  const handleSendMessage = () => {
    if (message.trim() !== '') {
      const username = localStorage.getItem('username');
      connection.invoke("SendChatMessage", username, message)
        .catch((err) => console.error("Error sending chat message:", err));
      setMessage('');
      setTimeout(scrollToBottom, 100); // Scroll after sending a message
    }
  };

  return (
    <div className="w-full max-w-lg mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
      {/* Chat Messages */}
      <div ref={chatContainerRef} className="h-60 overflow-y-scroll mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username}: </strong>{msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Invisible div to scroll to */}
      </div>
      
      {/* Input & Send Button */}
      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-grow p-2 rounded-md text-black"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          onClick={handleSendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;
