import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Shield, 
  ArrowLeft, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Briefcase,
  Save,
  X,
  AlertCircle,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import MaterialSpreadsheetOptimized from '../components/MaterialSpreadsheetOptimized';
import MaterialConversionModal from '../components/MaterialConversionModal';

const AdminPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('materials');
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Material edit state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  
  // Job Types state
  const [jobTypesSearchQuery, setJobTypesSearchQuery] = useState('');
  const [jobTypesCurrentPage, setJobTypesCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showJobTypeForm, setShowJobTypeForm] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState(null);
  const [jobTypeFormData, setJobTypeFormData] = useState({
    category_id: '',
    name: '',
    unit: '',
    description: '',
    base_productivity: ''
  });
  
  // Always allow access (no authentication required)
  const isAdmin = true;
  
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
      keepPreviousData: true,
    }
  );
  
  // Fetch job categories
  const { 
    data: categoriesData, 
    isLoading: isLoadingCategories, 
    error: categoriesError 
  } = useQuery(
    ['categories'],
    () => apiService.jobs.getCategories({ limit: 100 }),
    {
      enabled: activeTab === 'jobtypes',
    }
  );
  
  // Fetch job types
  const { 
    data: jobTypesData, 
    isLoading: isLoadingJobTypes, 
    error: jobTypesError 
  } = useQuery(
    ['jobtypes', { category: selectedCategory, page: jobTypesCurrentPage, q: jobTypesSearchQuery }],
    () => {
      if (selectedCategory) {
        return apiService.jobs.getJobTypes(selectedCategory, { 
          page: jobTypesCurrentPage, 
          limit: 20, 
          q: jobTypesSearchQuery 
        });
      } else {
        // Get all job types from all categories
        return Promise.all(
          categoriesData?.data?.categories?.map(category => 
            apiService.jobs.getJobTypes(category.id, { limit: 100 })
          ) || []
        ).then(results => {
          const allJobTypes = results.flatMap(result => 
            result.data.job_types.map(jobType => ({
              ...jobType,
              category_name: result.data.category.name
            }))
          );
          
          // Apply search filter
          const filteredJobTypes = jobTypesSearchQuery 
            ? allJobTypes.filter(jobType => 
                jobType.name.toLowerCase().includes(jobTypesSearchQuery.toLowerCase()) ||
                jobType.category_name.toLowerCase().includes(jobTypesSearchQuery.toLowerCase())
              )
            : allJobTypes;
          
          // Apply pagination
          const startIndex = (jobTypesCurrentPage - 1) * 20;
          const endIndex = startIndex + 20;
          const paginatedJobTypes = filteredJobTypes.slice(startIndex, endIndex);
          
          return {
            data: {
              job_types: paginatedJobTypes,
              pagination: {
                page: jobTypesCurrentPage,
                limit: 20,
                total: filteredJobTypes.length,
                pages: Math.ceil(filteredJobTypes.length / 20)
              }
            }
          };
        });
      }
    },
    {
      enabled: activeTab === 'jobtypes' && !!categoriesData,
      keepPreviousData: true,
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
  
  // Create job type mutation
  const createJobTypeMutation = useMutation(
    (jobTypeData) => apiService.jobs.createJobType(jobTypeData),
    {
      onSuccess: () => {
        toast.success('Job type berhasil dibuat');
        queryClient.invalidateQueries(['jobtypes']);
        queryClient.invalidateQueries(['categories']);
        setShowJobTypeForm(false);
        setJobTypeFormData({
          category_id: '',
          name: '',
          unit: '',
          description: '',
          base_productivity: ''
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal membuat job type');
      }
    }
  );
  
  // Update job type mutation
  const updateJobTypeMutation = useMutation(
    ({ id, data }) => apiService.jobs.updateJobType(id, data),
    {
      onSuccess: () => {
        toast.success('Job type berhasil diupdate');
        queryClient.invalidateQueries(['jobtypes']);
        queryClient.invalidateQueries(['categories']);
        setShowJobTypeForm(false);
        setSelectedJobType(null);
        setJobTypeFormData({
          category_id: '',
          name: '',
          unit: '',
          description: '',
          base_productivity: ''
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengupdate job type');
      }
    }
  );
  
  // Delete job type mutation
  const deleteJobTypeMutation = useMutation(
    (id) => apiService.jobs.deleteJobType(id),
    {
      onSuccess: () => {
        toast.success('Job type berhasil dihapus');
        queryClient.invalidateQueries(['jobtypes']);
        queryClient.invalidateQueries(['categories']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus job type');
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
  
  const handleImportSuccess = () => {
    queryClient.invalidateQueries(['materials']);
    setShowSpreadsheet(false);
  };
  
  // Job Types handlers
  const handleJobTypesSearch = (e) => {
    setJobTypesSearchQuery(e.target.value);
    setJobTypesCurrentPage(1);
  };
  
  const handleJobTypeFormSubmit = (e) => {
    e.preventDefault();
    
    if (selectedJobType) {
      updateJobTypeMutation.mutate({
        id: selectedJobType.id,
        data: {
          ...jobTypeFormData,
          base_productivity: jobTypeFormData.base_productivity ? parseFloat(jobTypeFormData.base_productivity) : null
        }
      });
    } else {
      createJobTypeMutation.mutate({
        ...jobTypeFormData,
        base_productivity: jobTypeFormData.base_productivity ? parseFloat(jobTypeFormData.base_productivity) : null
      });
    }
  };
  
  const handleEditJobType = (jobType) => {
    setSelectedJobType(jobType);
    setJobTypeFormData({
      category_id: jobType.category_id?.toString() || '',
      name: jobType.name || '',
      unit: jobType.unit || '',
      description: jobType.description || '',
      base_productivity: jobType.base_productivity?.toString() || ''
    });
    setShowJobTypeForm(true);
  };
  
  const handleDeleteJobType = (jobType) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus job type "${jobType.name}"?`)) {
      deleteJobTypeMutation.mutate(jobType.id);
    }
  };
  
  const resetJobTypeForm = () => {
    setSelectedJobType(null);
    setJobTypeFormData({
      category_id: '',
      name: '',
      unit: '',
      description: '',
      base_productivity: ''
    });
    setShowJobTypeForm(false);
  };
  
  
  return (
    <>
      <Helmet>
        <title>Panel Admin - Kalkulator Konstruksi</title>
        <meta name="description" content="Panel administrasi untuk mengelola material dan data kalkulator konstruksi" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="w-8 h-8 text-primary-600 mr-3" />
                    Panel Administrasi
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Kelola material konstruksi dan jenis pekerjaan untuk sistem kalkulator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Admin Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Panel Administrasi
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Kelola database material dan jenis pekerjaan konstruksi. Perubahan akan mempengaruhi semua kalkulasi baru.
                </p>
              </div>
            </div>
          </div>
          
          {/* Search and Filters - Similar to HistoryPage */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="space-y-4">
              {/* Tab Selection */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'materials'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Material</span>
                </button>
                <button
                  onClick={() => setActiveTab('jobtypes')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'jobtypes'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Job Types</span>
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'materials' 
                      ? "Cari material..." 
                      : activeTab === 'jobtypes'
                      ? "Cari job type..."
                      : "Cari aturan konversi..."
                  }
                  value={activeTab === 'materials' ? searchQuery : jobTypesSearchQuery}
                  onChange={activeTab === 'materials' ? handleSearch : handleJobTypesSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {activeTab === 'materials' 
                    ? `${materialsData?.data?.pagination?.total || 0} material ditemukan`
                    : activeTab === 'jobtypes'
                    ? `${jobTypesData?.data?.pagination?.total || 0} job type ditemukan`
                    : "Kelola aturan konversi material"
                  }
                </div>
                <div className="flex items-center space-x-3">
                  {activeTab === 'materials' ? (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleAddMaterial}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Material & Konversi</span>
                      </button>
                      <button
                        onClick={() => setShowSpreadsheet(true)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Package className="w-4 h-4" />
                        <span>Input Spreadsheet</span>
                      </button>
                    </div>
                  ) : activeTab === 'jobtypes' ? (
                    <button
                      onClick={() => setShowJobTypeForm(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Job Type</span>
                    </button>
                  ) : (
                    <button
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Kelola Aturan Konversi Material</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Content */}
          {activeTab === 'materials' ? (
            /* Materials Content */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {isLoadingMaterials ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" text="Memuat material..." />
                </div>
              ) : materialsError ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Material</h3>
                  <p className="text-gray-600 mb-4">{materialsError.message || 'Terjadi kesalahan saat memuat data'}</p>
                </div>
              ) : materialsData?.data?.materials?.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Material</h3>
                  <p className="text-gray-600">Klik "Input Spreadsheet" untuk menambahkan material dari spreadsheet Anda</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[800px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satuan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {materialsData?.data?.materials?.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{material.name}</div>
                              {material.description && (
                                <div className="text-sm text-gray-500">{material.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {material.unit}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Rp {material.price?.toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {material.supplier || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditMaterial(material)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Hapus"
                                disabled={deleteMaterialMutation.isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    
                    {/* Pagination */}
                    {materialsData?.data?.pagination && (
                      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
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
              )}
            </div>
          ) : activeTab === 'jobtypes' ? (
            /* Job Types Content */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {isLoadingJobTypes ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" text="Memuat job types..." />
                </div>
              ) : jobTypesError ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Job Types</h3>
                  <p className="text-gray-600 mb-4">{jobTypesError.message || 'Terjadi kesalahan saat memuat data'}</p>
                </div>
              ) : jobTypesData?.data?.job_types?.length === 0 ? (
                <div className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Job Type</h3>
                  <p className="text-gray-600">Klik "Tambah Job Type" untuk menambahkan jenis pekerjaan baru</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[1000px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Job Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satuan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produktivitas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deskripsi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobTypesData?.data?.job_types?.map((jobType) => (
                        <tr key={jobType.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{jobType.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {jobType.category_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {jobType.unit}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {jobType.base_productivity ? `${jobType.base_productivity} ${jobType.unit}/hari` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="max-w-xs truncate">
                              {jobType.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditJobType(jobType)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJobType(jobType)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Hapus"
                                disabled={deleteJobTypeMutation.isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {jobTypesData?.data?.pagination && jobTypesData.data.pagination.pages > 1 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Menampilkan {((jobTypesData.data.pagination.page - 1) * jobTypesData.data.pagination.limit) + 1} - {Math.min(jobTypesData.data.pagination.page * jobTypesData.data.pagination.limit, jobTypesData.data.pagination.total)} dari {jobTypesData.data.pagination.total} job type
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setJobTypesCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={jobTypesCurrentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Sebelumnya
                          </button>
                          <span className="px-3 py-1 text-sm">
                            {jobTypesCurrentPage} / {jobTypesData.data.pagination.pages}
                          </span>
                          <button
                            onClick={() => setJobTypesCurrentPage(prev => Math.min(jobTypesData.data.pagination.pages, prev + 1))}
                            disabled={jobTypesCurrentPage === jobTypesData.data.pagination.pages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Conversion Rules Content */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 text-center">
                <Settings className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kelola Aturan Konversi Material</h3>
                <p className="text-gray-600 mb-6">
                  Atur aturan konversi material untuk berbagai jenis pekerjaan konstruksi. 
                  Sistem akan menggunakan aturan ini untuk menghitung kebutuhan material secara otomatis.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-blue-900 mb-2">Fitur Aturan Konversi:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Aturan konversi berdasarkan pola nama material dan satuan</li>
                    <li>• Konversi spesifik untuk jenis pekerjaan (contoh: Beton K225, Granit 60x60cm)</li>
                    <li>• Prioritas aturan untuk menentukan konversi yang tepat</li>
                    <li>• Data konversi tambahan dalam format JSON untuk kebutuhan kompleks</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-green-900 mb-2">Aturan yang Sudah Tersedia:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>✅ <strong>Beton K225</strong>: Semen (0.0250 sak/m³), Pasir (0.4 m³/m³), Kerikil (0.7 m³/m³)</li>
                    <li>✅ <strong>Granit 60x60cm</strong>: Granit (0.6944 dus/m²), Pasir Japanan (0.0343 m³/m²), Lem Granit (1.5 kg/m²)</li>
                    <li>✅ <strong>Semen Portland</strong>: 1 sak = 40 kg (data riset lokal)</li>
                    <li>✅ <strong>Agregat Truk</strong>: 1 truk = 7 m³ (pasir, kerikil)</li>
                  </ul>
                </div>
                <button
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Settings className="w-5 h-5" />
                  <span>Buka Kelola Aturan Konversi</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Material Spreadsheet Modal */}
        {showSpreadsheet && (
          <MaterialSpreadsheetOptimized
            onClose={() => setShowSpreadsheet(false)}
            onImportSuccess={handleImportSuccess}
          />
        )}
        
        {/* Material Conversion Modal */}
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
        
        {/* Job Type Form Modal */}
        {showJobTypeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedJobType ? 'Edit Job Type' : 'Tambah Job Type'}
                  </h3>
                  <button
                    onClick={resetJobTypeForm}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleJobTypeFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori *
                    </label>
                    <select
                      value={jobTypeFormData.category_id}
                      onChange={(e) => setJobTypeFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Kategori</option>
                      {categoriesData?.data?.categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Job Type *
                    </label>
                    <input
                      type="text"
                      value={jobTypeFormData.name}
                      onChange={(e) => setJobTypeFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Contoh: Kolom Struktur K-300"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satuan *
                    </label>
                    <input
                      type="text"
                      value={jobTypeFormData.unit}
                      onChange={(e) => setJobTypeFormData(prev => ({ ...prev, unit: e.target.value }))}
                      required
                      placeholder="Contoh: m3, m2, m, unit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produktivitas (per hari)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={jobTypeFormData.base_productivity}
                      onChange={(e) => setJobTypeFormData(prev => ({ ...prev, base_productivity: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="Contoh: 3.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Berapa {jobTypeFormData.unit || 'satuan'} yang bisa diselesaikan per hari oleh tim standar
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      value={jobTypeFormData.description}
                      onChange={(e) => setJobTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Deskripsi singkat tentang jenis pekerjaan ini..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={createJobTypeMutation.isLoading || updateJobTypeMutation.isLoading}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {createJobTypeMutation.isLoading || updateJobTypeMutation.isLoading 
                          ? 'Menyimpan...' 
                          : selectedJobType ? 'Update' : 'Simpan'
                        }
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={resetJobTypeForm}
                      className="btn-ghost"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPage;
