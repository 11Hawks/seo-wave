/**
 * Toast Hook
 * React hook for showing toast notifications using react-hot-toast
 */

'use client'

import toast, { ToastOptions } from 'react-hot-toast'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

export function useToast() {
  const showToast = ({
    title,
    description,
    variant = 'default',
    duration = 4000,
  }: ToastProps) => {
    const message = title && description ? `${title}: ${description}` : title || description || 'Notification'
    
    const options: ToastOptions = {
      duration,
      position: 'top-right',
    }

    switch (variant) {
      case 'success':
        return toast.success(message, options)
      case 'destructive':
        return toast.error(message, options)
      default:
        return toast(message, options)
    }
  }

  return {
    toast: showToast,
    dismiss: toast.dismiss,
    remove: toast.remove,
  }
}