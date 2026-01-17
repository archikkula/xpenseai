import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import ExpenseForm from "../expense/ExpenseForm";
import { parseReceiptTextWithAI, categorizeExpense, preprocessOCRText, extractReceiptSummary } from "../../services/aiService";
import apiService from "../../services/apiService";

function ScanReceipt({ onAddExpenses }) {
  // All state declarations grouped together
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [parsedExpenses, setParsedExpenses] = useState([]);
  const [enhancedExpenses, setEnhancedExpenses] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ setReceiptFile] = useState(null);
  
  const [processingStage, setProcessingStage] = useState("");
  const [receiptSummary, setReceiptSummary] = useState(null);
  const [addingAll, setAddingAll] = useState(false);
  const [savedReceiptId, setSavedReceiptId] = useState(null);

  // Load persisted scan data on component mount
  useEffect(() => {
    const savedScanData = sessionStorage.getItem('scanReceiptData');
    if (savedScanData) {
      try {
        const data = JSON.parse(savedScanData);
        setEnhancedExpenses(data.enhancedExpenses || []);
        setReceiptSummary(data.receiptSummary || null);
        setPreviewUrl(data.previewUrl || null);
        setSavedReceiptId(data.savedReceiptId || null);
      } catch (error) {
        console.warn('Failed to load saved scan data:', error);
      }
    }
  }, []);

  // Save scan data to sessionStorage whenever it changes
  useEffect(() => {
    if (enhancedExpenses.length > 0 || receiptSummary) {
      const dataToSave = {
        enhancedExpenses,
        receiptSummary,
        previewUrl,
        savedReceiptId
      };
      sessionStorage.setItem('scanReceiptData', JSON.stringify(dataToSave));
    }
  }, [enhancedExpenses, receiptSummary, previewUrl, savedReceiptId]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error("Please select an image file (JPG, PNG, etc.)");
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error("File size too large. Please select an image under 10MB.");
    }

    return true;
  };

  const saveReceiptPhoto = async (file, summary) => {
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('metadata', JSON.stringify({
        store: summary?.store || 'Unknown Store',
        total: summary?.total || '0',
        date: new Date().toISOString().split('T')[0],
        itemCount: enhancedExpenses.length
      }));

      const response = await apiService.uploadReceipt(formData);
      return response.receiptId;
    } catch (error) {
      console.warn('Failed to save receipt photo:', error);
      return null;
    }
  };

  const enhanceExpensesWithAI = async (expenses, summary) => {
    setProcessingStage("Enhancing with AI categorization...");
    
    const enhanced = await Promise.all(
      expenses.map(async (expense, index) => {
        try {
          // Add small delay between requests to avoid rate limiting
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const category = await categorizeExpense(expense.description, expense.amount);
          return {
            ...expense,
            category,
            originalCategory: category // Store original AI suggestion
          };
        } catch (error) {
          console.warn(`Failed to categorize expense "${expense.description}":`, error);
          return {
            ...expense,
            category: 'Other',
            originalCategory: 'Other'
          };
        }
      })
    );

    // Add tax as a separate expense if it exists and is significant
    if (summary?.tax && parseFloat(summary.tax) > 0.01) {
      const taxExpense = {
        description: `Tax - ${summary.store || 'Receipt'}`,
        amount: parseFloat(summary.tax),
        category: 'Tax',
        originalCategory: 'Tax',
        date: new Date().toISOString().split('T')[0],
        isTax: true
      };
      enhanced.push(taxExpense);
    }

    return enhanced;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file first
      validateFile(file);
      
      // Reset states
      setError(null);
      setProgress(0);
      setParsedExpenses([]);
      setEnhancedExpenses([]);
      setReceiptSummary(null);
      setSavedReceiptId(null);
     
      setLoading(true);
      setReceiptFile(file);

      // Create preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      setProcessingStage("Extracting text from image...");

      // OCR with Tesseract - enhanced options for better accuracy
      const { data: { text } } = await Tesseract.recognize(file, "eng", { 
        logger: (m) => {
          console.log(m);
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 30)); // OCR takes first 30%
          }
        },
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,:-$',
        preserve_interword_spaces: '1'
      });

      console.log("Raw OCR Text:", text);
      
      setProcessingStage("Preprocessing text...");
      setProgress(40);

      // Preprocess OCR text for better AI parsing
      const cleanedText = preprocessOCRText(text);
      console.log("Cleaned OCR Text:", cleanedText);

      setProcessingStage("Parsing receipt with AI...");
      setProgress(50);

      // Parse with AI using cleaned text
      let parsedData = await parseReceiptTextWithAI(cleanedText);
      
      setProcessingStage("Extracting receipt totals...");
      setProgress(60);
      
      // Extract receipt summary (totals, tax, store info)
      const summary = await extractReceiptSummary(cleanedText);
      setReceiptSummary(summary);
      console.log('Receipt Summary:', summary);
      
      setProcessingStage("Saving receipt photo...");
      setProgress(70);
      
      // Save receipt photo to server
      const receiptId = await saveReceiptPhoto(file, summary);
      if (receiptId) {
        setSavedReceiptId(receiptId);
      }
      
      setProcessingStage("Validating results...");
      setProgress(80);
      
      console.log(`Found ${parsedData.length} valid expenses`);
      setParsedExpenses(parsedData);
      setProgress(90);

      if (parsedData.length > 0) {
        // Enhance with AI categorization and include tax
        const enhanced = await enhanceExpensesWithAI(parsedData, summary);
        setEnhancedExpenses(enhanced);
      }

      setProgress(100);
      setProcessingStage("Complete!");
      
      // Clear loading after a brief delay
      setTimeout(() => {
        setLoading(false);
        setProcessingStage("");
        setProgress(0);
      }, 500);

    } catch (err) {
      console.error("Receipt scanning failed:", err);
      setError(err.message || "Failed to scan receipt. Please try again or enter manually.");
      setLoading(false);
      setProcessingStage("");
      setProgress(0);
    }
  };

  const handleAddAll = async () => {
    if (!onAddExpenses || enhancedExpenses.length === 0) return;
    
    setAddingAll(true);
    try {
      // Add receipt reference to each expense
      const expensesWithReceipt = enhancedExpenses.map(expense => ({
        ...expense,
        receiptId: savedReceiptId
      }));

      // Call the parent component's function to add all expenses
      await onAddExpenses(expensesWithReceipt);
      
      // Reset the component after successful addition
      resetScan();
    } catch (error) {
      setError("Failed to add all expenses. Please try again.");
    } finally {
      setAddingAll(false);
    }
  };

  const resetScan = () => {
    setParsedExpenses([]);
    setEnhancedExpenses([]);
    setReceiptSummary(null);
    setError(null);
    setProgress(0);
    setProcessingStage("");
    setSavedReceiptId(null);
    setReceiptFile(null);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    // Clear sessionStorage
    sessionStorage.removeItem('scanReceiptData');
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleIndividualExpenseAdded = async (index) => {
    // Add receipt reference to the expense being added
    const expense = enhancedExpenses[index];
    if (expense && savedReceiptId) {
      expense.receiptId = savedReceiptId;
    }

    // Remove this expense from the list after adding
    const updated = enhancedExpenses.filter((_, i) => i !== index);
    setEnhancedExpenses(updated);
    
    // If no more expenses, reset the scan
    if (updated.length === 0) {
      resetScan();
    }
  };

  // Calculate totals including tax
  const calculateItemsTotal = () => {
    return enhancedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  };

  const getTaxExpense = () => {
    return enhancedExpenses.find(exp => exp.isTax);
  };

  const getNonTaxExpenses = () => {
    return enhancedExpenses.filter(exp => !exp.isTax);
  };

  return (
    <div className="form-section">
      <h2 className="form-title">Scan Receipt</h2>
      
      <div className="scan-controls">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="form-input"
          disabled={loading}
        />
        
        {(parsedExpenses.length > 0 || previewUrl || enhancedExpenses.length > 0) && (
          <button 
            onClick={resetScan}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Receipt Status */}
      {savedReceiptId && (
        <div style={{
          margin: '10px 0',
          padding: '8px 12px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#2e7d32',
          border: '1px solid #c8e6c9'
        }}>
          Receipt photo saved successfully - linked to your expenses
        </div>
      )}

      {/* Preview Image */}
      {previewUrl && (
        <div className="image-preview" style={{ margin: '15px 0' }}>
          <img 
            src={previewUrl} 
            alt="Receipt preview" 
            style={{ 
              maxWidth: '300px', 
              maxHeight: '400px', 
              objectFit: 'contain',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="scanning-progress" style={{ margin: '20px 0' }}>
          <p>{processingStage}</p>
          {progress > 0 && (
            <div>
              <progress value={progress} max="100" style={{ width: '100%' }} />
              <span style={{ fontSize: '14px', color: '#666' }}>{progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message" style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          {error}
        </div>
      )}

      {/* Parsed Expenses */}
      {enhancedExpenses.length > 0 && (
        <div className="parsed-expenses">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            margin: '20px 0 15px 0'
          }}>
            <h3 className="form-title">Review & Confirm Expenses ({enhancedExpenses.length} items)</h3>
            
            <button 
              onClick={handleAddAll}
              disabled={addingAll || !onAddExpenses}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: addingAll ? 'not-allowed' : 'pointer',
                opacity: addingAll ? 0.6 : 1
              }}
            >
              {addingAll ? 'Adding...' : 'Add All Expenses'}
            </button>
          </div>

          {/* Summary Card - matching expense card format */}
          <div className="expense-card" style={{ marginBottom: '20px' }}>
            <div className="expense-item">
              <span className="expense-description">Total Items: ${calculateItemsTotal().toFixed(2)}</span>
              <span className="expense-amount" style={{ color: 'var(--gray-600)' }}>
                {getNonTaxExpenses().length} item{getNonTaxExpenses().length !== 1 ? 's' : ''}
                {getTaxExpense() && ` + tax ($${getTaxExpense().amount})`}
              </span>
            </div>
            
            {receiptSummary && (
              <div className="expense-meta">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {receiptSummary.store && (
                    <div><strong>Store:</strong> {receiptSummary.store}</div>
                  )}
                  {parseFloat(receiptSummary.subtotal) > 0 && (
                    <div>Subtotal: ${receiptSummary.subtotal}</div>
                  )}
                  {parseFloat(receiptSummary.tax) > 0 && (
                    <div>Tax: ${receiptSummary.tax}</div>
                  )}
                </div>
                {parseFloat(receiptSummary.total) > 0 && (
                  <div className="expense-date" style={{ fontWeight: 'bold', color: 'var(--dark)' }}>
                    Receipt Total: ${receiptSummary.total}
                  </div>
                )}
              </div>
            )}
            
            {receiptSummary && parseFloat(receiptSummary.total) > 0 && (
              (() => {
                const itemsTotal = calculateItemsTotal();
                const receiptTotal = parseFloat(receiptSummary.total);
                const difference = Math.abs(receiptTotal - itemsTotal);
                
                if (difference > 0.25) {
                  return (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#856404'
                    }}>
                      Items total (${itemsTotal.toFixed(2)}) doesn't match receipt total (${receiptTotal.toFixed(2)}). 
                      Some items may not have been detected correctly.
                    </div>
                  );
                } else {
                  return (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#d1edff', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#0c5460'
                    }}>
                      Totals match! Items: ${itemsTotal.toFixed(2)} ≈ Receipt: ${receiptTotal.toFixed(2)}
                    </div>
                  );
                }
              })()
            )}
          </div>
          
          {/* Display tax expense first if it exists */}
          {getTaxExpense() && (
            <div style={{ marginBottom: '15px' }}>
              <ExpenseForm 
                prefillData={{
                  ...getTaxExpense(),
                  date: getTaxExpense().date || new Date().toISOString().split('T')[0]
                }}
                onExpenseAdded={() => handleIndividualExpenseAdded(enhancedExpenses.findIndex(exp => exp.isTax))}
                isFromScan={true}
                onScanItemRemoved={() => handleIndividualExpenseAdded(enhancedExpenses.findIndex(exp => exp.isTax))}
              />
            </div>
          )}
          
          {/* Display regular expenses */}
          {getNonTaxExpenses().map((expense, originalIndex) => {
            // Find the actual index in the full enhanced expenses array
            const actualIndex = enhancedExpenses.findIndex(exp => exp === expense);
            
            return (
              <div key={actualIndex} style={{ marginBottom: '15px' }}>
                <ExpenseForm 
                  prefillData={{
                    ...expense,
                    date: expense.date || new Date().toISOString().split('T')[0]
                  }}
                  onExpenseAdded={() => handleIndividualExpenseAdded(actualIndex)}
                  isFromScan={true}
                  onScanItemRemoved={() => handleIndividualExpenseAdded(actualIndex)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* No Results Message */}
      {!loading && parsedExpenses.length === 0 && previewUrl && enhancedExpenses.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#666', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          margin: '15px 0'
        }}>
          <p>No expenses found in this receipt. The image might be unclear or not contain itemized purchases.</p>
          <p style={{ fontSize: '14px' }}>Try taking a clearer photo or enter expenses manually.</p>
        </div>
      )}
    </div>
  );
}

export default ScanReceipt;