import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const categorizeExpense = async (description, amount) => {
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

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error categorizing expense:', error);
    return 'Other';
  }
};