import React from 'react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Optionally add a marketing specific header/navbar here */}
      <main className="flex-grow">
        {children}
      </main>
      {/* Optionally add a marketing specific footer here */}
    </div>
  );
}
