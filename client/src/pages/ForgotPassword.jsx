import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import { Key } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword } = useContext(AuthContext);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const result = await forgotPassword(data.email, data.newPassword);
    setLoading(false);

    if (result.success) {
      toast.success('Your password has been successfully reset.');
      setSuccessMsg('Your password has been successfully reset. You can now login.');
    } else {
      toast.error(result.message || 'Failed to reset password.');
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="py-20 px-4 flex items-center justify-center min-h-[90vh]">
      <div className="w-full max-w-md glass-card flex flex-col gap-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center mx-auto mb-2 text-gold">
            <Key size={22} />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-300 font-display">
            Reset Password
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Enter email and set your new account password.</p>
        </div>

        {successMsg && (
          <div className="p-3 bg-green-950/20 border border-green-500/30 text-green-400 text-xs rounded-xl text-center">
            {successMsg}
            <Link to="/login" className="text-white underline font-medium block mt-2">
              Proceed to Login
            </Link>
          </div>
        )}
        {errorMsg && <p className="text-xs text-red-400 font-medium text-center">{errorMsg}</p>}

        {!successMsg && (
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

            {/* New Password */}
            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className={`form-input text-xs ${errors.newPassword ? 'border-red-500/50' : ''}`}
                {...register('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Password must be 6 characters' } })}
              />
              {errors.newPassword && <span className="text-[10px] text-red-400 mt-1 block">{errors.newPassword.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold text-xs uppercase tracking-widest py-3.5 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4.5 h-4.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="text-xs text-center text-zinc-500">
          Remember credentials?{' '}
          <Link to="/login" className="text-gold hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
