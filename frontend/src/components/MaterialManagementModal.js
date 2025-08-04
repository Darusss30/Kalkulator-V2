import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Plus, Edit, Trash2, Search, Package, Settings, Database } from 'lucide-react';
import toast from 'react-hot-toast';

import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import MaterialConversionModal from './MaterialConversionModal';

const MaterialManagementModal = ({
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' or 'compositions'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current body overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Fetch materials
  const { 
    data: materialsData, 
    isLoading: isLoadingMaterials, 
    error: materialsError 
  } = useQuery(
    ['materials', { page: currentPage, q: searchQuery }],
    () => apiService.materials.getMaterials({ 
      page: currentPage, 
      limit: 20, 
      q: searchQuery 
    }),
    {
      enabled: isOpen,
      keepPreviousData: true,
    }
  );

  // Fetch job type materials (compositions)
  const { 
    data: compositionsData, 
    isLoading: isLoadingCompositions, 
    error: compositionsError 
  } = useQuery(
    ['job-type-materials'],
    async () => {
      try {
        // Get all categories first
        const categoriesResponse = await apiService.jobs.getCategories({ limit: 100 });
        const categories = categoriesResponse?.data?.categories || [];
        
        // Get job types for each category with their materials
        const allJobTypes = [];
        
        for (const category of categories) {
          try {
            const jobTypesResponse = await apiService.jobs.getJobTypesByCategory(category.id, { limit: 100 });
            const jobTypes = jobTypesResponse?.data?.job_types || [];
            
            // Get detailed info for each job type including materials
            for (const jobType of jobTypes) {
              try {
                const detailResponse = await apiService.jobs.getJobType(jobType.id);
                const jobTypeDetail = detailResponse?.data?.job_type;
                
                // Add job type if it has materials or add it anyway for management
                if (jobTypeDetail) {
                  allJobTypes.push({
                    ...jobTypeDetail,
                    category_name: category.name,
                    materials: jobTypeDetail.materials || []
                  });
                }
              } catch (error) {
                // Add basic info even if detailed fetch fails
                allJobTypes.push({
                  ...jobType,
                  category_name: category.name,
                  materials: []
                });
              }
            }
          } catch (error) {
          }
        }
        
        return allJobTypes;
      } catch (error) {
        throw error;
      }
    },
    {
      enabled: isOpen && activeTab === 'compositions',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  );

  // Delete material mutation
  const deleteMaterialMutation = useMutation(
    (id) => apiService.materials.deleteMaterial(id),
    {
      onSuccess: () => {
        toast.success('Material berhasil dihapus');
        queryClient.invalidateQueries(['materials']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus material');
      }
    }
  );

  // Create material mutation
  const createMaterialMutation = useMutation(
    (materialData) => apiService.materials.createMaterial(materialData),
    {
      onSuccess: () => {
        toast.success('Material berhasil dibuat');
        queryClient.invalidateQueries(['materials']);
        setShowMaterialForm(false);
        setSelectedMaterial(null);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal membuat material');
      }
    }
  );

  // Update material mutation
  const updateMaterialMutation = useMutation(
    ({ id, data }) => apiService.materials.updateMaterial(id, data),
    {
      onSuccess: () => {
        toast.success('Material berhasil diupdate');
        queryClient.invalidateQueries(['materials']);
        setShowMaterialForm(false);
        setSelectedMaterial(null);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengupdate material');
      }
    }
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteMaterial = (material) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus material "${material.name}"?`)) {
      deleteMaterialMutation.mutate(material.id);
    }
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setShowMaterialForm(true);
  };

  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setShowMaterialForm(true);
  };

  const handleMaterialSubmit = (materialData) => {
    if (selectedMaterial) {
      updateMaterialMutation.mutate({
        id: selectedMaterial.id,
        data: materialData
      });
    } else {
      createMaterialMutation.mutate(materialData);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
        style={{ 
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: '16px'
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Material & Konversi
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola database material dan pengaturan konversi satuan
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {activeTab === 'compositions' && (
                  <button
                    onClick={handleAddMaterial}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Material & Konversi</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'materials'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4" />
                      <span>Database Material</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('compositions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'compositions'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Atur Material & Komposisi</span>
                    </div>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Search - Only show for materials tab */}
          {activeTab === 'materials' && (
            <div className="p-6 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari material..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
            {activeTab === 'materials' ? (
              // Materials Tab Content
              isLoadingMaterials ? (
                <div className="p-8 text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 mt-4">Memuat material...</p>
                </div>
              ) : materialsError ? (
                <div className="p-8 text-center">
                  <p className="text-red-600">Gagal memuat material</p>
                </div>
              ) : materialsData?.data?.materials?.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {searchQuery ? 'Tidak ada material yang ditemukan' : 'Belum ada material'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery ? `Untuk pencarian "${searchQuery}"` : 'Klik "Tambah Material & Konversi" untuk menambahkan material baru'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={handleAddMaterial}
                      className="btn-primary"
                    >
                      Tambah Material Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex-shrink-0">
                    <div className="grid grid-cols-11 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-4">Nama Material</div>
                      <div className="col-span-2">Satuan</div>
                      <div className="col-span-2">Harga</div>
                      <div className="col-span-2">Konversi</div>
                      <div className="col-span-1">Supplier</div>
                    </div>
                  </div>

                  {/* Table Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                    {materialsData?.data?.materials?.map((material) => (
                      <div key={material.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="grid grid-cols-11 gap-4 items-center">
                          <div className="col-span-4">
                            <div>
                              <p className="font-medium text-gray-900">{material.name}</p>
                              {material.description && (
                                <p className="text-sm text-gray-500 truncate">{material.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-gray-900">{material.unit}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {formatCurrency(material.price)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            {material.conversion_description ? (
                              <div>
                                <p className="text-xs text-blue-600 font-medium truncate">
                                  {material.conversion_description}
                                </p>
                                {material.base_unit && (
                                  <p className="text-xs text-gray-500">
                                    → {material.base_unit}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Tidak ada</span>
                            )}
                          </div>
                          <div className="col-span-1">
                            <span className="text-sm text-gray-600 truncate">
                              {material.supplier || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {materialsData?.data?.pagination && materialsData.data.pagination.pages > 1 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Menampilkan {((materialsData.data.pagination.page - 1) * materialsData.data.pagination.limit) + 1} - {Math.min(materialsData.data.pagination.page * materialsData.data.pagination.limit, materialsData.data.pagination.total)} dari {materialsData.data.pagination.total} material
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Sebelumnya
                          </button>
                          <span className="px-3 py-1 text-sm">
                            {currentPage} / {materialsData.data.pagination.pages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(materialsData.data.pagination.pages, prev + 1))}
                            disabled={currentPage === materialsData.data.pagination.pages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Compositions Tab Content
              isLoadingCompositions ? (
                <div className="p-8 text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 mt-4">Memuat komposisi material...</p>
                </div>
              ) : compositionsError ? (
                <div className="p-8 text-center">
                  <p className="text-red-600">Gagal memuat komposisi material</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {compositionsError.message || 'Terjadi kesalahan saat memuat data'}
                  </p>
                </div>
              ) : compositionsData?.length === 0 ? (
                <div className="p-8 text-center">
                  <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Belum ada komposisi material</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Komposisi material akan muncul setelah Anda mengatur material untuk job type
                  </p>
                  <button
                    onClick={handleAddMaterial}
                    className="btn-primary"
                  >
                    Tambah Material & Konversi
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Material Management Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Database className="w-5 h-5 text-primary-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Database Material</h4>
                      </div>
                      <div className="text-sm text-gray-500">
                        {materialsData?.data?.materials?.length || 0} material tersedia
                      </div>
                    </div>
                    
                    {/* Search for materials */}
                    <div className="mb-4">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari material..."
                          value={searchQuery}
                          onChange={handleSearch}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Materials Grid */}
                    {isLoadingMaterials ? (
                      <div className="text-center py-8">
                        <LoadingSpinner size="md" />
                        <p className="text-gray-600 mt-2">Memuat material...</p>
                      </div>
                    ) : materialsData?.data?.materials?.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">
                          {searchQuery ? 'Tidak ada material yang ditemukan' : 'Belum ada material'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                        {materialsData?.data?.materials?.map((material) => (
                          <div key={material.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900 text-sm">{material.name}</h5>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEditMaterial(material)}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="Edit Material"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMaterial(material)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="Hapus Material"
                                  disabled={deleteMaterialMutation.isLoading}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><span className="font-medium">Satuan:</span> {material.unit}</p>
                              <p><span className="font-medium">Harga:</span> {formatCurrency(material.price)}</p>
                              {material.conversion_description && (
                                <p className="text-blue-600"><span className="font-medium">Konversi:</span> {material.conversion_description}</p>
                              )}
                              {material.supplier && (
                                <p><span className="font-medium">Supplier:</span> {material.supplier}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Job Type Compositions Section */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Settings className="w-5 h-5 text-primary-600 mr-2" />
                      <h4 className="text-lg font-semibold text-gray-900">Komposisi Material per Job Type</h4>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {compositionsData.map((jobType) => (
                        <div key={jobType.id} className="py-6">
                          <div className="mb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{jobType.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{jobType.description}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {jobType.category_name}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {jobType.unit}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {jobType.materials?.length || 0} material
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {jobType.materials && jobType.materials.length > 0 ? (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Komposisi Material:</h5>
                              <div className="space-y-2">
                                {jobType.materials.map((material, index) => (
                                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{material.material_name}</p>
                                      <p className="text-xs text-gray-500">
                                        {material.quantity_per_unit} {material.material_unit} per {jobType.unit}
                                        {material.waste_factor > 0 && (
                                          <span className="text-orange-600 ml-1">
                                            (+{(material.waste_factor * 100).toFixed(1)}% waste)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-mono text-sm font-medium text-gray-900">
                                        {formatCurrency(material.cost_per_unit || 0)}
                                      </p>
                                      <p className="text-xs text-gray-500">per {jobType.unit}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-800">
                                Belum ada material yang dikonfigurasi untuk jenis pekerjaan ini.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Material Form Modal */}
      <MaterialConversionModal
        isOpen={showMaterialForm}
        onClose={() => {
          setShowMaterialForm(false);
          setSelectedMaterial(null);
        }}
        onSubmit={handleMaterialSubmit}
        material={selectedMaterial}
        isLoading={createMaterialMutation.isLoading || updateMaterialMutation.isLoading}
      />
    </>
  );
};

export default MaterialManagementModal;
