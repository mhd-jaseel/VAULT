import React, { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Logic unchanged ──────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      toast.success('Logged in successfully!');
      if (result.user && result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirect ? `/${redirect}` : '/');
      }
    } else if (result.blocked) {
      navigate('/blocked');
    } else {
      toast.error(result.message || 'Login failed.');
      setErrorMsg(result.message);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    /* Page — full viewport, light gray bg matching the rest of the VAULT site */
    <div className="min-h-screen w-full flex items-center justify-center px-5 py-10 bg-[#f5f5f6]">

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-white border border-[#e5e5e5] rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] px-8 py-10 flex flex-col gap-7">

        {/* ── Branding ── */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-display font-black text-2xl tracking-[0.2em] text-neutral-900 uppercase leading-none">
            VAULT<span className="text-neutral-400">.</span>
          </span>
          <h1 className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-neutral-800 mt-1">
            Member Sign In
          </h1>
          <p className="text-[11px] text-neutral-400 font-sans text-center leading-relaxed">
            Access your saved collections and invoices.
          </p>
        </div>

        {/* ── Error message ── */}
        {errorMsg && (
          <p className="text-[11px] text-red-500 font-medium text-center bg-red-50 border border-red-100 rounded-xl py-2 px-4">
            {errorMsg}
          </p>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-mono font-semibold">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className={`form-input text-sm ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <span className="text-[10px] text-red-500 font-sans">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-mono font-semibold">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors font-sans"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className={`form-input text-sm ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <span className="text-[10px] text-red-500 font-sans">{errors.password.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold text-[11px] uppercase tracking-[0.15em] py-3.5 mt-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>Sign In <ArrowRight size={13} /></>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-100" />
          <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-neutral-100" />
        </div>

        {/* ── Create account ── */}
        <p className="text-[11px] text-center text-neutral-400 font-sans -mt-3">
          New to VAULT?{' '}
          <Link
            to={`/register${redirect ? `?redirect=${redirect}` : ''}`}
            className="text-neutral-900 font-semibold hover:underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
