import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const variants = {
  primary: 'bg-noc-green text-noc-bg hover:bg-noc-cyan',
  secondary: 'bg-noc-bg3 text-noc-text2 border border-noc-border hover:bg-noc-surface',
  danger: 'bg-noc-rose/20 text-noc-rose border border-noc-rose/30 hover:bg-noc-rose/30',
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
    className={`px-4 py-2 rounded-lg text-xs mono font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
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
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  required?: boolean;
  className?: string;
}

export const Input = ({ label, name, type = 'text', placeholder, defaultValue, value, onChange, step, required, className = '' }: InputProps) => (
  <div className=\"flex flex-col gap-1.5\">
    <label className=\"text-xs mono text-noc-text3 uppercase tracking-wider\">{label}</label>
    <input 
      type={type}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      step={step}
      required={required}
      className={`bg-noc-bg3 border border-noc-border p-2 text-xs mono text-noc-text1 focus:outline-none focus:border-noc-green transition-colors w-full ${className}`}
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
    <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4\">
      <motion.div 
        drag=\"x\"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(event, info) => {
          if (Math.abs(info.offset.x) > 150) {
            onClose();
          }
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className=\"bg-noc-bg2 border border-noc-border w-full max-w-2xl rounded-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col cursor-grab active:cursor-grabbing\"
      >
        <div className=\"p-4 border-b border-noc-border flex justify-between items-center shrink-0\">
          <h3 className=\"text-sm font-bold mono text-noc-text1 uppercase tracking-tighter\">{title}</h3>
          <button onClick={onClose} className=\"text-noc-text2 hover:text-noc-text1 text-2xl leading-none p-1\">&times;</button>
        </div>
        <div className=\"p-6 overflow-y-auto\">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-noc-bg2 border border-noc-border rounded-2xl ${className}`}>
    {children}
  </div>
);
