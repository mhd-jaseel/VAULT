import React, { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const { register: registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    const result = await registerUser(data.name, data.email, data.password, data.phone);
    setLoading(false);

    if (result.success) {
      toast.success('Registered successfully!');
      navigate(redirect ? `/${redirect}` : '/');
    } else {
      toast.error(result.message || 'Registration failed.');
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
            Create Account
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Register to start managing your orders.</p>
        </div>

        {errorMsg && <p className="text-xs text-red-400 font-medium text-center">{errorMsg}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              className={`form-input text-xs ${errors.name ? 'border-red-500/50' : ''}`}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <span className="text-[10px] text-red-400 mt-1 block">{errors.name.message}</span>}
          </div>

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

          {/* Phone */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="Mobile number"
              className={`form-input text-xs ${errors.phone ? 'border-red-500/50' : ''}`}
              {...register('phone', { required: 'Phone is required' })}
            />
            {errors.phone && <span className="text-[10px] text-red-400 mt-1 block">{errors.phone.message}</span>}
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              className={`form-input text-xs ${errors.password ? 'border-red-500/50' : ''}`}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be 6 characters' } })}
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
              <>Register <UserPlus size={14} /></>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-zinc-500 mt-2">
          Already have an account?{' '}
          <Link to={`/login${redirect ? `?redirect=${redirect}` : ''}`} className="text-gold hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
