import React from 'react';
import { Wallet, DollarSign } from 'lucide-react';

const AccountsGrid = ({ accounts }) => {
  const formatBalance = (balance, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'KES' ? 'USD' : currency,
      minimumFractionDigits: 2
    }).format(balance).replace('$', currency === 'KES' ? 'KES ' : currency === 'NGN' ? '₦' : '$');
  };

  const getCurrencyColor = (currency) => {
    switch (currency) {
      case 'KES': return '#10B981'; // Green
      case 'USD': return '#3B82F6'; // Blue
      case 'NGN': return '#8B5CF6'; // Purple
      default: return '#6B7280';
    }
  };

  return (
    <div className="accounts-grid">
      {accounts.map(account => (
        <div key={account.id} className="account-card">
          <div className="account-header">
            <div className="account-icon">
              <Wallet size={20} />
            </div>
            <div 
              className="currency-badge"
              style={{ backgroundColor: getCurrencyColor(account.currency) }}
            >
              {account.currency}
            </div>
          </div>
          <h3 className="account-name">{account.name}</h3>
          <div className="account-balance">
            <DollarSign size={16} />
            <span>{formatBalance(account.balance, account.currency)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountsGrid;
