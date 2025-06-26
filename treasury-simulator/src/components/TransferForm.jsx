import React from 'react';
import { ArrowRight, Calculator } from 'lucide-react';

const TransferForm = ({
  accounts,
  selectedFromAccount,
  setSelectedFromAccount,
  selectedToAccount,
  setSelectedToAccount,
  transferAmount,
  setTransferAmount,
  transferNote,
  setTransferNote,
  transferDate,
  setTransferDate,
  onTransfer,
  fxRates
}) => {
  const fromAccount = accounts.find(acc => acc.id === selectedFromAccount);
  const toAccount = accounts.find(acc => acc.id === selectedToAccount);

  const calculateConversion = () => {
    if (!fromAccount || !toAccount || !transferAmount) return null;
    
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return null;

    if (fromAccount.currency === toAccount.currency) {
      return { amount, convertedAmount: amount, rate: 1, needsConversion: false };
    }

    const rate = fxRates[toAccount.currency] / fxRates[fromAccount.currency];
    const convertedAmount = amount * rate;

    return { amount, convertedAmount, rate, needsConversion: true };
  };

  const conversion = calculateConversion();

  return (
    <form className="transfer-form" onSubmit={onTransfer}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fromAccount">From Account</label>
          <select
            id="fromAccount"
            value={selectedFromAccount}
            onChange={(e) => setSelectedFromAccount(e.target.value)}
            required
          >
            <option value="">Select source account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency} {account.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="transfer-arrow">
          <ArrowRight size={24} />
        </div>

        <div className="form-group">
          <label htmlFor="toAccount">To Account</label>
          <select
            id="toAccount"
            value={selectedToAccount}
            onChange={(e) => setSelectedToAccount(e.target.value)}
            required
          >
            <option value="">Select destination account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency} {account.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
            required
          />
          {fromAccount && (
            <small>Available: {fromAccount.currency} {fromAccount.balance.toLocaleString()}</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date">Transfer Date</label>
          <input
            type="date"
            id="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="note">Note (Optional)</label>
        <input
          type="text"
          id="note"
          value={transferNote}
          onChange={(e) => setTransferNote(e.target.value)}
          placeholder="Add a note for this transfer"
        />
      </div>

      {conversion && conversion.needsConversion && (
        <div className="conversion-info">
          <Calculator size={16} />
          <span>
            {fromAccount.currency} {conversion.amount.toLocaleString()} → {toAccount.currency} {conversion.convertedAmount.toLocaleString()} 
            (Rate: {conversion.rate.toFixed(4)})
          </span>
        </div>
      )}

      <button type="submit" className="transfer-button">
        Execute Transfer
      </button>
    </form>
  );
};

export default TransferForm;
