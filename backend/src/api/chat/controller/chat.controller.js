import {
  createConversationService,
  getRecentConversationRows,
} from "../service/chat.service.js";

export async function createConversationController(req, res) {
  try {
    const { question } = req.body;

    // 1. Get the returned userConversation and assistantConversation from your service
    const result = await createConversationService(question);

    // 2. Return the data object containing both conversation parts to Postman
    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: result, // This should include both user and assistant conversations
    });
  } catch (error) {
    console.error("Error in createConversationController:", error);

    // 3. FIX: Safely return the error to Postman instead of letting the app hang or crash
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}

export async function getConversationController(req, res) {
  try {
    const result = await getRecentConversationRows(100);

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in getConversationController:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}
