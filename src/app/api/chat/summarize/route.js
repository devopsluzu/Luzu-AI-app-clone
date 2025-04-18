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
//       "Summarize the following conversation briefly and clearly:";

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


import { NextResponse } from "next/server";
import { database } from "@/firebase";
import { ref, get, set } from "firebase/database";
import Groq from "groq-sdk";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function getSecret() {
  const [version] = await client.accessSecretVersion({
    name: `projects/534452319131/secrets/GROQ_API_KEY/versions/latest`,
  });
  return version.payload.data.toString("utf8").trim();
}

export async function POST(request) {
  try {
    const { userId, chatId, messages } = await request.json();
    const apiKey = await getSecret();
    const groq = new Groq({ apiKey });

    // Generate summary
    const summaryRes = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        {
          role: "system",
          content: "Summarize the following conversation in a concise manner.",
        },
        {
          role: "user",
          content: messages.map(m => `${m.role}: ${m.content}`).join("\n"),
        },
      ],
    });

    const summary = summaryRes.choices[0].message.content;
    const summaryRef = ref(database, `summaries/${userId}/${chatId}`);
    const snapshot = await get(summaryRef);

    let queue = snapshot.exists() ? snapshot.val() : [];

    // Maintain a max length of 6
    if (queue.length >= 6) queue.shift();
    queue.push({ summary, timestamp: Date.now() });

    await set(summaryRef, queue);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error summarizing:", error);
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
  }
}
