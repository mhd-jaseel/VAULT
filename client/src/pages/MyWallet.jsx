import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function MyWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchWallet = async () => {
    try {
      const res = await axios.get('/wallet');
      if (res.data.success) {
        setWallet(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load wallet.');
    }
  };

  const fetchTransactions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/wallet/transactions?page=${pageNum}&limit=10`);
      if (res.data.success) {
        setTransactions(res.data.data);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load wallet transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions(page);
  }, [page]);

  return (
    <div className="py-8 px-4 md:px-12 max-w-4xl mx-auto w-full min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-secondary">
            VAULT STORE CREDIT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-text-primary font-sans flex items-center gap-2.5">
            <WalletIcon className="text-text-primary" size={26} /> VAULT WALLET
          </h1>
        </div>
        <button
          onClick={() => {
            fetchWallet();
            fetchTransactions(page);
          }}
          className="self-start sm:self-center p-2.5 rounded-xl border border-border-light text-text-secondary hover:text-text-primary hover:bg-neutral-50 flex items-center gap-1.5 text-xs font-mono cursor-pointer"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-[#0f0f0f] text-white p-6 md:p-8 rounded-2xl border border-neutral-800 shadow-xl mb-10 font-mono relative overflow-hidden">
        <div className="space-y-1 mb-4">
          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
            AVAILABLE BALANCE
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
            ₹{(wallet?.balance || 0).toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-sans">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" /> Auto-applied at checkout for orders &amp; split payment.
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-neutral-500 uppercase">
            Credits come from approved Returns &amp; Cancellations
          </span>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-primary font-mono border-b border-border-light pb-3">
          WALLET ACTIVITY
        </h3>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-text-secondary">Loading wallet activity...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-border-light text-text-secondary font-mono text-xs">
            No wallet activity recorded yet. Credits from approved returns or cancellations will appear here automatically.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => {
              const isCredit = txn.type === 'CREDIT' || txn.amount > 0;
              return (
                <div
                  key={txn._id}
                  className="p-4 bg-white rounded-xl border border-border-light flex items-center justify-between gap-4 font-mono shadow-sm hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}
                    >
                      {isCredit ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold uppercase text-text-primary truncate font-sans">
                        {txn.source ? txn.source.replace('_', ' ') : (isCredit ? 'Return Credit' : 'Order Payment')}
                      </h4>
                      <p className="text-[10px] text-text-secondary mt-0.5 truncate font-mono">
                        Ref #{txn.referenceId || txn.transactionId} · {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-extrabold block ${isCredit ? 'text-emerald-700' : 'text-neutral-900'}`}>
                      {isCredit ? '+' : '-'} ₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-text-secondary font-mono">
                      Bal: ₹{txn.balanceAfter.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="pt-4">
            <Pagination page={page} pages={pages} onPageChange={(p) => setPage(p)} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
