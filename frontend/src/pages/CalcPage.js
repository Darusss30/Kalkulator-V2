import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CalcPage = () => {
  const { jobTypeId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Kalkulator Konstruksi
                </h1>
                <p className="text-gray-600 mt-1">
                  Halaman kalkulator sedang dalam pengembangan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Kalkulator Sedang Dikembangkan
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalcPage;
