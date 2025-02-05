import React, { useState, useEffect } from 'react';

const ChatComponent = ({ connection }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  // Listen for new messages
  useEffect(() => {
    if (connection) {
      // This ensures that the event listener is only added once
      const messageHandler = (username, message) => {
        setMessages((prevMessages) => [...prevMessages, { username, message }]);
      };

      connection.on("ReceiveMessage", messageHandler);

      // Cleanup the listener on component unmount or when connection changes
      return () => {
        connection.off("ReceiveMessage", messageHandler); // Removes the event listener
      };
    }
  }, [connection]);

  const handleSendMessage = () => {
    if (message.trim() !== '') {
      const username = localStorage.getItem('username');
      connection.invoke("SendChatMessage", username, message)
        .catch((err) => console.error("Error sending chat message:", err));
      setMessage('');
    }
  };

  return (
    <div className="w-full max-w-lg mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="h-60 overflow-y-scroll mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username}: </strong>{msg.message}
          </div>
        ))}
      </div>
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
