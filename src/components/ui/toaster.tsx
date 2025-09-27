/**
 * Toast Notification Component
 * Provides global toast notification system using react-hot-toast
 */

'use client';

import { Toaster as HotToaster } from 'react-hot-toast';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#1f2937' : '#ffffff',
          color: theme === 'dark' ? '#f9fafb' : '#1f2937',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          fontSize: '14px',
          maxWidth: '500px',
        },

        // Default options for specific toast types
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          duration: Infinity,
        },
      }}
    />
  );
}