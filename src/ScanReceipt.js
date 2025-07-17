import React, { useState } from "react";
import Tesseract from "tesseract.js";
import ExpenseForm from "./ExpenseForm";
import { parseReceiptTextWithAI } from "./aiService";

function ScanReceipt() {
  const [loading, setLoading] = useState(false);

  const [parsedExpenses, setParsedExpenses] = useState([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    Tesseract.recognize(file, "eng", { logger: (m) => console.log(m) })
      .then(({ data: { text } }) => {
        return parseReceiptTextWithAI(text);
      })
      .then((aiExpenses) => {
        setParsedExpenses(aiExpenses);
        setLoading(false);
      })
      .catch((err) => {
        console.error("OCR or AI parsing failed:", err);
        setLoading(false);
      });
  };

  return (
    <div className="form-section">
      <h2 className="form-title">Scan Receipt</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input" />

      {loading && <p>Scanning receipt...</p>}


      {parsedExpenses.length > 0 && (
        <>
          <h3 className="form-title">Review & Confirm Expenses</h3>
          {parsedExpenses.map((expense) => (
            <ExpenseForm key={expense.id} prefillData={expense} />
          ))}
        </>
      )}
    </div>
  );
}

export default ScanReceipt;