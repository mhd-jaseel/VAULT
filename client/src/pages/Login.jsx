import React, { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
    } else {
      toast.error(result.message || 'Login failed.');
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="py-20 px-4 flex items-center justify-center min-h-[90vh]">
      <div className="w-full max-w-md glass-card flex flex-col gap-6">
        <div className="text-center">
          <span className="font-display font-bold text-2xl tracking-widest text-white">
            VAULT<span className="text-gold">.</span>
          </span>
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-300 mt-2 font-display">
            Member Sign In
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Access your saved collections and invoices.</p>
        </div>

        {errorMsg && <p className="text-xs text-red-400 font-medium text-center">{errorMsg}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className={`form-input text-xs ${errors.email ? 'border-red-500/50' : ''}`}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="text-[10px] text-red-400 mt-1 block">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest block">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-gold hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className={`form-input text-xs ${errors.password ? 'border-red-500/50' : ''}`}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className="text-[10px] text-red-400 mt-1 block">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold text-xs uppercase tracking-widest py-3.5 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>Sign In <LogIn size={14} /></>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-zinc-500 mt-2">
          New to VAULT?{' '}
          <Link to={`/register${redirect ? `?redirect=${redirect}` : ''}`} className="text-gold hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
