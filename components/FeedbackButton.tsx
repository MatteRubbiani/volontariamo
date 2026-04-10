import React from 'react';

const FeedbackButton = () => {
  // Sostituisci questo URL con il link al tuo Google Form o Tally.so
  const FEEDBACK_URL = "https://tally.so/r/7RV9x9"; 

  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      // Posizionamento modificato: ancorato a destra e spostato in basso (bottom-24)
      className="fixed right-0 bottom-24 z-50 flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-sm text-white px-4 py-2.5 rounded-l-xl shadow-2xl hover:bg-slate-800 transition-all duration-200 border border-slate-700 border-r-0 transform translate-x-1 hover:translate-x-0 group"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform"
      >
        <path d="m8 2 1.88 1.88"/>
        <path d="M14.12 3.88 16 2"/>
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
        <path d="M12 20v-9"/>
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
        <path d="M6 13H2"/>
        <path d="M3 22c0-2.6 1.7-4.7 4-5"/>
        <path d="M13.47 9c1.93-.2 3.53-1.9 3.53-4"/>
        <path d="M18 13h4"/>
        <path d="M21 22c0-2.6-1.7-4.7-4-5"/>
      </svg>
      
      <span className="font-medium text-xs tracking-tight">
        Segnala<br />Bug
      </span>
    </a>
  );
};

export default FeedbackButton;