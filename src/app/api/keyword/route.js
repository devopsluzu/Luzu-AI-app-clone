// import { NextResponse } from "next/server";
// import Groq from "groq-sdk";
// import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// const client = new SecretManagerServiceClient();

// async function getSecret() {
//   const [version] = await client.accessSecretVersion({
//     name: "projects/534452319131/secrets/GROQ_API_KEY/versions/latest",
//   });
//   return version.payload.data.toString().trim();
// }

// export async function POST(request) {
//   try {
//     const { keyword, country } = await request.json();
//     if (!keyword || !country) {
//       return NextResponse.json(
//         { error: "Keyword and country are required" },
//         { status: 400 }
//       );
//     }

//     const prompt = {
//       role: "system",
//       content: `
//                         You are a keyword analysis assistant. Given a keyword and country, scrape the data from the web and provide the following details in JSON format:
//                         {
//                           "Search Volume": "<number>",
//                           "Global Volume % with Countries": {
//                             "<Alpha-2 Country Code 1>": "<percentage>",
//                             "<Alpha-2 Country Code 2>": "<percentage>",
//                             "<Alpha-2 Country Code 3>": "<percentage>",
//                             "<Alpha-2 Country Code 4>": "<percentage>",
//                             "<Alpha-2 Country Code 5>": "<percentage>",
//                             "Others": "<percentage>"
//                           },
//                           "Organic CTR": "<number>",
//                           "Cost Per Click": "<number>",
//                           "Keyword Difficulty": "<number>",
//                           "Intent Categorization": "<Informational|Navigational|Commercial|Transactional>",
//                           "Top Similar Keywords": [
//                             {
//                               "Keyword": "<string>",
//                               "Volume": "<number>",
//                               "KD": "<number>",
//                               "Intent": "<Informational|Commercial|Transactional|Navigational>"
//                             },
//                             ...
//                           ]
//                         }
//                         Do not provide any additional text or explanations. Only return the structured JSON response exactly as shown above. 
//                         Fill in all fields with appropriate values for the given keyword.
//                         For the "Global Volume % with Countries" field, include the top 5 countries by search volume, and any remaining countries should be included in the "Others" category.
//                         For the "Top Similar Keywords" field, provide at least 10 similar keywords with their respective details.
//                     `,
//     };

//     const userMessage = {
//       role: "user",
//       content: `Analyze the keyword: "${keyword}" for the country: "${country}"`,
//     };

//     // Try the primary model first
//     let analysisResult;
//     try {
//       analysisResult = await analyzeKeyword(
//         [prompt, userMessage],
//         "gemma2-9b-it"
//       );
//     } catch (error) {
//       console.warn("Primary model failed, switching to fallback model:", error);
//       analysisResult = await analyzeKeyword(
//         [prompt, userMessage],
//         "llama-3.3-70b-versatile"
//       );
//     }

//     return NextResponse.json({ analysisResult });
//   } catch (error) {
//     console.error("Error in keyword analysis API", error);
//     return NextResponse.json(
//       { error: "An error occurred while processing your request" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to call the Groq API with a specified model
// async function analyzeKeyword(messages, model) {
//   const chatCompletion = await groq.chat.completions.create({
//     messages: messages,
//     model: model,
//   });

//   return chatCompletion.choices[0]?.message?.content?.trim() || "No response";
// }


import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function getSecret() {
  const [version] = await client.accessSecretVersion({
    name: `projects/534452319131/secrets/GROQ_API_KEY/versions/latest`,
  });
  const apiKey = version.payload.data.toString("utf8").trim();
  return apiKey;
}

export async function POST(request) {
  try {

    const apiKey = await getSecret(); // Fetch API key dynamically
    // console.log(apiKey)
    const groq = new Groq({ apiKey: apiKey.trim()});

    const { keyword, country } = await request.json();
    if (!keyword || !country) {
      return NextResponse.json(
        { error: "Keyword and country are required" },
        { status: 400 }
      );
    }

    const prompt = {
                    role: "system",
                    content: `
                        You are a keyword analysis assistant. Given a keyword and country, scrape the data from the web and provide the following details in JSON format:
                        {
                          "Search Volume": "<number>",
                          "Global Volume % with Countries": {
                            "<Alpha-2 Country Code 1>": "<percentage>",
                            "<Alpha-2 Country Code 2>": "<percentage>",
                            "<Alpha-2 Country Code 3>": "<percentage>",
                            "<Alpha-2 Country Code 4>": "<percentage>",
                            "<Alpha-2 Country Code 5>": "<percentage>",
                            "Others": "<percentage>"
                          },
                          "Organic CTR": "<number>",
                          "Cost Per Click": "<number>",
                          "Keyword Difficulty": "<number>",
                          "Intent Categorization": "<Informational|Navigational|Commercial|Transactional>",
                          "Top Similar Keywords": [
                            {
                              "Keyword": "<string>",
                              "Volume": "<number>",
                              "KD": "<number>",
                              "Intent": "<Informational|Commercial|Transactional|Navigational>"
                            },
                            ...
                          ]
                        }
                        Do not provide any additional text or explanations. Only return the structured JSON response exactly as shown above. 
                        Fill in all fields with appropriate values for the given keyword.
                        For the "Global Volume % with Countries" field, include the top 5 countries by search volume, and any remaining countries should be included in the "Others" category.
                        For the "Top Similar Keywords" field, provide at least 10 similar keywords with their respective details.
                    `,
                };
                
        
    const userMessage = {
      role: "user",
      content: `Analyze the keyword: "${keyword}" for the country: "${country}"`,
    };

    // Try the primary model first
    let analysisResult;
    try {
      analysisResult = await analyzeKeyword([prompt, userMessage], "gemma2-9b-it",groq);
    } catch (error) {
      console.warn("Primary model failed, switching to fallback model:", error);
      analysisResult = await analyzeKeyword([prompt, userMessage], "llama-3.3-70b-versatile",groq);
    }

    return NextResponse.json({ analysisResult });
  } catch (error) {
    console.error("Error in keyword analysis API", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

// Helper function to call the Groq API with a specified model
async function analyzeKeyword(messages, model,groq) {
  const chatCompletion = await groq.chat.completions.create({
    messages: messages,
    model: model,
  });

  return chatCompletion.choices[0]?.message?.content?.trim() || "No response";
}