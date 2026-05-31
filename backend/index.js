import dotenv from "dotenv/config";
import express from "express";
import db from "./db/db.config.js";
import cors from "cors";
import mainRouter from "./src/api/main.routes.js";
import { errorHandler } from "./src/midware/error-handler.js";

const app = express();

// CORS configuration to allow requests from the frontend
app.use(
  cors({
    origin: "http://localhost:3000", // Match your frontend URL
  }),
);

app.use(express.json());
app.use("/api", mainRouter);

//final middleware to handle errors
app.use(errorHandler);

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log("Database connected successfully.");

    app.listen(3300, (err) => {
      if (err) {
        throw err;
      }
      console.log("Server is running on port http://localhost:3300");
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
