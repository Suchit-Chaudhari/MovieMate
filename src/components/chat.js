import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import notification from "../sources/notification.mp3"; // Import the notification sound

const ChatComponent = ({ connection }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Function to play notification sound
  const playNotificationSound = () => {
    const audio = new Audio(notification);
    audio.play().catch(err => console.error("🔊 Audio play error:", err));
  };

  // Auto-scroll to bottom if user is not scrolling up
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px tolerance
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (connection) {
      console.log("🟢 Chat socket connected.");

      const messageHandler = (username, message) => {
        setMessages(prevMessages => [...prevMessages, { username, message }]);

        if (username !== localStorage.getItem("username")) {
          playNotificationSound();
        }

        setTimeout(scrollToBottom, 100); // Ensure smooth scrolling after React updates DOM
      };

      connection.on("ReceiveMessage", messageHandler);

      return () => {
        console.log("🔴 Disconnecting chat socket...");
        connection.off("ReceiveMessage", messageHandler);
      };
    }
  }, [connection]);

  useEffect(() => {
    scrollToBottom(); // Auto-scroll when messages update
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      const username = localStorage.getItem("username");
      console.log(`📤 Sending Message: ${username}: ${message}`);

      connection.invoke("SendChatMessage", username, message)
        .catch(err => console.error("⚠️ Error sending chat message:", err));

      setMessage("");
      setShowEmojiPicker(false); // Close emoji picker after sending
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
  };

  return (
    <div className="w-full max-w-lg mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="h-60 overflow-y-auto mb-4"
        style={{
          scrollbarWidth: "none", // Hide scrollbar for Firefox
          msOverflowStyle: "none", // Hide scrollbar for IE/Edge
        }}
      >
        {/* Hide scrollbar for WebKit browsers */}
        <style>
          {`
            ::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username}: </strong>
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      <div className="relative">
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-0 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* Input & Send Button */}
      <div className="flex space-x-2">
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md"
          onClick={() => setShowEmojiPicker(prev => !prev)}
        >
          😀
        </button>
        <input
          type="text"
          className="flex-grow p-2 rounded-md text-black"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
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
