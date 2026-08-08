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
        }, 1500);
      }
    }
    return (
      <div 
        className="w-full flex items-center justify-center gap-1.5 px-[9px] py-[5px] md:px-[12px] md:py-[6px] bg-[#FFF1F1] border border-[#E8B5B5] text-[#A33A3A] rounded-full h-[28px] md:h-[32px] mb-[8px] transition-all duration-300"
      >
        <Clock size={12} className="w-[10px] h-[10px] md:w-[12px] md:h-[12px] shrink-0 text-[#A33A3A]" />
        <span className="font-mono uppercase tracking-wider text-[9px] md:text-[11px] font-bold">
          OFFER EXPIRED
        </span>
      </div>
    );
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatNum = (num) => String(num).padStart(2, '0');

  // Determine styling based on warning states
  let bgClass = 'bg-[#F7F7F7]';
  let borderClass = 'border-[#E6E6E6]';
  let textClass = 'text-[#555555]';
  let numClass = 'text-[#111111]';

  if (timeLeft < 1000 * 60 * 60) {
    // Less than 1 Hour
    bgClass = 'bg-[#FFF1F1]';
    borderClass = 'border-[#E8B5B5]';
    textClass = 'text-[#A33A3A]';
    numClass = 'text-[#7f1d1d]'; // slightly stronger/darker red
  } else if (timeLeft < 1000 * 60 * 60 * 24) {
    // Less than 24 Hours
    bgClass = 'bg-[#FFF8E8]';
    borderClass = 'border-[#EAD7A0]';
    textClass = 'text-[#8A6500]';
    numClass = 'text-[#78350f]'; // slightly stronger/darker gold
  }

  const hoursStr = formatNum(hours);
  const minutesStr = formatNum(minutes);
  const secondsStr = formatNum(seconds);

  return (
    <div 
      className={`w-full flex items-center justify-center gap-1.5 px-[9px] py-[5px] md:px-[12px] md:py-[6px] border rounded-full h-[28px] md:h-[32px] mb-[8px] transition-all duration-300 ${bgClass} ${borderClass} ${textClass}`}
    >
      <Clock size={12} className={`w-[10px] h-[10px] md:w-[12px] md:h-[12px] shrink-0 ${textClass}`} />
      
      <span className="font-mono uppercase tracking-wider text-[9px] md:text-[10px] font-medium">
        <span className={days > 0 ? "hidden md:inline" : "inline"}>ENDS IN </span>
      </span>

      <span className={`font-mono font-semibold text-[10px] md:text-[11px] ${numClass}`}>
        {days > 0 ? `${days}D ` : ''}
        {hoursStr}H {minutesStr}M {secondsStr}S
      </span>
    </div>
  );
}

