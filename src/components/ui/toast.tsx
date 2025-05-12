import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cva } from 'class-variance-authority';

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

const toastVariants = cva(
  "fixed bottom-4 right-4 z-50 flex items-start p-4 mb-4 rounded-lg shadow-lg transition-all duration-300 transform translate-y-0 opacity-100",
  {
    variants: {
      type: {
        info: "bg-blue-50 text-blue-800 border border-blue-300",
        success: "bg-green-50 text-green-800 border border-green-300",
        warning: "bg-yellow-50 text-yellow-800 border border-yellow-300",
        error: "bg-red-50 text-red-800 border border-red-300",
      },
    },
    defaultVariants: {
      type: "info",
    },
  }
);

const iconVariants = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`${toastVariants({ type })} ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {iconVariants[type]}
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm">{message}</div>
        </div>
        <button
          type="button"
          className="ml-4 text-gray-400 hover:text-gray-900 focus:outline-none"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
