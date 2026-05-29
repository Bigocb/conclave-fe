import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const variants = {
  primary: 'bg-aviation-accent text-black hover:bg-white',
  secondary: 'bg-slate-800 text-slate-300 border border-aviation-border hover:bg-slate-700',
  danger: 'bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40',
};

export const Button = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  onClick, 
  type = 'button',
  disabled = false
}: ButtonProps) => (
  <button 
    type={type}
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 rounded text-xs mono font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
  >
    {children}
  </button>
);

interface InputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  step?: string;
  required?: boolean;
}

export const Input = ({ label, name, type = 'text', placeholder, defaultValue, step, required }: InputProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs mono text-slate-500 uppercase tracking-wider">{label}</label>
    <input 
      type={type}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      step={step}
      required={required}
      className="bg-black border border-aviation-border p-2 text-xs mono text-white focus:outline-none focus:border-aviation-accent transition-colors w-full"
    />
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-aviation-panel border border-aviation-border w-full max-w-2xl rounded-lg noc-glow animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-aviation-border flex justify-between items-center">
          <h3 className="text-sm font-bold mono text-white uppercase tracking-tighter">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <span className="text-lg">&times;</span>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-aviation-panel border border-aviation-border rounded-lg ${className}`}>
    {children}
  </div>
);
