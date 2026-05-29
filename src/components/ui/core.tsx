import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-aviation-panel border border-aviation-border rounded-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs mono text-slate-500 uppercase tracking-wider">{label}</label>}
    <input 
      {...props}
      className="bg-black border border-aviation-border p-2 text-xs mono text-white focus:outline-none focus:border-aviation-accent transition-colors"
    />
  </div>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-aviation-accent text-aviation-bg font-bold hover:bg-emerald-400',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
    danger: 'bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40'
  };
  
  return (
    <button 
      {...props}
      className={`px-4 py-2 rounded text-xs mono transition-all active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-aviation-panel border border-aviation-border rounded-lg shadow-2xl noc-glow animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-aviation-border flex justify-between items-center">
          <h3 className="text-sm mono font-bold text-white uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
