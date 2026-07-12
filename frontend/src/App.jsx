import Sidebar from "./components/Sidebar/Sidebar.jsx";
import ChatHeader from "./components/ChatHeader/ChatHeader.jsx";
import MessageList from "./components/MessageList/MessageList.jsx";
import ChatInput from "./components/ChatInput/ChatInput.jsx";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = "https://gpt-clone2-backend.onrender.com"; // Deployment insertion
function App() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastMessageRef = useRef(null);

  // Fetch initial message history on load
  async function fetchConversations() {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/chat/conversations`, //Edited for deployment
      );
      console.log("Fetched history:", data.data);
      setConversations(data.data);
    } catch (error) {
      console.error("Error fetching history:", error.message);
    }
  }

  async function handleSubmit(question) {
    if (!question.trim()) {
      return;
    }
    const tempQuestion = {
      id: Date.now(),
      content: question.trim(),
      role: "user",
      // createdAt: new Date().toISOString(),
    };
    setConversations((prev) => [...prev, tempQuestion]);
    try {
      setIsLoading(true);
      const { data } = await axios.post(
        `${API_URL}/api/chat/conversations`, //Edited for deployment
        {
          question: question.trim(),
        },
      );
      setConversations((prev) => [
        ...prev,
        // data?.data?.userConversation,
        data?.data?.assistantConversation,
      ]);
    } catch (error) {
      console.log(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, isLoading]);

  return (
    <div className="app">
      <Sidebar />
      <main className="chat">
        <ChatHeader />
        <MessageList
          lastMessageRef={lastMessageRef}
          isLoading={isLoading}
          conversations={conversations}
        />
        <ChatInput isLoading={isLoading} handleSubmit={handleSubmit} />
      </main>
    </div>
  );
}

export default App;
