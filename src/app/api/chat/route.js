// app/api/chat/route.js
import { NextResponse } from "next/server";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import Groq from "groq-sdk";

const client = new SecretManagerServiceClient();

// Function to fetch API key from Google Secret Manager
async function getSecret() {
  const [version] = await client.accessSecretVersion({
    name: `projects/534452319131/secrets/GROQ_API_KEY/versions/latest`,
  });
  const apiKey = version.payload.data.toString("utf8").trim();
  return apiKey;
}

export async function POST(request) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Fetch API key securely
    const apiKey = await getSecret();
    //  console.log("Using API Key:", JSON.stringify(apiKey));  // Check for unexpected characters
    const groq = new Groq({ apiKey: apiKey.trim() }); // Ensure trimming
    // Instruction for the chatbot
    const instruction =
      "You are an AI assistant designed to provide helpful responses. If the user asks for the AI's name, respond with 'Luzu AI.'";

    // Try the primary model first
    let responseMessage;
    try {
      responseMessage = await generateResponse(
        groq,
        instruction,
        message,
        "gemma2-9b-it"
      );
    } catch (error) {
      console.warn("Primary model failed, switching to fallback model:", error);
      responseMessage = await generateResponse(
        groq,
        instruction,
        message,
        "llama-3.3-70b-versatil"
      );
    }

    return NextResponse.json({ response: responseMessage });
  } catch (error) {
    console.error("Error in request API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

// Helper function to call the Groq API with a specified model
async function generateResponse(groq, instruction, message, model) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: message },
      ],
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error; // Rethrow to allow fallback to work
  }
}
