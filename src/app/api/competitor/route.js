import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function getSecret() {
  const [version] = await client.accessSecretVersion({
    name: "projects/534452319131/secrets/GROQ_API_KEY/versions/latest",
  });
  return version.payload.data.toString().trim();
}

export async function POST(request) {
  try {
    const apiKey = await getSecret(); // Fetch API key dynamically

    // console.log("Groq API Key:", `"${apiKey}"`); // Ensure no unexpected characters

    const groq = new Groq({ apiKey });

    const { domain } = await request.json();
    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const prompt = {
      role: "system",
      content: `
        You are an SEO competitor analysis assistant. When provided with a domain, return the following details in JSON format:
        {
          "Domain Authority": "<number>",
          "Page Authority": "<number>",
          "Spam Score": "<number>",
          "Ranking Keywords": "<number>",
          "Top Keywords": [
            {
              "Keyword": "<string>",
              "Position": "<number>"
            },
                      {
              "Keyword": "<string>",
              "Position": "<number>"
            },
                      {
              "Keyword": "<string>",
              "Position": "<number>"
            },
                      {
              "Keyword": "<string>",
              "Position": "<number>"
            },
            ...
          ],
          "Top Competitors": [
            {
              "Competitor": "<string>",
              "Domain Authority": "<number>"
            },
            {
              "Competitor": "<string>",
              "Domain Authority": "<number>"
            },
            {
              "Competitor": "<string>",
              "Domain Authority": "<number>"
            },
            {
              "Competitor": "<string>",
              "Domain Authority": "<number>"
            },
            ...
          ],
          "Keyword Opportunities": [
            {
              "Keyword": "<string>",
              "Traffic Lift": "<number>"
            },
            {
              "Keyword": "<string>",
              "Traffic Lift": "<number>"
            },
            {
              "Keyword": "<string>",
              "Traffic Lift": "<number>"
            },
            {
              "Keyword": "<string>",
              "Traffic Lift": "<number>"
            },
            ...
          ]
        }
        
        Do not add any commentary or additional text. Only provide the structured JSON response exactly as shown above. Fill all fields with appropriate values for the given domain.
      `,
    };

    const userMessage = {
      role: "user",
      content: `Analyze the domain: "${domain}"`,
    };

    // Try the primary model first
    let analysisResult;
    try {
      analysisResult = await analyzeDomain(
        [prompt, userMessage],
        "gemma2-9b-it",
        groq
      );
    } catch (error) {
      console.warn("Primary model failed, switching to fallback model:", error);
      analysisResult = await analyzeDomain(
        [prompt, userMessage],
        "llama-3.3-70b-versatile",
        groq
      );
    }

    return NextResponse.json({ analysisResult });
  } catch (error) {
    console.error("Error in SEO competitor analysis API", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

// Helper function to call the Groq API with a specified model
async function analyzeDomain(messages, model, groq) {
  const chatCompletion = await groq.chat.completions.create({
    messages: messages,
    model: model,
  });

  return chatCompletion.choices[0]?.message?.content?.trim() || "No response";
}

// import { NextResponse } from "next/server";
// import OpenAI from "openai";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function POST(request) {
//   try {
//     const { domain } = await request.json();
//     if (!domain) {
//       return NextResponse.json(
//         { error: "Domain is required" },
//         { status: 400 }
//       );
//     }

//     const prompt = {
//       role: "system",
//       content: `
//         You are an SEO competitor analysis assistant. When provided with a domain, return the following details in JSON format:
//         {
//           "Domain Authority": "<number>",
//           "Page Authority": "<number>",
//           "Spam Score": "<number>",
//           "Ranking Keywords": "<number>",
//           "Top Keywords": [
//             {
//               "Keyword": "<string>",
//               "Position": "<number>"
//             },
//             {
//               "Keyword": "<string>",
//               "Position": "<number>"
//             },
//             {
//               "Keyword": "<string>",
//               "Position": "<number>"
//             },
//             {
//               "Keyword": "<string>",
//               "Position": "<number>"
//             },
//             ...
//           ],
//           "Top Competitors": [
//             {
//               "Competitor": "<string>",
//               "Domain Authority": "<number>"
//             },
//             {
//               "Competitor": "<string>",
//               "Domain Authority": "<number>"
//             },
//             {
//               "Competitor": "<string>",
//               "Domain Authority": "<number>"
//             },
//             {
//               "Competitor": "<string>",
//               "Domain Authority": "<number>"
//             },
//             ...
//           ],
//           "Keyword Opportunities": [
//             {
//               "Keyword": "<string>",
//               "Traffic Lift": "<number>"
//             },
//             {
//               "Keyword": "<string>",
//               "Traffic Lift": "<number>"
//             },
//             {
//               "Keyword": "<string>",
//               "Traffic Lift": "<number>"
//             },
//             {
//               "Keyword": "<string>",
//               "Traffic Lift": "<number>"
//             },
//             ...
//           ]
//         }

//         Do not add any commentary or additional text. Only provide the structured JSON response exactly as shown above. Fill all fields with appropriate values for the given domain.
//       `,
//     };

//     const userMessage = {
//       role: "user",
//       content: `Analyze the domain: "${domain}"`,
//     };

//     // Try the primary model first
//     let analysisResult;
//     try {
//       analysisResult = await analyzeDomain([prompt, userMessage], "gpt-4o-mini");
//     } catch (error) {
//       console.warn("Primary model failed, switching to fallback model:", error);
//       analysisResult = await analyzeDomain([prompt, userMessage], "gpt-4");
//     }

//     return NextResponse.json({ analysisResult });
//   } catch (error) {
//     console.error("Error in SEO competitor analysis API", error);
//     return NextResponse.json(
//       { error: "An error occurred while processing your request" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to call the OpenAI API with a specified model
// async function analyzeDomain(messages, model) {
//   const chatCompletion = await openai.chat.completions.create({
//     messages: messages,
//     model: model,
//   });

//   return chatCompletion.choices[0]?.message?.content?.trim() || "No response";
// }
