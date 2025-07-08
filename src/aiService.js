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
};