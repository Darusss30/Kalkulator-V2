import React from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import BrickCalculator from '../components/calculators/BrickCalculator';

const BrickCalculatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get job type from navigation state or use default
  const jobType = location.state?.jobType || {
    id: 'brick_work',
    name: 'Pemasangan Bata',
    unit: 'm²',
    base_productivity: 8 // m² per day
  };

  const handleCalculationComplete = (results) => {
    console.log('Brick calculation completed:', results);
    // Here you can handle the calculation results
    // For example, save to database, show results modal, etc.
  };

  return (
    <>
      <Helmet>
        <title>Kalkulator Bata - Kalkulator Konstruksi</title>
        <meta name="description" content="Kalkulator bata untuk menghitung biaya pemasangan bata dengan berbagai jenis dan spesi mortar" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 relative overflow-hidden text-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <button
                  onClick={() => {
                    if (location.state?.from) {
                      navigate(location.state.from);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="p-2 sm:p-3 rounded-lg hover:bg-white/10 transition-colors duration-200 touch-manipulation flex-shrink-0"
                  title="Kembali"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate flex items-center">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
                    Kalkulator Bata - {jobType?.name || 'Pemasangan Bata'}
                  </h1>
                  <p className="text-orange-100 mt-1 text-sm sm:text-base lg:text-lg truncate">
                    {jobType ? `${jobType.description || jobType.name} - ${jobType.unit}` : 'Hitung biaya pemasangan bata dengan berbagai jenis dan spesi mortar'}
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-2 text-sm text-orange-200 flex-shrink-0">
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Beranda</button>
                <span>/</span>
                <button 
                  onClick={() => {
                    if (jobType?.category_id) {
                      navigate(`/category/${jobType.category_id}`);
                    } else {
                      navigate('/');
                    }
                  }} 
                  className="hover:text-white transition-colors"
                >
                  {jobType?.name || 'Job Type'}
                </button>
                <span>/</span>
                <span className="text-white font-medium">Kalkulator</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <BrickCalculator 
            jobType={jobType}
            onCalculationComplete={handleCalculationComplete}
          />
        </div>
      </div>
    </>
  );
};

export default BrickCalculatorPage;
