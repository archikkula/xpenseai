import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Add this new function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add this new function
const validateApiKey = () => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your environment variables.');
    }
    return apiKey;
};

// Replace your existing categorizeExpense function
export const categorizeExpense = async (description, amount, retries = 3) => {
    // Validate API key first
    validateApiKey();
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a financial assistant. Categorize expenses into one of these categories: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, Education, Travel, Other. Respond with only the category name."
                    },
                    {
                        role: "user",
                        content: `Categorize this expense: ${description}, Amount: $${amount}`
                    }
                ],
                max_tokens: 10,
                temperature: 0.3
            });

            const category = response.choices[0].message.content.trim();
            
            // Validate the category is one of our expected categories
            const validCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'];
            return validCategories.includes(category) ? category : 'Other';
            
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            
            // Handle specific error types
            if (error.code === 'insufficient_quota') {
                throw new Error('OpenAI API quota exceeded. Please try again later.');
            }
            if (error.code === 'invalid_api_key') {
                throw new Error('Invalid OpenAI API key. Please check your configuration.');
            }
            if (error.message.includes('network')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            
            // Don't retry on these errors
            if (error.code === 'insufficient_quota' || error.code === 'invalid_api_key') {
                throw error;
            }
            
            // If this is the last attempt, throw the error
            if (i === retries - 1) {
                return 'Other'; // Fallback to 'Other' instead of throwing
            }
            
            // Wait before retrying (exponential backoff)
            await delay(Math.pow(2, i) * 1000);
        }
    }
}

// Move parseReceiptTextWithAI outside categorizeExpense and export it
export async function parseReceiptTextWithAI(rawText) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
            {
              role: "system",
              content: `You are a JSON receipt parser. Your only job is to extract a list of purchased products from raw receipt text. You should analyze the text and try to understand the items purchased and output ur understanding, their prices, and the store name if available. Your output should be a JSON array of objects with the following structure:
          
          Return only a JSON array like this:
          [
            {
              "description": "clear product name with where it was bought",
              "amount": "0.00",
              "source": "Store name if available"
            }
          ]
          
          ### RULES:
          - Do NOT include totals, taxes, discounts, payment info, timestamps, or loyalty messages.
          - Only include items with individual prices (usually near start or middle of receipt).
          - Ensure descriptions are readable and clear (no codes, abbreviations, or typos).
          - If the store name appears at the top, include it in the source field of each item.
          - Always return **only** valid JSON — no text before or after.
          
          Now parse this receipt text and return only the itemized JSON list:`
            },
            {
              role: "user",
              content: rawText
            }
          ],          
        temperature: 0.3,
      }),
    });
  
    const result = await response.json();
    try {
      const data = JSON.parse(result.choices[0].message.content);
      if (Array.isArray(data)) {
        return data.map((item) => ({
          ...item,
          id: Date.now() + Math.random(),
          date: new Date().toISOString().split("T")[0],
        }));
      }
    } catch (e) {
      console.error("AI response parsing error:", result.choices?.[0]?.message?.content);
    }
  
    return [];
}