import axios from "axios";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Add this to your .env file
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Check if Groq API is available
 * @returns {Promise<boolean>}
 */
async function isGroqAvailable() {
  try {
    if (!GROQ_API_KEY) {
      console.warn("⚠ GROQ_API_KEY is not set in environment variables.");
      return false;
    }
    // Simple check by making a minimal API call
    const response = await axios.get("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      timeout: 5000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Call Groq API for text generation
 * @param {string} prompt - The prompt to send to Groq
 * @returns {Promise<string>} - The response from Groq
 */
async function callGroq(prompt) {
  try {
    const available = await isGroqAvailable();
    if (!available) {
      console.warn("⚠ Groq API is not available. Check your API key.");
      return `I apologize, but I'm unable to process your request right now.

Please ensure:
1. GROQ_API_KEY is set in your .env file
2. Your API key is valid (get one free at console.groq.com)

In the meantime, I can help you with general financial advice or information about your account.`;
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert Indian personal finance advisor with deep knowledge of:
- Indian financial instruments (SIP, PPF, FD, ELSS, NPS, Mutual Funds, Stocks)
- Indian tax laws (80C, 80D, HRA, standard deduction)
- Indian salary structures, EPF, and cost of living in Indian cities
- Realistic investment advice for salaried individuals in India
- Indian banks, brokers and apps (Zerodha, Groww, Paytm Money, HDFC, SBI etc.)

When giving advice ALWAYS:
1. Give SPECIFIC numbers and percentages based on user's actual income
2. Mention exact Indian investment options with platform names (Groww, Zerodha, etc.)
3. Consider Indian inflation rate (~6%) in long term planning
4. Break down advice step by step with clear ₹ amounts
5. Be encouraging, practical and realistic
6. If user mentions a goal, calculate exact monthly savings needed
7. Always explain WHY you are recommending something

Never give vague answers. Never say "it depends" without giving a specific recommendation.
Always be specific, actionable, and personalized to the user's exact numbers.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let text = response.data.choices?.[0]?.message?.content || "";

    // Clean up the response
    text = text.trim();
    text = text.replace(/^[\s\n]*/, "");
    text = text.replace(/[\s\n]*$/, "");
    text = text.replace(/\n\n+/g, "\n\n");

    if (!text || text.length < 5) {
      return "I'm having difficulty generating a response. Please try asking again or rephrase your question.";
    }

    return text;
  } catch (error) {
    console.error("Groq API error:", error.message);
    return `I'm having trouble accessing the AI service. Please make sure:
1. GROQ_API_KEY is set in your .env file
2. Your API key is valid
3. You have available credits at console.groq.com

For now, you can manually categorize transactions or try again later.`;
  }
}

/**
 * Extract transactions from text using Groq
 * @param {string} text - Text to process
 * @returns {Promise<{transactions: Array, confidence: number}>}
 */
async function extractTransactionsFromText(text) {
  try {
    const prompt = `Extract transaction data from the following text.
Return each transaction in this format: DATE|AMOUNT|DESCRIPTION

Text:
${text}

Provide only the transactions, one per line, in DATE|AMOUNT|DESCRIPTION format.`;

    const response = await callGroq(prompt);
    const lines = response.split("\n").filter((line) => line.trim());

    const transactions = lines
      .map((line) => {
        const parts = line.split("|");
        if (parts.length >= 3) {
          return {
            date: parts[0].trim(),
            amount: parts[1].trim(),
            description: parts[2].trim(),
          };
        }
        return null;
      })
      .filter((tx) => tx !== null);

    return {
      transactions,
      confidence: 70,
    };
  } catch (error) {
    console.error("Error extracting transactions from text:", error);
    throw error;
  }
}

// Keep old function names as aliases so rest of your code doesn't break!
const callOllama = callGroq;
const isOllamaAvailable = isGroqAvailable;

export {
  callGroq,
  callOllama, // alias - so your existing code still works
  extractTransactionsFromText,
  isGroqAvailable,
  isOllamaAvailable, // alias - so your existing code still works
};