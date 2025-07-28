import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Ruler } from 'lucide-react';
import LengthCalculator from '../components/calculators/LengthCalculator';

const LengthCalculatorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get job type from navigation state, fallback to mock data
  const jobTypeFromState = location.state?.jobType;
  const mockJobType = {
    id: 'length-calc',
    name: 'Kalkulator Panjang',
    unit: 'm',
    category_name: 'Kalkulator Khusus',
    description: 'Kalkulator untuk menghitung biaya pekerjaan berdasarkan panjang'
  };
  
  const jobType = jobTypeFromState || mockJobType;

  const handleSave = (calculation) => {
    console.log('Saving calculation:', calculation);
    // Here you would typically save to your backend or localStorage
    const savedCalculations = JSON.parse(localStorage.getItem('length_calculations') || '[]');
    const newCalculation = {
      ...calculation,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      jobType: jobType.name
    };
    savedCalculations.unshift(newCalculation);
    localStorage.setItem('length_calculations', JSON.stringify(savedCalculations.slice(0, 50)));
  };

  return (
    <>
      <Helmet>
        <title>{jobType.name} - Kalkulator Konstruksi</title>
        <meta name="description" content={jobType.description || 'Kalkulator khusus untuk menghitung biaya pekerjaan berdasarkan panjang dengan input material dan tenaga kerja'} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden text-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <Link
                  to={location.state?.from || "/"}
                  className="p-2 sm:p-3 rounded-lg hover:bg-white/10 transition-colors duration-200 touch-manipulation flex-shrink-0"
                  title="Kembali"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </Link>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate flex items-center">
                    <Ruler className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
                    Kalkulator Panjang - {jobType.name}
                  </h1>
                  <p className="text-primary-100 mt-1 text-sm sm:text-base lg:text-lg truncate">
                    {jobType.description || 'Kalkulator untuk menghitung biaya pekerjaan berdasarkan panjang'}
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-2 text-sm text-primary-200 flex-shrink-0">
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LengthCalculator jobType={jobType} onSave={handleSave} />
        </div>
      </div>
    </>
  );
};

export default LengthCalculatorPage;
