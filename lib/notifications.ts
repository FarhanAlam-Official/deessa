"use client"

import { showToast as toast, type ToastOptions } from '@/components/ui/toast'

// Extended interface that includes all ToastOptions
export interface NotificationOptions extends ToastOptions {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  icon?: string
}

class NotificationManager {
  showSuccess(
    notification: { title?: string; description?: string; duration?: number } | string
  ) {
    if (typeof notification === 'string') {
      return toast.success({
        title: 'Success',
        description: notification,
      })
    }
    
    return toast.success({
      title: notification.title || 'Success',
      description: notification.description,
      duration: notification.duration,
    })
  }

  showError(
    notification: { title?: string; description: string; duration?: number }
  ) {
    return toast.error({
      title: notification.title || 'Error',
      description: notification.description,
      duration: notification.duration,
    })
  }

  showWarning(
    notification: { title?: string; description?: string; duration?: number } | string
  ) {
    if (typeof notification === 'string') {
      return toast.warning({
        title: 'Warning',
        description: notification,
      })
    }
    
    return toast.warning({
      title: notification.title || 'Warning',
      description: notification.description,
      duration: notification.duration,
    })
  }

  showInfo(
    notification: { title?: string; description?: string; duration?: number } | string
  ) {
    if (typeof notification === 'string') {
      return toast.info({
        title: 'Info',
        description: notification,
      })
    }
    
    return toast.info({
      title: notification.title || 'Info',
      description: notification.description,
      duration: notification.duration,
    })
  }

  showLoading(
    notification: { title?: string; description?: string; duration?: number } | string
  ) {
    if (typeof notification === 'string') {
      return toast.info({
        title: 'Loading',
        description: notification,
      })
    }
    
    return toast.info({
      title: notification.title || 'Loading',
      description: notification.description,
      duration: notification.duration,
    })
  }

  showCustom(
    content: React.ReactNode, 
    options?: { type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }
  ) {
    // Convert content to string for title/description
    const contentStr = content?.toString() || ''
    
    const toastOptions = {
      title: options?.type === 'success' ? 'Success' : 
             options?.type === 'error' ? 'Error' :
             options?.type === 'warning' ? 'Warning' : 'Info',
      description: contentStr,
      duration: options?.duration,
    }
    
    switch (options?.type) {
      case 'success':
        return toast.success(toastOptions)
      case 'error':
        return toast.error(toastOptions)
      case 'warning':
        return toast.warning(toastOptions)
      case 'info':
      default:
        return toast.info(toastOptions)
    }
  }

  dismiss() {
    toast.dismiss()
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: { duration?: number }
  ) {
    return toast.promise(promise, messages, options)
  }
}

export const notifications = new NotificationManager()
export default notifications
