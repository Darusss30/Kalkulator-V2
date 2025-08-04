import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Calculator-related pages
const JobTypePage = React.lazy(() => import('./pages/JobTypePage'));
const CalcPage = React.lazy(() => import('./pages/CalcPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const LengthCalculatorPage = React.lazy(() => import('./pages/LengthCalculatorPage'));
const AreaCalculatorPage = React.lazy(() => import('./pages/AreaCalculatorPage'));
const VolumeCalculatorPage = React.lazy(() => import('./pages/VolumeCalculatorPage'));
const BeamCalculatorPage = React.lazy(() => import('./pages/BeamCalculatorPage'));
const FootplateCalculatorPage = React.lazy(() => import('./pages/FootplateCalculatorPage'));
const PlasterCalculatorPage = React.lazy(() => import('./pages/PlasterCalculatorPage'));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Memuat halaman...</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <Helmet>
        <title>Kalkulator Biaya Konstruksi Modular</title>
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <div className="App min-h-screen bg-gray-50">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              {/* Home - Job Categories */}
              <Route index element={<HomePage />} />
              
              {/* Profile Page */}
              <Route 
                path="/profile" 
                element={<ProfilePage />} 
              />
              
              {/* Admin Page */}
              <Route 
                path="/admin" 
                element={<AdminPage />} 
              />
              
              {/* Calculator routes */}
              <Route 
                path="/category/:categoryId" 
                element={<JobTypePage />} 
              />
              <Route 
                path="/calculate/:jobTypeId" 
                element={<CalcPage />} 
              />
              <Route 
                path="/history" 
                element={<HistoryPage />} 
              />
              <Route 
                path="/length-calculator" 
                element={<LengthCalculatorPage />} 
              />
              <Route 
                path="/area-calculator" 
                element={<AreaCalculatorPage />} 
              />
              <Route 
                path="/volume-calculator" 
                element={<VolumeCalculatorPage />} 
              />
              <Route 
                path="/beam-calculator" 
                element={<BeamCalculatorPage />} 
              />
              <Route 
                path="/footplate-calculator" 
                element={<FootplateCalculatorPage />} 
              />
              <Route 
                path="/plaster-calculator" 
                element={<PlasterCalculatorPage />} 
              />
            </Route>
            
            {/* Authentication Routes - Outside Layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export default App;
