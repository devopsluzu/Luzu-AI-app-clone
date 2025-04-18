// // app/api/chat/route.js
// import { NextResponse } from "next/server";
// import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
// import Groq from "groq-sdk";

// const client = new SecretManagerServiceClient();

// // Function to fetch API key from Google Secret Manager
// async function getSecret() {
//   const [version] = await client.accessSecretVersion({
//     name: `projects/534452319131/secrets/GROQ_API_KEY/versions/latest`,
//   });
//   const apiKey = version.payload.data.toString("utf8").trim();
//   return apiKey;
// }

// export async function POST(request) {
//   try {
//     const { message } = await request.json();
//     if (!message) {
//       return NextResponse.json(
//         { error: "Message content is required" },
//         { status: 400 }
//       );
//     }

//     // Fetch API key securely
//     const apiKey = await getSecret();
//     //  console.log("Using API Key:", JSON.stringify(apiKey));  // Check for unexpected characters
//     const groq = new Groq({ apiKey: apiKey.trim() }); // Ensure trimming
//     // Instruction for the chatbot
//     const instruction =
//       "You are an AI assistant designed to provide helpful responses. If the user asks for the AI's name, respond with 'Luzu AI.'";

//     // Try the primary model first
//     let responseMessage;
//     try {
//       responseMessage = await generateResponse(
//         groq,
//         instruction,
//         message,
//         "gemma2-9b-it"
//       );
//     } catch (error) {
//       console.warn("Primary model failed, switching to fallback model:", error);
//       responseMessage = await generateResponse(
//         groq,
//         instruction,
//         message,
//         "llama-3.3-70b-versatil"
//       );
//     }

//     return NextResponse.json({ response: responseMessage });
//   } catch (error) {
//     console.error("Error in request API:", error);
//     return NextResponse.json(
//       { error: "An error occurred while processing your request" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to call the Groq API with a specified model
// async function generateResponse(groq, instruction, message, model) {
//   try {
//     const chatCompletion = await groq.chat.completions.create({
//       model,
//       messages: [
//         { role: "system", content: instruction },
//         { role: "user", content: message },
//       ],
//     });
//     return chatCompletion.choices[0].message.content;
//   } catch (error) {
//     console.error("Error calling Groq API:", error);
//     throw error; // Rethrow to allow fallback to work
//   }
// }


// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs";
// import { ref, get, push } from "firebase/database";
// import { database } from "@/firebase";
// import Groq from "groq-sdk";
// import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// const client = new SecretManagerServiceClient();

// async function getSecret() {
//   const [version] = await client.accessSecretVersion({
//     name: `projects/534452319131/secrets/GROQ_API_KEY/versions/latest`,
//   });
//   return version.payload.data.toString("utf8").trim();
// }

// export async function POST(req) {
//   try {
//     const { userId } = auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const { message, instruction, chatId } = await req.json();
//     if (!message) {
//       return NextResponse.json({ error: "Message is required" }, { status: 400 });
//     }

//     const apiKey = await getSecret();
//     const groq = new Groq({ apiKey });

//     // Fetch past 6 summaries from Firebase
//     const summaryRef = ref(database, `summaries/${userId}/${chatId}`);
//     const summarySnap = await get(summaryRef);
//     let pastSummaries = [];

//     if (summarySnap.exists()) {
//       const queue = summarySnap.val();
//       pastSummaries = queue.map((s, i) => `Summary ${i + 1}: ${s.summary}`).join("\n");
//     }

//     // Construct the full message context
//     const messages = [
//       { role: "system", content: instruction || "You are an AI assistant designed to provide helpful responses. If the user asks for the AI's name, respond with 'Luzu AI.'" },
//       { role: "user", content: `Previous conversation summaries:\n${pastSummaries}` },
//       { role: "user", content: message },
//     ];

//     // Call Groq API with summaries
//     const chatCompletion = await groq.chat.completions.create({
//       model: "gemma2-9b-it",
//       messages,
//     });

//     const response = chatCompletion.choices[0]?.message?.content || "Sorry, no response generated.";

//     // Save to Firebase
//     const chatRef = ref(database, `users/${userId}/chats/${chatId}`);
//     await push(chatRef, { role: "user", content: message });
//     await push(chatRef, { role: "assistant", content: response });

//     return NextResponse.json({ response });
//   } catch (error) {
//     console.error("Chat error:", error);
//     return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
//   }
// }


// app/api/chat/route.js
import { NextResponse } from "next/server";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import Groq from "groq-sdk";
import { database } from "@/firebase";
import { ref, get, set } from "firebase/database";

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
    const { message, userId, chatId } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Fetch API key securely
    const apiKey = await getSecret();
    const groq = new Groq({ apiKey });

    // Fetch the past summaries from Firebase
    const summaryRef = ref(database, `summaries/${userId}/${chatId}`);
    const summarySnap = await get(summaryRef);
    let pastSummaries = [];

    if (summarySnap.exists()) {
      const queue = summarySnap.val();
      pastSummaries = queue.map((s, idx) => `Summary ${idx + 1}: ${s.summary}`).join("\n");
    }

    // Build the message list to include past summaries + user message
    const instruction = "You are an AI assistant designed to provide helpful responses. If the user asks for the AI's name, respond with 'Luzu AI.";
    const messagesToSend = [
      { role: "system", content: instruction },
      { role: "user", content: `Previous conversation summaries:\n${pastSummaries}` },
      { role: "user", content: message },
    ];

    // Attempt to generate a response from the Groq API
    let responseMessage;
    try {
      responseMessage = await generateResponse(groq, messagesToSend, "gemma2-9b-it");
    } catch (error) {
      console.warn("Primary model failed, switching to fallback model:", error);
      responseMessage = await generateResponse(groq, messagesToSend, "llama-3.3-70b-versatil");
    }

    // Save new chat message and summarize conversation
    // await saveChatToDatabase(userId, chatId, message, responseMessage);
    // await triggerSummarization(userId, chatId, [...messagesToSend, { role: "bot", content: responseMessage }]);

    return NextResponse.json({ response: responseMessage });
  } catch (error) {
    console.error("Error in request API:", error);
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 });
  }
}

// Helper function to call the Groq API with a specified model
async function generateResponse(groq, messagesToSend, model) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      model,
      messages: messagesToSend,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}

// Helper function to save chat messages to Firebase
// async function saveChatToDatabase(userId, chatId, userMessage, botMessage) {
//   const chatRef = ref(database, `chats/${userId}/${chatId}`);
//   const chatData = {
//     messages: {
//       0: {
//         role: "user",
//         content: userMessage,
//         timestamp: Date.now(),
//       },
//       1: {
//         role: "bot",
//         content: botMessage,
//         timestamp: Date.now(),
//       },
//     },
//     lastUpdated: Date.now(),
//   };

//   await set(chatRef, chatData);
// }

// Helper function to trigger conversation summarization and store in Firebase
// async function triggerSummarization(userId, chatId, messages) {
//   try {
//     await fetch("/api/summarize", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         userId,
//         chatId,
//         messages,
//       }),
//     });
//   } catch (error) {
//     console.error("Error triggering summarization:", error);
//   }
// }
