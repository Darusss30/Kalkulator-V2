import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-soft p-8 text-center">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-danger-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Terjadi Kesalahan
              </h1>
              
              <p className="text-gray-600 mb-8">
                Aplikasi mengalami kesalahan yang tidak terduga. 
                Silakan muat ulang halaman atau kembali ke beranda.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang Halaman
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Kembali ke Beranda
                </button>
              </div>
              
              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Detail Error (Development)
                  </summary>
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <div className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                      <strong>Error:</strong> {this.state.error.toString()}
                      {this.state.errorInfo && (
                        <>
                          <br /><br />
                          <strong>Component Stack:</strong>
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </div>
                  </div>
                </details>
              )}
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Jika masalah terus berlanjut, silakan hubungi tim support.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for hooks
export const ErrorBoundaryWrapper = ({ children, onError, fallback }) => {
  return (
    <ErrorBoundary onError={onError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
