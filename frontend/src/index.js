import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CalculationProvider } from './contexts/CalculationContext';
import ErrorBoundary from './components/ErrorBoundary';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Toast configuration
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#fff',
    color: '#374151',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '12px 16px',
    fontSize: '14px',
    maxWidth: '400px',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
    style: {
      border: '1px solid #d1fae5',
      background: '#f0fdf4',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
    style: {
      border: '1px solid #fecaca',
      background: '#fef2f2',
    },
  },
  loading: {
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#fff',
    },
    style: {
      border: '1px solid #dbeafe',
      background: '#eff6ff',
    },
  },
};

// Error logging function
const logError = (error, errorInfo) => {
  if (process.env.NODE_ENV === 'development') {
  }
  
  // In production, you might want to send errors to a logging service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // logErrorToService(error, errorInfo);
  }
};

// Main App Component with all providers
const AppWithProviders = () => {
  return (
    <ErrorBoundary onError={logError}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AuthProvider>
              <CalculationProvider>
                <App />
                <Toaster toastOptions={toastOptions} />
              </CalculationProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics in development
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        // Performance metrics available but not logged
      }
    }
  });
  
  observer.observe({ entryTypes: ['navigation'] });
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
      })
      .catch((registrationError) => {
      });
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  logError(event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason, {
    type: 'unhandledrejection',
    promise: event.promise,
  });
});

// Expose query client for debugging in development
if (process.env.NODE_ENV === 'development') {
  window.queryClient = queryClient;
}
