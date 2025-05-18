'use client';
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleCheck, AlertCircle, AlertTriangle, Info, Loader2, ArrowUpCircle } from 'lucide-react';

// Add transaction status types
type NotifierType = 'success' | 'error' | 'warning' | 'info' | 'submitting' | 'processing' | 'completed' | 'failed';
type NotifierPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

interface Notification {
  id: number;
  message: string;
  type: NotifierType;
  // Optional transaction hash for Sui transactions
  txHash?: string;
}

interface TransactionNotifierContextType {
  showNotifier: (message: string, type?: NotifierType, position?: NotifierPosition, txHash?: string) => void;
  // Convenience method for transaction status notifications
  showTxStatus: (status: 'submitting' | 'processing' | 'completed' | 'failed', message?: string, txHash?: string, position?: NotifierPosition) => void;
  // Method to set dark mode explicitly
  setDarkModeExplicitly: (isDark: boolean) => void;
}

const TransactionNotifierContext = createContext<TransactionNotifierContextType | undefined>(undefined);

export const TransactionNotifierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<{ notification: Notification; position: NotifierPosition }[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  // Track if dark mode is enabled
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Store timeouts associated with notification IDs
  const [timeouts, setTimeouts] = useState<Record<number, NodeJS.Timeout>>({});

  // Function to explicitly set dark mode (for syncing with UI)
  const setDarkModeExplicitly = useCallback((isDark: boolean) => {
    setIsDarkMode(isDark);
  }, []);

  // Check for system dark mode preference on mount
  useEffect(() => {
    setIsMounted(true);
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    // Listen for changes in system theme preference
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);
    
    return () => darkModeMediaQuery.removeEventListener('change', handler);
  }, []);

  // Function to clear a specific timeout
  const clearTimeoutById = useCallback((id: number) => {
    setTimeouts(prev => {
      if (prev[id]) {
        clearTimeout(prev[id]);
        const { [id]: _, ...rest } = prev; // Create new object without the id
        return rest;
      }
      return prev;
    });
  }, []);

  // Function to dismiss a notification and clear its timeout
  const dismissNotification = useCallback((id: number) => {
    clearTimeoutById(id); // Clear timeout when dismissing
    setNotifications(prev => prev.filter(item => item.notification.id !== id));
  }, [clearTimeoutById]);

  // Effect to manage auto-close timeouts based on notification type
  useEffect(() => {
    notifications.forEach(({ notification }) => {
      const { id, type } = notification;
      // Determine if this type should auto-close (e.g., success/error states, but not pending ones)
      const shouldAutoClose = type === 'completed' || type === 'failed' || type === 'success' || type === 'error' || type === 'warning' || type === 'info';
      const autoCloseDuration = 5000; // 5 seconds

      // Clear existing timeout if it exists and the notification should no longer auto-close (e.g., updated to 'processing')
      if (timeouts[id] && !shouldAutoClose) {
         clearTimeoutById(id);
      }

      // Set a new timeout if it should auto-close and doesn't have one set already
      if (shouldAutoClose && !timeouts[id]) {
        const timer = setTimeout(() => {
          // Use the dismiss function which also handles timeout clearing
          dismissNotification(id);
        }, autoCloseDuration);
        // Store the timeout ID
        setTimeouts(prev => ({ ...prev, [id]: timer }));
      }
    });

    // --- Cleanup orphaned timeouts ---
    // Get IDs of current notifications
    const currentIds = new Set(notifications.map(n => n.notification.id));
    // Iterate over stored timeouts
    Object.keys(timeouts).forEach(idStr => {
      const idNum = parseInt(idStr, 10);
      // If a stored timeout ID doesn't correspond to a current notification, clear it
      if (!currentIds.has(idNum)) {
        clearTimeoutById(idNum);
      }
    });

    // Dependencies: Run when notifications change or dismiss/clear functions are updated.
    // Avoid adding `timeouts` itself to prevent potential loops.
  }, [notifications, dismissNotification, clearTimeoutById]);

  const showNotifier = useCallback((
    message: string,
    type: NotifierType = 'info',
    position: NotifierPosition = 'top-right',
    txHash?: string
  ) => {
    setNotifications(prevNotifications => {
      // Try to find an existing notification with the same txHash and position
      const existingTxIndex = txHash
        ? prevNotifications.findIndex(item => item.notification.txHash === txHash && item.position === position)
        : -1;

      if (existingTxIndex !== -1) {
        // --- Update existing notification ---
        const updatedNotifications = [...prevNotifications];
        const existingItem = updatedNotifications[existingTxIndex];

        // If the type changes, clear any existing timeout; useEffect will set a new one if needed.
        if (existingItem.notification.type !== type) {
           clearTimeoutById(existingItem.notification.id);
        }

        // Update the notification in place, keeping the original ID
        updatedNotifications[existingTxIndex] = {
          ...existingItem,
          notification: {
            ...existingItem.notification, // Keep ID and txHash
            message, // Update message
            type,    // Update type
          },
          // Keep original position
        };
        return updatedNotifications; // Return the updated array
      } else {
        // --- Add new notification ---
        // Use Date.now() or a more robust UUID generator for unique IDs
        const id = Date.now();
        const newNotification = { notification: { id, message, type, txHash }, position };
        // Return a new array with the new notification appended
        return [...prevNotifications, newNotification];
      }
    });
  }, [clearTimeoutById]);

  // Convenience method for transaction status notifications
  const showTxStatus = useCallback((
    status: 'submitting' | 'processing' | 'completed' | 'failed',
    message?: string,
    txHash?: string,
    position: NotifierPosition = 'top-right'
  ) => {
    const statusMessages = {
      submitting: message || 'Submitting transaction to Sui blockchain...',
      processing: message || 'Transaction is being processed...',
      completed: message || 'Transaction completed successfully!',
      failed: message || 'Transaction failed to process. Please try again.'
    };

    // Call showNotifier without the autoClose argument
    showNotifier(statusMessages[status], status, position, txHash);
  }, [showNotifier]);

  if (!isMounted) {
    return null;
  }

  return (
    <TransactionNotifierContext.Provider value={{ showNotifier, showTxStatus, setDarkModeExplicitly }}>
      {children}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].map((pos) => (
        <NotifierContainer
          key={pos}
          // Pass only notifications matching the current position
          notifications={notifications.filter(t => t.position === pos)}
          position={pos as NotifierPosition}
          isDarkMode={isDarkMode}
          // Pass the enhanced dismissNotification function
          onDismiss={dismissNotification}
        />
      ))}
    </TransactionNotifierContext.Provider>
  );
};

export const useTransactionNotifier = () => {
  const context = useContext(TransactionNotifierContext);
  if (!context) {
    throw new Error('useTransactionNotifier must be used within a TransactionNotifierProvider');
  }
  return context;
};

interface NotifierContainerProps {
  notifications: { notification: Notification; position: NotifierPosition }[];
  position: NotifierPosition;
  isDarkMode: boolean;
  onDismiss: (id: number) => void;
}

const NotifierContainer: React.FC<NotifierContainerProps> = ({ notifications, position, isDarkMode, onDismiss }) => {
  // Determine if it's mobile view to potentially adjust position
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Adjust position for mobile if needed (e.g., consolidate top-left/right to top)
  const adjustedPosition = isMobile ? (position.startsWith('top') ? 'top' : 'bottom') : position;

  const getPositionClasses = () => {
    switch (adjustedPosition) {
      case 'top-left':
        return 'top-20 left-4';
      case 'top-right':
        return 'top-20 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top': // Consolidated mobile top position
        return 'top-20 left-1/2 transform -translate-x-1/2 w-[90%]'; // Make wider on mobile maybe
      case 'bottom': // Consolidated mobile bottom position
        return 'bottom-4 left-1/2 transform -translate-x-1/2 w-[90%]'; // Make wider on mobile maybe
      case 'center': // Center position (might overlap mobile top)
        return 'top-20 left-1/2 transform -translate-x-1/2 w-[90%] sm:w-full'; // Adjust width for mobile/desktop
      default:
        return 'top-20 right-4'; // Default fallback
    }
  };

  const getInitialY = () => {
    // Adjust initial Y based on the *adjusted* position
    if (adjustedPosition.startsWith('top') || adjustedPosition === 'center') {
      return -50; // Animate from top
    } else { // bottom
      return 50;  // Animate from bottom
    }
  };

  return (
    // Apply position classes and manage width/spacing
    <div className={`fixed z-50 ${getPositionClasses()} max-w-full sm:max-w-sm space-y-2 pointer-events-none`}>
      <AnimatePresence>
        {notifications.map(({ notification }) => (
          <motion.div
            layout="position" // Enable automatic layout animation for smooth updates/reordering
            key={notification.id} // Use the stable ID as key
            initial={{ opacity: 0, y: getInitialY() }} // Initial animation for new items
            animate={{ opacity: 1, y: 0 }}             // Animate into position
            exit={{ opacity: 0, y: getInitialY(), transition: { duration: 0.2 } }} // Exit animation for removed items
            transition={{ duration: 0.4, ease: 'easeInOut' }} // Default transition
            className="pointer-events-auto" // Allow clicks on individual notifications
          >
            <TransactionNotification
              {...notification}
              isDarkMode={isDarkMode}
              onDismiss={() => onDismiss(notification.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface TransactionNotificationProps extends Notification {
  isDarkMode: boolean;
  onDismiss: () => void;
}

const TransactionNotification: React.FC<TransactionNotificationProps> = ({ message, type, txHash, isDarkMode, onDismiss }) => {
  // Configure styles based on type and theme
  const typeConfig = {
    // Light mode styles
    light: {
      success: { icon: CircleCheck, bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' },
      error: { icon: AlertCircle, bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' },
      warning: { icon: AlertTriangle, bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
      info: { icon: Info, bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200' },
      submitting: { icon: ArrowUpCircle, bgColor: 'bg-indigo-50', textColor: 'text-indigo-800', borderColor: 'border-indigo-200' },
      processing: { icon: Loader2, bgColor: 'bg-purple-50', textColor: 'text-purple-800', borderColor: 'border-purple-200' },
      completed: { icon: CircleCheck, bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200' },
      failed: { icon: AlertCircle, bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' }
    },
    // Dark mode styles
    dark: {
      success: { icon: CircleCheck, bgColor: 'bg-green-900/40', textColor: 'text-green-300', borderColor: 'border-green-800' },
      error: { icon: AlertCircle, bgColor: 'bg-red-900/40', textColor: 'text-red-300', borderColor: 'border-red-800' },
      warning: { icon: AlertTriangle, bgColor: 'bg-yellow-900/40', textColor: 'text-yellow-300', borderColor: 'border-yellow-800' },
      info: { icon: Info, bgColor: 'bg-blue-900/40', textColor: 'text-blue-300', borderColor: 'border-blue-800' },
      submitting: { icon: ArrowUpCircle, bgColor: 'bg-indigo-900/40', textColor: 'text-indigo-300', borderColor: 'border-indigo-800' },
      processing: { icon: Loader2, bgColor: 'bg-purple-900/40', textColor: 'text-purple-300', borderColor: 'border-purple-800' },
      completed: { icon: CircleCheck, bgColor: 'bg-green-900/40', textColor: 'text-green-300', borderColor: 'border-green-800' },
      failed: { icon: AlertCircle, bgColor: 'bg-red-900/40', textColor: 'text-red-300', borderColor: 'border-red-800' }
    }
  };

  const theme = isDarkMode ? 'dark' : 'light';
  const { icon: Icon, bgColor, textColor, borderColor } = typeConfig[theme][type];

  // Add spinning animation for processing status
  const iconClass = `${textColor} w-5 h-5 ${type === 'processing' ? 'animate-spin' : ''}`;

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 flex items-center justify-between max-w-full`}>
      <div className="flex items-center space-x-3">
        <Icon className={iconClass} />
        <div>
          <p className={`${textColor} font-medium`}>{message}</p>
          {txHash && (
            <a 
              href={`https://explorer.sui.io/txblock/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-xs ${textColor} opacity-80 hover:opacity-100 hover:underline`}
            >
              View transaction
            </a>
          )}
        </div>
      </div>
      
      {/* Close button */}
      <button 
        onClick={onDismiss} 
        className={`${textColor} hover:opacity-100 opacity-60 ml-4 transition-opacity`}
        aria-label="Close notification"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
    </div>
  );
};
