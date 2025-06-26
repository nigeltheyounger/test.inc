import React from 'react';
import { format } from 'date-fns';
import { Filter, ArrowRight } from 'lucide-react';

const TransactionLog = ({
  transactions,
  filterAccount,
  setFilterAccount,
  filterCurrency,
  setFilterCurrency,
  accounts
}) => {
  const currencies = ['KES', 'USD', 'NGN'];

  return (
    <div className="transaction-log">
      <div className="filters">
        <div className="filter-group">
          <Filter size={16} />
          <input
            type="text"
            placeholder="Filter by account name"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
          >
            <option value="">All currencies</option>
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
        <button 
          className="clear-filters"
          onClick={() => {
            setFilterAccount('');
            setFilterCurrency('');
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions found</p>
          </div>
        ) : (
          transactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-header">
                <div className="transaction-accounts">
                  <span className="from-account">{transaction.fromAccount}</span>
                  <ArrowRight size={16} />
                  <span className="to-account">{transaction.toAccount}</span>
                </div>
                <div className="transaction-date">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </div>
              </div>
              
              <div className="transaction-details">
                <div className="transaction-amount">
                  {transaction.fromCurrency !== transaction.toCurrency ? (
                    <span>
                      {transaction.fromCurrency} {transaction.amount.toLocaleString()} → {' '}
                      {transaction.toCurrency} {transaction.convertedAmount.toLocaleString()}
                      <small className="exchange-rate">
                        (Rate: {transaction.exchangeRate.toFixed(4)})
                      </small>
                    </span>
                  ) : (
                    <span>
                      {transaction.fromCurrency} {transaction.amount.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {transaction.note && (
                  <div className="transaction-note">
                    Note: {transaction.note}
                  </div>
                )}
              </div>
              
              <div className="transaction-timestamp">
                Executed: {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm:ss')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionLog;
