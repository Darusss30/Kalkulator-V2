import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ImprovedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      
      // Custom fallback component
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Terjadi Kesalahan
            </h2>
            
            <p className="text-gray-600 mb-6">
              Aplikasi mengalami masalah tak terduga. Tim kami telah diberitahu dan sedang memperbaikinya.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full btn-primary flex items-center justify-center"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {this.state.retryCount >= 3 ? 'Terlalu Banyak Percobaan' : 'Coba Lagi'}
              </button>
              
              <Link
                to="/"
                className="w-full btn-secondary flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Link>
            </div>

            {showDetails && process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detail Error (Development)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono text-left overflow-auto max-h-40">
                  <div className="text-red-600 font-bold mb-2">
                    {this.state.error && this.state.error.toString()}
                  </div>
                  <div className="text-gray-700">
                    {this.state.errorInfo.componentStack}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different components
export const CalculatorErrorBoundary = ({ children }) => (
  <ImprovedErrorBoundary
    fallback={({ error, retry }) => (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Kalkulator Bermasalah
        </h3>
        <p className="text-red-600 mb-4">
          Terjadi kesalahan pada kalkulator. Silakan coba lagi atau refresh halaman.
        </p>
        <button onClick={retry} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </button>
      </div>
    )}
  >
    {children}
  </ImprovedErrorBoundary>
);

export const MaterialSelectorErrorBoundary = ({ children }) => (
  <ImprovedErrorBoundary
    fallback={({ error, retry }) => (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
        <p className="text-yellow-800 text-sm mb-3">
          Gagal memuat daftar material
        </p>
        <button onClick={retry} className="btn-secondary text-sm">
          Muat Ulang
        </button>
      </div>
    )}
  >
    {children}
  </ImprovedErrorBoundary>
);

export default ImprovedErrorBoundary;
