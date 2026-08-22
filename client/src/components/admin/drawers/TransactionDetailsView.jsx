import React from 'react';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';

export default function TransactionDetailsView({ transaction }) {
  if (!transaction) return null;

  const isCredit = transaction.type === 'CREDIT' || transaction.type === 'RETURN_REPLACEMENT_CREDIT' || (transaction.type === 'ADJUSTMENT' && transaction.amount > 0);

  const getTransactionTypeBadge = (type, source) => {
    if (type === 'CREDIT' || type === 'RETURN_REPLACEMENT_CREDIT') {
      return <DrawerBadge variant="success">{source ? source.replace(/_/g, ' ') : 'Credit / Refund'}</DrawerBadge>;
    } else if (type === 'DEBIT' || type === 'REPLACEMENT_DEBIT' || type === 'ORDER_WALLET_PAYMENT') {
      return <DrawerBadge variant="danger">{source ? source.replace(/_/g, ' ') : 'Debit / Payment'}</DrawerBadge>;
    } else if (type === 'ADJUSTMENT') {
      return <DrawerBadge variant="warning">Adjustment</DrawerBadge>;
    }
    return <DrawerBadge variant="neutral">{source ? source.replace(/_/g, ' ') : type}</DrawerBadge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Summary ── */}
      <DrawerSection title="Transaction Summary">
        <DrawerRow 
          label="Transaction ID" 
          value={transaction.transactionId} 
        />
        <DrawerRow 
          label="Type" 
          valueNode={getTransactionTypeBadge(transaction.type, transaction.source)} 
        />
        <DrawerRow 
          label="Amount" 
          valueNode={
            <span className={`font-extrabold text-sm ${isCredit ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
              {isCredit ? '+' : '-'} ₹{Math.abs(transaction.amount)?.toLocaleString('en-IN')}
            </span>
          }
        />
        <DrawerRow 
          label="Date & Time" 
          value={`${new Date(transaction.createdAt).toLocaleDateString('en-IN')} ${new Date(transaction.createdAt).toLocaleTimeString('en-IN')}`} 
        />
      </DrawerSection>

      {/* ── Customer Information ── */}
      <DrawerSection title="Customer Information">
        <DrawerRow label="Name" value={transaction.user?.name || 'Customer'} />
        <DrawerRow label="Email" value={transaction.user?.email || 'N/A'} />
      </DrawerSection>

      {/* ── Reference ── */}
      <DrawerSection title="Reference Info">
        <DrawerRow 
          label="Reference Type" 
          value={transaction.referenceType || 'N/A'} 
        />
        <DrawerRow 
          label="Reference ID" 
          value={`#${transaction.referenceId || 'N/A'}`} 
        />
      </DrawerSection>

      {/* ── Ledger ── */}
      <DrawerSection title="Wallet Ledger">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
            <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">Balance Before</span>
            <span className="text-sm font-bold text-[#374151] font-mono">₹{transaction.balanceBefore?.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
            <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">Balance After</span>
            <span className="text-sm font-bold text-[#111111] font-mono">₹{transaction.balanceAfter?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </DrawerSection>

      {/* ── Description ── */}
      {transaction.description && (
        <DrawerSection title="Description">
          <p className="text-xs text-[#374151] font-sans leading-relaxed whitespace-pre-wrap bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
            {transaction.description}
          </p>
        </DrawerSection>
      )}

    </div>
  );
}
