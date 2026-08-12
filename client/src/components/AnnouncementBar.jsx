import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get('/announcements/public');
        if (isMounted && res.data?.success) {
          setAnnouncement(res.data.data);
        }
      } catch (err) {
        console.error('Error loading promotional announcement:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  // Do not render anything if inactive, loading, or content is empty
  if (loading || !announcement || !announcement.isActive || !announcement.content?.trim()) {
    return null;
  }

  const contentText = announcement.content.trim();

  // Render offer items with '*' separators for marquee animation
  const renderItemSet = (keyPrefix) => (
    <div key={keyPrefix} className="flex items-center shrink-0">
      <span className="px-4 md:px-8">
        {contentText}
      </span>
      <span className="text-white/70 font-semibold text-[10px] md:text-xs select-none">
        *
      </span>
      <span className="px-4 md:px-8">
        {contentText}
      </span>
      <span className="text-white/70 font-semibold text-[10px] md:text-xs select-none">
        *
      </span>
    </div>
  );

  return (
    <div 
      className="w-full bg-black text-white overflow-hidden py-2 select-none relative z-30 border-b border-neutral-800"
      aria-label="Promotional Announcements"
    >
      <div className="flex w-full overflow-hidden">
        <div className="animate-marquee font-bold uppercase tracking-wider text-[10px] md:text-xs text-white whitespace-nowrap py-0.5">
          {renderItemSet('set1')}
          {renderItemSet('set2')}
          {renderItemSet('set3')}
          {renderItemSet('set4')}
        </div>
      </div>
    </div>
  );
}
