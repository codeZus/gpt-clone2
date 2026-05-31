import db from "../../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;
  const [rows] = await db.execute(
    `SELECT id, role, content, created_at FROM conversations ORDER BY id DESC LIMIT ${safeLimit}`,
  );
  return rows.reverse();
};

const generateAssistantAnswer = async ({ historyRows, question }) => {
  // Format history for Gemini startChat
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config:{maxOutputTokens: 1024,
      systemInstructions: `You are a helpful assistant for software developers only, who does not respond to questions outside of that scope. Answer the user's question based on the conversation history and your knowledge.`
    },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({ message: question });
  console.log("Gemini response:", result.usageMetadata);

  return {
    text: result.text,
    totalTokens: result.usageMetadata.totalTokenCount,
  };
};

const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count,created_at FROM conversations WHERE id = ? LIMIT 1",
    [messageId],
  );

  if (!rows || rows.length === 0) return null;

  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count || 0),
    createdAt: rows[0].created_at,
  };
};

export async function createConversationService(question) {
  try {
// Validation
    if (!question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

//1. get recent conversations
    const historyRows = await getRecentConversationRows(8);

    // 2. insert the user's new conversation
    const [result] = await db.execute(
      'INSERT INTO conversations (content, role) VALUES (?, "user")',
      [question],
    );

// 3. generate assistant answer using Gemini
    const { text, totalTokens } = await generateAssistantAnswer({
      historyRows,
      question,
    });

// 4. save assistant answer to DB
    const [createAssistantMessageResult] = await db.execute(
      'INSERT INTO conversations (role, content, token_count ) VALUES (?, ?, ?)',
      ['assistant', text, totalTokens],
    );

// 5. fetch and return both user and assistant conversations
    const userConversation = await getMessageById(result.insertId);
    const assistantConversation = await getMessageById(createAssistantMessageResult.insertId);

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    console.error("Error in createConversationService:", error);
    throw error;
  }
}
