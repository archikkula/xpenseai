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

// IMPROVED: Much more sophisticated receipt parsing with tax and total
export async function parseReceiptTextWithAI(rawText) {
    validateApiKey();
    
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
            content: `You are an expert receipt parser. Extract purchased items AND receipt totals/tax information.

CRITICAL PRICE IDENTIFICATION RULES:
1. PURCHASED ITEMS - prices typically:
   - At the END of each item line (rightmost position)
   - Format: $X.XX, X.XXF, X.XX (F/T indicates tax status)
   - Between $0.10 - $100.00 for typical retail items
   
2. NOT ITEM PRICES (avoid these):
   - Size/quantity indicators: 1.5Z, 8.5Z, 12OZ, 16FL, 2LT
   - UPC/PLU codes: 4011, 123456789
   - Item codes: 3PK, 14CT, WHT
   - Measurements without $ or proper decimal format

3. RECEIPT TOTALS SECTION:
   - Look for: SUBTOTAL, TAX, TOTAL lines (usually at bottom)
   - Extract the actual total amount from TOTAL line
   - Extract tax amount if shown separately
   - These are NOT individual items but summary information

4. EXAMPLE PARSING:
   "1 KIT KAT MINI DUOS 1.5Z 1.49F" → item: "Kit Kat Mini Duos", amount: "1.49"
   "SUBTOTAL    10.47" → subtotal: "10.47"
   "TAX         0.00" → tax: "0.00" 
   "TOTAL       10.47" → total: "10.47"

Return a JSON object with items AND receipt summary:
{
  "items": [
    {
      "description": "Clean readable product name",
      "amount": "0.00"
    }
  ],
  "receiptSummary": {
    "subtotal": "0.00",
    "tax": "0.00", 
    "total": "0.00",
    "store": "Store name if visible"
  }
}

VALIDATION:
- Only extract 3-15 items max
- Ensure total >= sum of items (accounting for tax)
- Items should have reasonable prices for retail

Return ONLY valid JSON - no explanations.`
          },
          {
            role: "user",
            content: `Parse this receipt and extract items with correct prices AND the receipt totals:\n\n${rawText}`
          }
        ],          
        temperature: 0.05,
        max_tokens: 1200,
      }),
    });
  
    const result = await response.json();
    
    if (result.error) {
      console.error("OpenAI API Error:", result.error);
      throw new Error(`AI parsing failed: ${result.error.message}`);
    }
    
    try {
      const aiResponse = result.choices[0].message.content.trim();
      console.log("AI Response:", aiResponse);
      
      // Clean the response
      let jsonStr = aiResponse;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }
      
      const data = JSON.parse(jsonStr);
      
      if (data && data.items && Array.isArray(data.items)) {
        // Validate and clean items
        const cleanedItems = data.items
          .filter(item => {
            const amount = parseFloat(item.amount);
            const desc = item.description?.toLowerCase() || '';
            
            if (isNaN(amount) || amount <= 0 || amount > 100) return false;
            if (amount < 0.10) return false; // Skip tiny amounts (likely sizes)
            if (desc.length < 3) return false;
            if (/^\d+$/.test(desc)) return false;
            if (/^[a-z0-9]{1,5}$/i.test(desc)) return false;
            if (desc.includes('total') || desc.includes('tax') || desc.includes('change')) return false;
            
            return true;
          })
          .map((item) => ({
            ...item,
            id: Date.now() + Math.random(),
            date: new Date().toISOString().split("T")[0],
            amount: parseFloat(item.amount).toFixed(2),
            description: item.description.trim(),
            source: data.receiptSummary?.store || 'Scanned Receipt'
          }));

        // Validate totals make sense
        const itemsTotal = cleanedItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const receiptTotal = parseFloat(data.receiptSummary?.total || 0);
        const tax = parseFloat(data.receiptSummary?.tax || 0);
        
        console.log(`Items total: $${itemsTotal.toFixed(2)}, Receipt total: $${receiptTotal.toFixed(2)}, Tax: $${tax.toFixed(2)}`);
        
        // If totals don't match (within reasonable margin), warn but still proceed
        const totalDifference = Math.abs(receiptTotal - (itemsTotal + tax));
        if (totalDifference > 0.50) {
          console.warn(`Total mismatch: Items ($${itemsTotal.toFixed(2)}) + Tax ($${tax.toFixed(2)}) ≠ Receipt Total ($${receiptTotal.toFixed(2)})`);
        }

        // Add receipt summary info to console for debugging
        if (data.receiptSummary) {
          console.log('Receipt Summary:', data.receiptSummary);
        }

        // For now, return the items array (maintaining existing interface)
        // But we could extend this to return the full receipt data
        return cleanedItems;
      }
    } catch (e) {
      console.error("AI response parsing error:", e);
      console.error("Raw AI response:", result.choices?.[0]?.message?.content);
    }
  
    return [];
}

// NEW: Pre-process OCR text to improve accuracy
export function preprocessOCRText(rawOCRText) {
  if (!rawOCRText) return '';
  
  return rawOCRText
    // Remove excessive whitespace but preserve line structure
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    // Clean up common OCR artifacts
    .replace(/[^\w\s$.,:-]/g, ' ')
    // Fix common price format issues
    .replace(/(\d+)\.(\d{2})[FT]?\s*$/gm, '$1.$2') // Clean price endings
    .replace(/\$\s*(\d+)/g, '$$$1') // Fix spaced dollar signs
    // Preserve receipt structure by ensuring items are on separate lines
    .replace(/(\d+\.\d{2}[FT]?)\s+([A-Z])/g, '$1\n$2')
    // Clean up item descriptions
    .replace(/([A-Z]+)\s+([A-Z]+)/g, '$1 $2')
    .trim();
}

// NEW: Extract receipt summary information
export async function extractReceiptSummary(rawText) {
    validateApiKey();
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Extract receipt summary information (totals, tax, store) from receipt text.

Look for these patterns:
- SUBTOTAL, SUB TOTAL, SUBTOT: the pre-tax amount
- TAX, SALES TAX, TAX TOTAL: tax amount
- TOTAL, GRAND TOTAL, AMOUNT DUE: final total
- Store name (usually at top of receipt)

Return JSON:
{
  "subtotal": "0.00",
  "tax": "0.00", 
  "total": "0.00",
  "store": "Store Name"
}

If any value not found, use "0.00" for amounts or "" for store.`
          },
          {
            role: "user",
            content: rawText
          }
        ],          
        temperature: 0.1,
        max_tokens: 200,
      }),
    });
  
    const result = await response.json();
    
    try {
      const aiResponse = result.choices[0].message.content.trim();
      let jsonStr = aiResponse;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      }
      
      const summary = JSON.parse(jsonStr);
      return {
        subtotal: parseFloat(summary.subtotal || 0).toFixed(2),
        tax: parseFloat(summary.tax || 0).toFixed(2),
        total: parseFloat(summary.total || 0).toFixed(2),
        store: summary.store || ''
      };
    } catch (e) {
      console.error("Receipt summary parsing error:", e);
      return {
        subtotal: "0.00",
        tax: "0.00", 
        total: "0.00",
        store: ""
      };
    }
}