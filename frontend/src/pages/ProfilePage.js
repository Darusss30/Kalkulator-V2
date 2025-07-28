import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Edit3, Save, X, Lock, Mail, UserCheck, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfilePage = () => {
  const { user, isAuthenticated, updateProfile, changePassword, isUpdatingProfile, isChangingPassword } = useAuth();
  const navigate = useNavigate();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [errors, setErrors] = useState({});

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
          
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Login Diperlukan
            </h1>
            <p className="text-gray-600 mb-8">
              Silakan login untuk mengakses halaman profil.
            </p>
            
            <div className="space-x-4">
              <Link to="/login" className="btn-primary">
                Login
              </Link>
              <Link to="/" className="btn-secondary">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await updateProfile(profileData);
      setIsEditingProfile(false);
      setErrors({});
    } catch (error) {
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!passwordData.current_password) {
      newErrors.current_password = 'Password saat ini harus diisi';
    }
    
    if (!passwordData.new_password) {
      newErrors.new_password = 'Password baru harus diisi';
    } else if (passwordData.new_password.length < 6) {
      newErrors.new_password = 'Password baru minimal 6 karakter';
    }
    
    if (!passwordData.confirm_password) {
      newErrors.confirm_password = 'Konfirmasi password harus diisi';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Password tidak cocok';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setIsChangingPass(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setErrors({});
    } catch (error) {
    }
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setProfileData({
      full_name: user?.full_name || '',
      email: user?.email || ''
    });
    setErrors({});
  };

  const cancelPasswordChange = () => {
    setIsChangingPass(false);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user?.username?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user?.full_name || user?.username}
                </h1>
                <p className="text-primary-100">{user?.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-primary-100">
                    <UserCheck className="w-4 h-4" />
                    <span className="text-sm capitalize">{user?.role}</span>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex items-center space-x-1 text-yellow-200">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Administrator</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Details */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Informasi Profil</h2>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={profileData.full_name}
                        onChange={handleProfileInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={profileData.email}
                        onChange={handleProfileInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Masukkan email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Simpan</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Batal</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                      <p className="text-gray-900">{user?.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
                      <p className="text-gray-900">{user?.full_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                      <p className="text-gray-900 capitalize">{user?.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Bergabung</label>
                      <p className="text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Ubah Password</h2>
                  {!isChangingPass && (
                    <button
                      onClick={() => setIsChangingPass(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Ubah Password</span>
                    </button>
                  )}
                </div>

                {isChangingPass ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password Saat Ini <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="current_password"
                        name="current_password"
                        type="password"
                        required
                        value={passwordData.current_password}
                        onChange={handlePasswordInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.current_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Masukkan password saat ini"
                      />
                      {errors.current_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="new_password"
                        name="new_password"
                        type="password"
                        required
                        value={passwordData.new_password}
                        onChange={handlePasswordInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.new_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Masukkan password baru"
                      />
                      {errors.new_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password Baru <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        required
                        value={passwordData.confirm_password}
                        onChange={handlePasswordInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Konfirmasi password baru"
                      />
                      {errors.confirm_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {isChangingPassword ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span>Mengubah...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Ubah Password</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelPasswordChange}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Batal</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Klik tombol "Ubah Password" untuk mengubah password Anda
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
