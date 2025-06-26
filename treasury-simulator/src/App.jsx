import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import AccountsGrid from './components/AccountsGrid';
import TransferForm from './components/TransferForm';
import TransactionLog from './components/TransactionLog';
import './App.css';

// Static FX rates (base currency: USD)
const FX_RATES = {
  USD: 1,
  KES: 150,
  NGN: 750
};

// Initial accounts data
const INITIAL_ACCOUNTS = [
  { id: 'mpesa_kes_1', name: 'Mpesa_KES_1', currency: 'KES', balance: 50000 },
  { id: 'mpesa_kes_2', name: 'Mpesa_KES_2', currency: 'KES', balance: 75000 },
  { id: 'bank_usd_1', name: 'Bank_USD_1', currency: 'USD', balance: 10000 },
  { id: 'bank_usd_2', name: 'Bank_USD_2', currency: 'USD', balance: 15000 },
  { id: 'bank_usd_3', name: 'Bank_USD_3', currency: 'USD', balance: 8000 },
  { id: 'wallet_ngn_1', name: 'Wallet_NGN_1', currency: 'NGN', balance: 500000 },
  { id: 'wallet_ngn_2', name: 'Wallet_NGN_2', currency: 'NGN', balance: 750000 },
  { id: 'mobile_kes_1', name: 'Mobile_KES_1', currency: 'KES', balance: 25000 },
  { id: 'corporate_usd_1', name: 'Corporate_USD_1', currency: 'USD', balance: 50000 },
  { id: 'reserve_ngn_1', name: 'Reserve_NGN_1', currency: 'NGN', balance: 1000000 }
];

function App() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [selectedFromAccount, setSelectedFromAccount] = useState('');
  const [selectedToAccount, setSelectedToAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferDate, setTransferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');

  // Convert amount between currencies
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / FX_RATES[fromCurrency];
    return usdAmount * FX_RATES[toCurrency];
  };

  // Handle transfer
  const handleTransfer = (e) => {
    e.preventDefault();
    
    if (!selectedFromAccount || !selectedToAccount || !transferAmount) {
      alert('Please fill in all required fields');
      return;
    }

    if (selectedFromAccount === selectedToAccount) {
      alert('Source and destination accounts must be different');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      alert('Transfer amount must be greater than 0');
      return;
    }

    const fromAccount = accounts.find(acc => acc.id === selectedFromAccount);
    const toAccount = accounts.find(acc => acc.id === selectedToAccount);

    if (fromAccount.balance < amount) {
      alert('Insufficient balance in source account');
      return;
    }

    // Calculate converted amount if currencies differ
    const convertedAmount = convertCurrency(amount, fromAccount.currency, toAccount.currency);
    const exchangeRate = fromAccount.currency !== toAccount.currency ? 
      FX_RATES[toAccount.currency] / FX_RATES[fromAccount.currency] : 1;

    // Update account balances
    const updatedAccounts = accounts.map(account => {
      if (account.id === selectedFromAccount) {
        return { ...account, balance: account.balance - amount };
      }
      if (account.id === selectedToAccount) {
        return { ...account, balance: account.balance + convertedAmount };
      }
      return account;
    });

    // Create transaction record
    const transaction = {
      id: uuidv4(),
      fromAccount: fromAccount.name,
      toAccount: toAccount.name,
      fromCurrency: fromAccount.currency,
      toCurrency: toAccount.currency,
      amount: amount,
      convertedAmount: convertedAmount,
      exchangeRate: exchangeRate,
      note: transferNote,
      date: transferDate,
      timestamp: new Date().toISOString()
    };

    setAccounts(updatedAccounts);
    setTransactions([transaction, ...transactions]);

    // Reset form
    setSelectedFromAccount('');
    setSelectedToAccount('');
    setTransferAmount('');
    setTransferNote('');
    setTransferDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const accountMatch = !filterAccount || 
      transaction.fromAccount.includes(filterAccount) || 
      transaction.toAccount.includes(filterAccount);
    
    const currencyMatch = !filterCurrency || 
      transaction.fromCurrency === filterCurrency || 
      transaction.toCurrency === filterCurrency;
    
    return accountMatch && currencyMatch;
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Treasury Movement Simulator</h1>
        <p>Manage funds across 10 virtual accounts in KES, USD, and NGN</p>
      </header>

      <main className="app-main">
        <section className="accounts-section">
          <h2>Account Overview</h2>
          <AccountsGrid accounts={accounts} />
        </section>

        <section className="transfer-section">
          <h2>Transfer Funds</h2>
          <TransferForm
            accounts={accounts}
            selectedFromAccount={selectedFromAccount}
            setSelectedFromAccount={setSelectedFromAccount}
            selectedToAccount={selectedToAccount}
            setSelectedToAccount={setSelectedToAccount}
            transferAmount={transferAmount}
            setTransferAmount={setTransferAmount}
            transferNote={transferNote}
            setTransferNote={setTransferNote}
            transferDate={transferDate}
            setTransferDate={setTransferDate}
            onTransfer={handleTransfer}
            fxRates={FX_RATES}
          />
        </section>

        <section className="transactions-section">
          <h2>Transaction Log</h2>
          <TransactionLog
            transactions={filteredTransactions}
            filterAccount={filterAccount}
            setFilterAccount={setFilterAccount}
            filterCurrency={filterCurrency}
            setFilterCurrency={setFilterCurrency}
            accounts={accounts}
          />
        </section>
      </main>
    </div>
  );
}

export default App;

