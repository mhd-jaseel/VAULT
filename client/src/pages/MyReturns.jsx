import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { RotateCcw, ChevronRight, Package, Clock, ShieldCheck } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function MyReturns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/returns/my-returns?page=${page}&limit=10`);
      if (res.data.success) {
        setReturns(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page]);

  const getStatusBadge = (status) => {
    const map = {
      REQUESTED: { label: 'REQUESTED', cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' },
      APPROVED: { label: 'APPROVED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
      REJECTED: { label: 'REJECTED', cls: 'bg-red-50 text-red-600 border-red-200' },
      REPLACEMENT_APPROVED: { label: 'REPLACEMENT APPROVED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
      REPLACEMENT_SHIPPED: { label: 'REPLACEMENT SHIPPED', cls: 'bg-blue-50 text-blue-700 border-blue-300' },
      COMPLETED: { label: 'COMPLETED', cls: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold' },
      CANCELLED: { label: 'CANCELLED', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
    };
    const conf = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-800' };
    return (
      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${conf.cls}`}>
        {conf.label}
      </span>
    );
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-5xl mx-auto w-full min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
            My Returns &amp; Replacements
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-mono">Track status and updates for your return requests.</p>
        </div>
        <Link to="/profile" className="text-text-secondary hover:text-text-primary text-[10px] font-mono uppercase tracking-wider">
          ← Back to Profile
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="glass-card text-center py-16">
          <RotateCcw size={32} className="mx-auto mb-3 text-text-secondary opacity-50" />
          <h3 className="text-xs font-mono font-bold text-text-primary uppercase">No Return Requests Found</h3>
          <p className="text-[10px] text-text-secondary font-mono mt-1">You haven't requested any returns or replacements yet.</p>
          <Link to="/profile" className="btn-dark text-[10px] py-2 px-6 mt-4 inline-block uppercase tracking-wider">
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div
              key={ret._id}
              className="glass-card border border-border-light hover:border-text-primary transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center font-mono font-bold text-[9px] text-text-primary flex-shrink-0 border border-border-light">
                  VAULT
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">
                      {ret.returnId}
                    </span>
                    {getStatusBadge(ret.status)}
                    <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-text-secondary border border-border-light">
                      {ret.returnType}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-primary uppercase font-sans">
                    {ret.orderItem.name} <span className="text-text-secondary font-mono text-[10px]">× {ret.orderItem.quantity}</span>
                  </p>
                  <p className="text-[10px] text-text-secondary font-mono">
                    Original Amount: <span className="font-bold text-text-primary">₹{ret.orderItem.totalOriginalPaid.toLocaleString('en-IN')}</span> · Requested on {new Date(ret.createdAt).toLocaleDateString()}
                  </p>
                  {ret.returnType === 'RETURN' && (
                    <div className="text-[10px] text-text-secondary bg-neutral-50 p-2.5 rounded-xl border border-border-light mt-2 space-y-1 block">
                      <div className="flex items-center justify-between">
                        <span>Wallet Settlement: <strong className="text-text-primary">₹{ret.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')}</strong></span>
                        {ret.walletCreditStatus === 'CREDITED' || ret.status === 'WALLET_CREDITED' ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            + ₹{ret.orderItem?.totalOriginalPaid?.toLocaleString('en-IN')} Added to Wallet
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Pending Admin Approval
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <Link
                  to={`/returns/${ret._id}`}
                  className="btn-dark !py-2 !px-4 text-[9px] uppercase tracking-wider text-center flex items-center justify-center gap-1 font-mono"
                >
                  View Details <ChevronRight size={10} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => setSearchParams({ page: newPage })}
        loading={loading}
      />
    </div>
  );
}
