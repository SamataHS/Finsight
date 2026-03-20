import axios from "axios";

// Call Groq API for AI responses
export async function callGroq(prompt, temperature = 0.3) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn("⚠ GROQ_API_KEY is not set in environment variables.");
      throw new Error("GROQ_API_KEY not configured");
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content;
    console.log("✅ Groq response received");
    return result;
  } catch (error) {
    console.error("❌ Groq API error:", error.response?.data || error.message);
    throw error;
  }
}

// Extract transactions from text (for CSV/OCR)
export async function extractTransactionsFromText(text) {
  const prompt = `Extract all financial transactions from the following text. For each transaction, provide: date, merchant/description, amount, and whether it's income or expense.

Text:
${text}

Return as JSON array with format: [{ date, merchant, amount, type }]`;

  return callGroq(prompt, 0.1);
}

// Check if Groq is available
export async function isGroqAvailable() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return false;
    }
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        timeout: 5000,
      }
    );
    return !!response.data.choices;
  } catch (error) {
    console.warn("⚠ Groq is not available");
    return false;
  }
}
