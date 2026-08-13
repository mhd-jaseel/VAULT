import React, { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    setLoading(false);

    if (result.success) {
      toast.success('Logged in with Google successfully!');
      navigate(redirect ? `/${redirect}` : '/');
    } else if (result.blocked) {
      navigate('/blocked');
    } else {
      toast.error(result.message || 'Google Login failed.');
      setErrorMsg(result.message);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Login failed.');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-neutral-50">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-neutral-50 to-neutral-100 opacity-60" />
        <div className="absolute -left-[10%] -top-[10%] w-[40%] h-[40%] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute right-[0%] bottom-[0%] w-[30%] h-[30%] rounded-full bg-neutral-200/50 blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 px-5">
        <div className="bg-white border border-neutral-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 flex flex-col items-center gap-8 text-center transition-all">
          
          <div className="flex flex-col items-center gap-3">
            <span className="font-display font-black text-4xl tracking-[0.25em] text-[#111111] uppercase leading-none ml-2">
              VAULT<span className="text-gold">.</span>
            </span>
            <div className="h-px w-12 bg-gold/50 my-2"></div>
            <h1 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500">
              Exclusive Member Access
            </h1>
            <p className="text-xs text-neutral-600 font-sans mt-2 leading-relaxed px-4">
              Sign in to manage your luxury collections, track orders, and access your vault wallet.
            </p>
          </div>

          {errorMsg && (
            <div className="w-full bg-red-50 border border-red-100 rounded-xl py-3 px-4">
              <p className="text-xs text-red-500 font-medium font-sans">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="flex flex-col items-center w-full gap-6">
            <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="pill"
                text="continue_with"
                size="large"
                theme="outline"
                width="280"
              />
            </div>
            
            <p className="text-[10px] text-neutral-400 font-sans px-4 leading-relaxed max-w-[280px]">
              By continuing, you agree to Vault's <br/>
              <span className="text-neutral-500 hover:text-[#111111] transition-colors cursor-pointer underline underline-offset-2">Terms of Service</span> and <span className="text-neutral-500 hover:text-[#111111] transition-colors cursor-pointer underline underline-offset-2">Privacy Policy</span>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
