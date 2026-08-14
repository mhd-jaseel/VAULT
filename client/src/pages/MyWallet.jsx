import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, ShieldCheck, RefreshCw, Sparkles, CreditCard, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { setDocumentSEO } from '../utils/seoHelper';

export default function MyWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setDocumentSEO({
      title: 'Vault Wallet | Vault.Co',
      description: 'View your Vault Store Credit balance, auto-applied checkout perks, and transaction history.',
      noIndex: true,
      canonicalPath: '/wallet',
    });
  }, []);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallet(), fetchTransactions(page)]);
    setRefreshing(false);
    toast.success('Wallet updated');
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions(page);
  }, [page]);

  const balance = wallet?.balance || 0;

  return (
    <div className="py-8 md:py-12 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto w-full min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400">
              VAULT MEMBERSHIP PERK
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 font-sans flex items-center gap-2.5">
            <WalletIcon className="text-neutral-900" size={26} /> VAULT WALLET
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to="/shop"
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs"
          >
            Use In Shop
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 flex items-center gap-1.5 text-xs font-mono cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Refresh balance"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Hero Balance Card — Luxury Black Titanium & Subtle Gold Palette */}
      <div className="relative bg-gradient-to-br from-[#141414] via-[#0d0d0d] to-[#080808] text-white p-6 sm:p-8 md:p-10 rounded-3xl border border-neutral-800/80 shadow-2xl mb-10 overflow-hidden">
        {/* Background Ambient Glow & Patterns */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                AVAILABLE STORE CREDIT
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
                100% STORE VALUE
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-mono">
                ₹{balance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-neutral-400 font-mono">INR</span>
            </div>

            <p className="text-xs text-neutral-400 max-w-md font-sans leading-relaxed">
              Instantly applicable on any purchase across the Vault.Co catalog with zero minimum spend requirements.
            </p>
          </div>

          {/* Quick Perks Badge Group */}
          <div className="flex flex-col gap-2.5 sm:min-w-[260px] bg-white/[0.04] backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10">
            <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-sans">
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Auto-applied at checkout (supports split Razorpay payments).</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-sans">
              <Sparkles size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <span>100% instant settlement for approved returns &amp; cancellations.</span>
            </div>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="relative z-10 mt-8 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-400 font-sans">
          <span className="font-mono text-[10px] text-neutral-400 tracking-wider uppercase">
            SECURE VAULT LEDGER ID: {wallet?.user ? String(wallet.user).slice(-8).toUpperCase() : 'VAULT-CREDIT'}
          </span>
          <span className="text-neutral-400 font-mono text-[10px]">
            Zero Expiry · Non-Transferable
          </span>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-neutral-500" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-neutral-900 font-mono">
              TRANSACTION ACTIVITY
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            {transactions.length} Records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-xs text-neutral-500 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
            <span>Loading Vault Ledger...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 text-neutral-500 font-mono text-xs space-y-2">
            <CreditCard size={28} className="mx-auto text-neutral-400 mb-1" />
            <p className="font-bold text-neutral-700">No Transactions Yet</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Credits from approved returns, cancellations, or admin promotional credits will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {transactions.map((txn) => {
              const isCredit = txn.type === 'CREDIT' || txn.amount > 0;
              const sourceLabel = txn.source ? txn.source.replace(/_/g, ' ') : (isCredit ? 'Return Credit' : 'Order Payment');
              const formattedDate = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={txn._id}
                  className="p-4 sm:p-5 bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}
                    >
                      {isCredit ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold uppercase text-neutral-900 font-sans tracking-tight">
                          {sourceLabel}
                        </h4>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          isCredit ? 'bg-emerald-100/70 text-emerald-800' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {isCredit ? 'CREDIT' : 'DEBIT'}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-500 mt-1 truncate font-mono">
                        Ref #{txn.referenceId || txn.transactionId} · {formattedDate}
                      </p>
                      {txn.description && (
                        <p className="text-[10px] text-neutral-400 mt-0.5 truncate font-sans">
                          {txn.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                    <span className={`text-base sm:text-lg font-extrabold font-mono tracking-tight ${
                      isCredit ? 'text-emerald-700' : 'text-neutral-900'
                    }`}>
                      {isCredit ? '+' : '-'} ₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      Bal: ₹{txn.balanceAfter.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="pt-6">
            <Pagination page={page} pages={pages} onPageChange={(p) => setPage(p)} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
