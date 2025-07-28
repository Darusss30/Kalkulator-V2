import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  ArrowRight, 
  Wrench, 
  Building, 
  Hammer, 
  PaintBucket,
  Zap,
  Droplets,
  Home as HomeIcon,
  Settings,
  Layers,
  Shield,
  Plus,
  Square,
  Wind,
  Lock,
  Sun,
  Truck,
  Flame,
  Cpu,
  Circle,
  Edit,
  Trash2
} from 'lucide-react';

import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryFormModal from '../components/CategoryFormModal';

// Icon mapping for categories
const categoryIcons = {
  'preparation': Wrench,
  'foundation': Shield,
  'structure': Building,
  'masonry': Hammer,
  'roof': HomeIcon,
  'ceiling': Layers,
  'door-window': Settings,
  'painting': PaintBucket,
  'electrical': Zap,
  'plumbing': Droplets,
  'excavation': Hammer,
  'concrete': Building,
  'steel': Settings,
  'wood': HomeIcon,
  'tile': Square,
  'glass': Square,
  'insulation': Circle,
  'ventilation': Wind,
  'security': Lock,
  'landscape': Circle,
  'road': Truck,
  'drainage': Droplets,
  'fire-safety': Flame,
  'hvac': Cpu,
  'solar': Sun,
};

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });

  const queryClient = useQueryClient();
  
  // Fetch job categories
  const { 
    data: categoriesData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['jobCategories', { search: searchQuery }],
    () => apiService.jobs.getCategories({ 
      q: searchQuery,
      limit: 20 
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  const categories = categoriesData?.data?.categories || [];
  
  // Create category mutation
  const createCategoryMutation = useMutation(
    (categoryData) => apiService.jobs.createCategory(categoryData),
    {
      onSuccess: () => {
        toast.success('Kategori berhasil dibuat');
        queryClient.invalidateQueries(['jobCategories']);
        setShowCategoryForm(false);
        setCategoryFormData({
          name: '',
          description: '',
          icon: ''
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal membuat kategori');
      }
    }
  );

  // Update category mutation
  const updateCategoryMutation = useMutation(
    ({ id, data }) => apiService.jobs.updateCategory(id, data),
    {
      onSuccess: () => {
        toast.success('Kategori berhasil diupdate');
        queryClient.invalidateQueries(['jobCategories']);
        setShowCategoryForm(false);
        setSelectedCategory(null);
        setCategoryFormData({
          name: '',
          description: '',
          icon: ''
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengupdate kategori');
      }
    }
  );

  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    (id) => apiService.jobs.deleteCategory(id),
    {
      onSuccess: () => {
        toast.success('Kategori berhasil dihapus');
        queryClient.invalidateQueries(['jobCategories']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus kategori');
      }
    }
  );

  // Category form handlers
  const handleCategoryFormSubmit = () => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        data: categoryFormData
      });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || ''
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (category) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      icon: ''
    });
    setShowCategoryForm(false);
  };
  
  // Update search params when search query changes
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the query refetch due to dependency
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat kategori pekerjaan..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-danger-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Gagal Memuat Data
          </h2>
          <p className="text-gray-600 mb-6">
            Terjadi kesalahan saat memuat kategori pekerjaan.
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Kalkulator Biaya Konstruksi Modular</title>
        <meta 
          name="description" 
          content="Pilih kategori pekerjaan konstruksi untuk menghitung biaya RAB. Tersedia 10 kategori lengkap dari persiapan hingga finishing." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20"></div>
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              {/* Logo */}
              <div className="mb-6 sm:mb-8">
                <img 
                  src="/logo.png" 
                  alt="Darus Sakinah Construction Calculator" 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain mx-auto border-8 border-white bg-white rounded-lg shadow-lg p-2"
                />
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                Kalkulator Biaya Konstruksi
              </h1>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto px-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari kategori atau jenis pekerjaan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 sm:pl-16 pr-12 sm:pr-16 py-4 sm:py-5 text-base sm:text-lg border-0 rounded-xl sm:rounded-2xl shadow-2xl focus:ring-4 focus:ring-primary-300/50 focus:outline-none bg-white/95 backdrop-blur-sm touch-manipulation"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all touch-manipulation"
                    >
                      <span className="text-lg sm:text-xl">×</span>
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                  {searchQuery ? 'Hasil Pencarian' : 'Kategori Pekerjaan Konstruksi'}
                </h2>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium touch-manipulation"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Kategori</span>
                </button>
              )}
            </div>
            
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {searchQuery 
                ? `Menampilkan hasil untuk "${searchQuery}"`
                : 'Pilih kategori pekerjaan untuk memulai kalkulasi biaya konstruksi'
              }
            </p>
            
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium touch-manipulation"
              >
                ← Kembali ke semua kategori
              </button>
            )}
          </div>
          
          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.icon] || Building;
                
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 border border-gray-100 overflow-hidden hover:border-primary-200 touch-manipulation relative block"
                  >
                    {/* Admin Controls */}
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditCategory(category);
                        }}
                        className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors shadow-md"
                        title="Edit kategori"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCategory(category);
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-md"
                        title="Hapus kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md group-hover:from-primary-200 group-hover:to-primary-300">
                          <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                      
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                        {category.name}
                      </h3>
                      
                      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 line-clamp-3 leading-relaxed">
                        {category.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full font-medium">
                          {category.job_types_count || 0} jenis pekerjaan
                        </span>
                        <span className="text-sm sm:text-base lg:text-lg text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                          Mulai Kalkulasi →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                {searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Kategori'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {searchQuery 
                  ? `Tidak ditemukan kategori yang cocok dengan "${searchQuery}"`
                  : 'Belum ada kategori pekerjaan yang tersedia'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="btn-primary touch-manipulation"
                >
                  Lihat Semua Kategori
                </button>
              )}
            </div>
          )}
        </div>

          {/* Footer */}
          <div className="bg-gray-100 py-6 sm:py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm sm:text-base text-gray-600">
                © 2025 Darus Sakinah Construction Calculator
              </p>
            </div>
          </div>
        </div>

        {/* Category Form Modal */}
        <CategoryFormModal
          isOpen={showCategoryForm}
          onClose={resetCategoryForm}
          onSubmit={handleCategoryFormSubmit}
          formData={categoryFormData}
          setFormData={setCategoryFormData}
          isLoading={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
          isEditing={!!selectedCategory}
        />
    </>
  );
};

export default HomePage;
