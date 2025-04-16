import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function getSecret() {
  try {
    const [version] = await client.accessSecretVersion({
      name: "projects/534452319131/secrets/GROQ_API_KEY/versions/latest",
    });
    const apiKey = version.payload?.data?.toString().trim();
    if (!apiKey) throw new Error("Failed to retrieve valid API Key.");
    return apiKey;
  } catch (error) {
    console.error("Error fetching secret from Secret Manager:", error);
    throw new Error("API Key retrieval failed.");
  }
}

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required to generate a title" },
        { status: 400 }
      );
    }

    // Extract last 5 user messages only (ignoring system/bot messages)
    const recentMessages = messages
      .filter((msg) => msg.role === "user")
      .slice(-5)
      .map((msg) => msg.content)
      .join(" ");

    if (!recentMessages) {
      return NextResponse.json({ title: "Untitled Chat" });
    }

    // Instruction for title generation
    const instruction = `Generate a short, concise title (max 6 words) summarizing the following conversation. Only return the title without any additional text`;

    // Try the primary model first
    let title;
    try {
      title = await generateTitle(instruction, recentMessages, "gemma2-9b-it");
    } catch (error) {
      console.warn("Primary model failed, switching to fallback model:", error);
      title = await generateTitle(
        instruction,
        recentMessages,
        "llama-3.3-70b-versatile"
      );
    }

    // Ensure title is valid and formatted
    title = title.replace(/["'\n]/g, "").trim(); // Remove quotes or newlines
    if (!title || title.length > 50) title = "New Chat"; // Fallback if response is invalid

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error in title generation API:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the title" },
      { status: 500 }
    );
  }
}

// Helper function to call the Groq API with a specified model
async function generateTitle(instruction, recentMessages, model) {
  const chatCompletion = await Groq.chat.completions.create({
    messages: [
      { role: "system", content: instruction },
      { role: "user", content: recentMessages },
    ],
    model: model,
    max_tokens: 15, // Limit response length to ensure concise title
  });

  return chatCompletion.choices[0]?.message?.content?.trim() || "New Chat";
}
