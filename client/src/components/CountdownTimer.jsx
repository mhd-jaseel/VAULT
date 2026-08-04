import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ endDate }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(endDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const padZero = (num) => String(num).padStart(2, '0');

  if (+new Date(endDate) <= +new Date()) {
    return null;
  }

  return (
    <div className="mt-2 py-1.5 px-2.5 bg-red-950/20 border border-red-500/20 rounded-xl flex flex-wrap gap-x-2 gap-y-0.5 items-center justify-between text-red-400 font-mono text-[8.5px] uppercase tracking-wide select-none">
      <span className="font-bold whitespace-nowrap">Ends In:</span>
      <div className="flex gap-1 font-bold whitespace-nowrap">
        <span>{padZero(timeLeft.days)}d</span>
        <span>{padZero(timeLeft.hours)}h</span>
        <span>{padZero(timeLeft.minutes)}m</span>
        <span>{padZero(timeLeft.seconds)}s</span>
      </div>
    </div>
  );
}
