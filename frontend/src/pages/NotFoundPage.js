import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-8">
            Maaf, halaman yang Anda cari tidak dapat ditemukan. 
            Mungkin halaman telah dipindahkan atau URL salah.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full btn-primary flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Halaman Sebelumnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
