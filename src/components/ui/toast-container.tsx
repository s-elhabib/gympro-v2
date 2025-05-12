import React, { useState, useEffect } from 'react';
import Toast, { ToastProps } from './toast';
import { useNotifications } from '../../context/NotificationContext';

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
  maxToasts = 3,
}) => {
  const { notifications, removeNotification } = useNotifications();
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  useEffect(() => {
    // Convert notifications to toasts
    const newToasts = notifications
      .filter(notification => !notification.read)
      .slice(0, maxToasts)
      .map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        duration: notification.duration || 5000,
        onClose: () => removeNotification(notification.id),
      }));

    setToasts(newToasts);
  }, [notifications, maxToasts, removeNotification]);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-4 w-80`}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
