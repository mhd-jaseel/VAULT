import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function DiscountCountdown({ endDate, showCountdown, tickTime, onExpire }) {
  const [expired, setExpired] = useState(false);

  if (!showCountdown || !endDate) return null;

  const targetTime = new Date(endDate).getTime();
  const timeLeft = targetTime - tickTime;

  if (timeLeft <= 0) {
    if (!expired) {
      setExpired(true);
      if (onExpire) {
        setTimeout(() => {
          onExpire();
        }, 1500); // Wait 1.5 seconds displaying "Offer Expired" before removing
      }
    }
    return (
      <div 
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FFF1F2] border border-[#F87171] text-[#DC2626] rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] mb-2.5 h-[38px] transition-all duration-300"
      >
        <span className="text-[11px] font-medium tracking-[1px] uppercase flex items-center gap-1 font-mono text-[#DC2626]/75">
          <Clock size={12} /> Ends In
        </span>
        <span className="text-[15px] font-bold font-mono">Offer Expired</span>
      </div>
    );
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatNum = (num) => String(num).padStart(2, '0');

  // Determine styling based on warning states
  let containerStyle = 'bg-[#111111] text-white border-none';
  let labelStyle = 'text-white/75';
  let countdownStyle = 'text-white';
  let animateClass = '';

  if (timeLeft < 1000 * 60 * 60) {
    // Less than 1 Hour
    containerStyle = 'bg-[#FFF1F2] border border-[#F87171] text-[#DC2626]';
    labelStyle = 'text-[#DC2626]/75';
    countdownStyle = 'text-[#DC2626]';
    animateClass = 'animate-pulse';
  } else if (timeLeft < 1000 * 60 * 60 * 24) {
    // Less than 24 Hours
    containerStyle = 'bg-[#FFF8E7] border border-[#F5C451] text-[#B45309]';
    labelStyle = 'text-[#B45309]/75';
    countdownStyle = 'text-[#B45309]';
    animateClass = 'animate-pulse';
  }

  return (
    <div 
      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] mb-2.5 h-[38px] transition-all duration-300 ${containerStyle}`}
    >
      {/* Left Side */}
      <div className="flex items-center gap-1.5">
        <Clock size={12} className={labelStyle} />
        <span className={`text-[11px] font-medium tracking-[1px] uppercase ${labelStyle}`}>
          Ends In
        </span>
      </div>

      {/* Right Side */}
      <div className={`text-[15px] font-bold font-mono tracking-wide ${countdownStyle} ${animateClass}`}>
        {days > 0 ? `${formatNum(days)}D ` : ''}
        {formatNum(hours)}H : {formatNum(minutes)}M : {formatNum(seconds)}S
      </div>
    </div>
  );
}
