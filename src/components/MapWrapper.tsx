'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 rounded-2xl border border-slate-200">
      Harita yükleniyor...
    </div>
  ),
});

export default Map;
