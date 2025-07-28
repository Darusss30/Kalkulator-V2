import React, { useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  Calculator, 
  Search, 
  Building,
  ArrowRight,
  Zap,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  Settings,
  Ruler
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import JobTypeFormModal from '../components/JobTypeFormModal';
import MaterialManagementModal from '../components/MaterialManagementModal';
import JobTypeLaborModal from '../components/JobTypeLaborModal';
import JobTypeMaterialModal from '../components/JobTypeMaterialModal';

const JobTypePage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Admin state
  const [showJobTypeForm, setShowJobTypeForm] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState(null);
  const [jobTypeFormData, setJobTypeFormData] = useState({
    category_id: categoryId,
    name: '',
    unit: '',
    description: '',
    base_productivity: ''
  });

  // Material and Labor Management state
  const [showMaterialManagementModal, setShowMaterialManagementModal] = useState(false);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [showMaterialAssignmentModal, setShowMaterialAssignmentModal] = useState(false);
  const [selectedJobTypeForManagement, setSelectedJobTypeForManagement] = useState(null);
  
  // Calculator Selection state
  const [showCalculatorSelector, setShowCalculatorSelector] = useState(false);
  const [selectedJobTypeForCalculator, setSelectedJobTypeForCalculator] = useState(null);
  
  // Allow all users to manage job types (no login restriction)
  const isAdmin = true;
  
  // Fetch job types for this category
  const { 
    data: jobTypesData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['jobTypes', categoryId, { search: searchQuery }],
    () => apiService.jobs.getJobTypes(categoryId, { 
      q: searchQuery,
      limit: 50 
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Fetch categories for the form modal
  const { data: categoriesData } = useQuery(
    ['categories'],
    () => apiService.jobs.getCategories({ limit: 100 }),
    {
      enabled: Boolean(isAdmin && showJobTypeForm),
    }
  );

  // Fetch materials for material assignment modal
  const { data: materialsData } = useQuery(
    ['materials'],
    () => apiService.materials.getMaterials({ limit: 500 }),
    {
      enabled: Boolean(showMaterialAssignmentModal),
    }
  );
  
  const category = jobTypesData?.data?.category;
  const jobTypes = jobTypesData?.data?.job_types || [];
  const categories = categoriesData?.data?.categories || [];
  const materials = materialsData?.data?.materials || [];
  
  // Available Calculator Types
  const calculatorTypes = [
    {
      id: 'length',
      name: 'Kalkulator Panjang',
      description: 'Kalkulator khusus menghitung panjang proyek konstruksi',
      icon: Ruler,
      color: 'amber'
    },
    {
      id: 'area',
      name: 'Area Calculator',
      description: 'Kalkulator untuk menghitung biaya pekerjaan berdasarkan luas dengan berbagai bentuk geometri (persegi, segitiga, lingkaran, dll)',
      icon: Calculator,
      color: 'green'
    },
    {
      id: 'volume',
      name: 'Kalkulator Volume',
      description: 'Kalkulator untuk menghitung biaya pekerjaan berdasarkan volume dengan berbagai bentuk bangun ruang (kubus, silinder, bola, kerucut, dll)',
      icon: Building,
      color: 'blue'
    },
    {
      id: 'beam',
      name: 'Kalkulator Struktur',
      description: 'Kalkulator khusus untuk menghitung biaya pekerjaan balok struktur beton bertulang dengan konfigurasi tulangan dan campuran beton',
      icon: Building,
      color: 'purple'
    },
    {
      id: 'footplate',
      name: 'Kalkulator Footplate',
      description: 'Kalkulator khusus untuk menghitung biaya pekerjaan footplate beton bertulang dengan tulangan dua arah',
      icon: Building,
      color: 'indigo'
    }
  ]
  
  // Create job type mutation
  const createJobTypeMutation = useMutation(
    (jobTypeData) => apiService.jobs.createJobType(jobTypeData),
    {
      onSuccess: () => {
        toast.success('Job type berhasil dibuat');
        queryClient.invalidateQueries(['jobTypes']);
        resetJobTypeForm();
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
        queryClient.invalidateQueries(['jobTypes']);
        resetJobTypeForm();
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengupdate job type');
      }
    }
  );
  
  // Delete job type mutation
  const deleteJobTypeMutation = useMutation(
    ({ id, force = false }) => apiService.jobs.deleteJobType(id, force),
    {
      onSuccess: (data) => {
        const message = data.deleted_calculations > 0 
          ? `Job type berhasil dihapus beserta ${data.deleted_calculations} kalkulasi terkait`
          : 'Job type berhasil dihapus';
        toast.success(message);
        queryClient.invalidateQueries(['jobTypes']);
      },
      onError: (error) => {
        console.log('Delete error:', error);
        // Don't show toast for 409 errors - we'll handle them in the delete handler
        if (error.error !== 'Cannot delete job type') {
          toast.error(error.message || 'Gagal menghapus job type');
        }
      }
    }
  );


  // Labor and Material assignment mutations
  const updateLaborAssignmentsMutation = useMutation(
    ({ jobTypeId, laborAssignments }) => apiService.jobTypeManagement.updateLaborAssignments(jobTypeId, laborAssignments),
    {
      onSuccess: () => {
        toast.success('Pengaturan upah pekerja berhasil disimpan');
        setShowLaborModal(false);
        setSelectedJobTypeForManagement(null);
        // Refresh job types data to get updated information
        queryClient.invalidateQueries(['jobTypes']);
      },
      onError: (error) => {
        
        // Handle specific error types
        if (error.error === 'Validation error') {
          toast.error(`Validasi gagal: ${error.message}`);
        } else if (error.error === 'Duplicate entry') {
          toast.error(`Data duplikat: ${error.message}`);
        } else if (error.error === 'Job type not found') {
          toast.error('Jenis pekerjaan tidak ditemukan');
        } else {
          toast.error(error.message || 'Gagal menyimpan pengaturan upah');
        }
      }
    }
  );

  const updateMaterialAssignmentsMutation = useMutation(
    ({ jobTypeId, materialAssignments }) => apiService.jobTypeManagement.updateMaterialAssignments(jobTypeId, materialAssignments),
    {
      onSuccess: () => {
        toast.success('Komposisi material berhasil disimpan');
        setShowMaterialAssignmentModal(false);
        setSelectedJobTypeForManagement(null);
        // Refresh job types data to get updated material information
        queryClient.invalidateQueries(['jobTypes']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menyimpan komposisi material');
      }
    }
  );
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the query refetch due to dependency
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Job type form handlers
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
      category_id: jobType.category_id?.toString() || categoryId,
      name: jobType.name || '',
      unit: jobType.unit || '',
      description: jobType.description || '',
      base_productivity: jobType.base_productivity?.toString() || ''
    });
    setShowJobTypeForm(true);
  };
  
  const handleDeleteJobType = async (jobType) => {
    try {
      // First attempt: try normal delete
      await deleteJobTypeMutation.mutateAsync({ id: jobType.id, force: false });
    } catch (error) {
      // Handle 409 Conflict error (job type has associated calculations)
      if (error.error === 'Cannot delete job type' && error.details) {
        const { job_type_name, calculations_count } = error.details;
        
        const confirmMessage = `Job type "${job_type_name}" memiliki ${calculations_count} kalkulasi terkait.\n\n` +
          `Jika Anda melanjutkan penghapusan:\n` +
          `• Job type "${job_type_name}" akan dihapus\n` +
          `• ${calculations_count} kalkulasi terkait akan ikut dihapus\n` +
          `• Data yang dihapus tidak dapat dikembalikan\n\n` +
          `Apakah Anda yakin ingin melanjutkan?`;
        
        if (window.confirm(confirmMessage)) {
          try {
            // Force delete with associated calculations
            await deleteJobTypeMutation.mutateAsync({ id: jobType.id, force: true });
          } catch (forceError) {
            toast.error(forceError.message || 'Gagal menghapus job type');
          }
        }
      } else {
        // Handle other errors
        toast.error(error.message || 'Gagal menghapus job type');
      }
    }
  };
  
  const resetJobTypeForm = () => {
    setSelectedJobType(null);
    setJobTypeFormData({
      category_id: categoryId,
      name: '',
      unit: '',
      description: '',
      base_productivity: ''
    });
    setShowJobTypeForm(false);
  };
  
  const handleAddJobType = () => {
    setJobTypeFormData({
      category_id: categoryId,
      name: '',
      unit: '',
      description: '',
      base_productivity: ''
    });
    setShowJobTypeForm(true);
  };


  // Labor management handlers
  const handleManageLabor = (jobType) => {
    setSelectedJobTypeForManagement(jobType);
    setShowLaborModal(true);
  };

  const handleLaborSubmit = (formData) => {
    
    updateLaborAssignmentsMutation.mutate({
      jobTypeId: selectedJobTypeForManagement.id,
      laborAssignments: formData.labor_assignments
    });
  };

  // Material assignment handlers
  const handleManageMaterials = async (jobType) => {
    try {
      // Fetch detailed job type data with materials
      const response = await apiService.jobs.getJobType(jobType.id);
      const detailedJobType = response.data.job_type;
      
      
      // Use material_assignments field for compatibility
      if (!detailedJobType.material_assignments) {
        if (detailedJobType.materials) {
          detailedJobType.material_assignments = detailedJobType.materials;
        } else {
          detailedJobType.material_assignments = [];
        }
      }
      
      setSelectedJobTypeForManagement(detailedJobType);
      setShowMaterialAssignmentModal(true);
    } catch (error) {
      toast.error('Gagal memuat detail job type');
    }
  };

  const handleMaterialAssignmentSubmit = (formData) => {
    updateMaterialAssignmentsMutation.mutate({
      jobTypeId: selectedJobTypeForManagement.id,
      materialAssignments: formData.material_assignments
    });
  };

  // Calculator configuration mutation
  const updateCalculatorConfigMutation = useMutation(
    ({ jobTypeId, calculatorConfig, calculatorType }) => {
      // Send input_config and mark as configured
      const updateData = {
        input_config: calculatorConfig ? JSON.stringify(calculatorConfig) : null,
        calculator_configured: true // Mark that calculator has been configured
      };

      return apiService.jobs.updateJobType(jobTypeId, updateData);
    },
    {
      onSuccess: () => {
        toast.success('Konfigurasi kalkulator berhasil disimpan');
        queryClient.invalidateQueries(['jobTypes']);
        setShowCalculatorSelector(false);
        setSelectedJobTypeForCalculator(null);
      },
      onError: (error) => {
        
        // Show more specific error messages
        if (error.details && Array.isArray(error.details)) {
          error.details.forEach(detail => {
            toast.error(`${detail.param}: ${detail.msg}`);
          });
        } else {
          toast.error(error.message || 'Gagal menyimpan konfigurasi kalkulator');
        }
      }
    }
  );

  // Calculator selection handlers
  const handleJobTypeClick = (jobType) => {
    setSelectedJobTypeForCalculator(jobType);
    setShowCalculatorSelector(true);
  };

  // Navigate to calculator with proper state
  const navigateToCalculator = (jobTypeId, calculatorType = null) => {
    const jobType = jobTypes.find(jt => jt.id === jobTypeId);
    
    // Check if job type has a specific redirect URL configured
    if (jobType?.input_config) {
      try {
        const config = JSON.parse(jobType.input_config);
        if (config.redirect_url) {
          // Navigate to the specific calculator page
          navigate(config.redirect_url, {
            state: {
              from: location.pathname,
              jobType: jobType,
              jobTypeId: jobTypeId
            }
          });
          return;
        }
      } catch (error) {
        console.warn('Failed to parse job type config:', error);
      }
    }
    
    // Default navigation to CalcPage
    const navigateUrl = calculatorType 
      ? `/calculate/${jobTypeId}?calculator=${calculatorType}`
      : `/calculate/${jobTypeId}`;
    
    navigate(navigateUrl, {
      state: {
        from: location.pathname,
        jobType: jobType
      }
    });
  };

  const handleCalculatorSelect = (calculatorType) => {
    const jobType = selectedJobTypeForCalculator;
    
    // Create calculator configuration based on type
    let calculatorConfig = null;
    
    switch (calculatorType.id) {
      case 'length':
        calculatorConfig = {
          type: 'length',
          redirect_url: '/length-calculator',
          fields: [
            { name: 'project_name', label: 'Nama Proyek', unit: '', required: false, placeholder: 'Opsional' },
            { name: 'volume', label: 'Volume', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'productivity', label: 'Produktivitas', unit: 'm/hari', required: true, min: 0.01, step: 0.01 },
            { name: 'profit_percentage', label: 'Keuntungan', unit: '%', required: true, default: 20, min: 0, step: 0.1 },
            { name: 'waste_factor', label: 'Faktor Pemborosan', unit: '%', required: true, default: 5, min: 0, step: 0.1 },
            { name: 'num_tukang', label: 'Jumlah Tukang', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'num_pekerja', label: 'Jumlah Pekerja', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'worker_ratio_display', label: 'Rasio Pekerja', unit: 'tukang:pekerja', required: true, default: '1:1', type: 'select', options: ['0:1', '1:1', '1:2', '2:1', '1:3', '3:1', '2:3', '3:2'] }
          ],
          calculation: 'length_calculation_with_ratio',
          description: 'Kalkulator panjang dengan input material, tenaga kerja, dan rasio pekerja untuk perhitungan yang lebih akurat',
          features: [
            'material_input_optional', 
            'labor_calculation_with_ratio', 
            'hpp_rab_output_detailed', 
            'table_format_new',
            'waste_factor_calculation',
            'profit_margin_calculation'
          ],
          output_format: {
            type: 'table',
            columns: ['Volume', 'Satuan', 'Bahan', 'Tukang', 'HPP Bahan', 'HPP Tukang', 'RAB Bahan', 'RAB Tukang', 'HPP', 'RAB', 'Keuntungan'],
            details: ['labor_breakdown', 'material_breakdown', 'summary_cards']
          },
          labor_rates: {
            tukang: 150000,
            pekerja: 135000
          }
        };
        break;
        
      case 'area':
        calculatorConfig = {
          type: 'area',
          redirect_url: '/area-calculator',
          fields: [
            { name: 'project_name', label: 'Nama Proyek', unit: '', required: false, placeholder: 'Opsional' },
            { name: 'shape', label: 'Bentuk', unit: '', required: true, type: 'select', options: ['rectangle', 'square', 'triangle', 'circle', 'trapezoid'] },
            { name: 'volume', label: 'Luas', unit: 'm²', required: true, min: 0.01, step: 0.01 },
            { name: 'productivity', label: 'Produktivitas', unit: 'm²/hari', required: true, min: 0.01, step: 0.01 },
            { name: 'profit_percentage', label: 'Keuntungan', unit: '%', required: true, default: 20, min: 0, step: 0.1 },
            { name: 'waste_factor', label: 'Faktor Pemborosan', unit: '%', required: true, default: 5, min: 0, step: 0.1 },
            { name: 'num_tukang', label: 'Jumlah Tukang', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'num_pekerja', label: 'Jumlah Pekerja', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'worker_ratio_display', label: 'Rasio Pekerja', unit: 'tukang:pekerja', required: true, default: '1:1', type: 'select', options: ['0:1', '1:1', '1:2', '2:1', '1:3', '3:1', '2:3', '3:2'] }
          ],
          calculation: 'area_calculation_with_shapes',
          description: 'Kalkulator luas dengan berbagai bentuk geometri dan input material, tenaga kerja detail',
          features: [
            'shape_selection',
            'material_input_optional', 
            'labor_calculation_with_ratio', 
            'hpp_rab_output_detailed', 
            'table_format_new',
            'waste_factor_calculation',
            'profit_margin_calculation'
          ],
          output_format: {
            type: 'table',
            columns: ['Luas', 'Satuan', 'Bahan', 'Tukang', 'HPP Bahan', 'HPP Tukang', 'RAB Bahan', 'RAB Tukang', 'HPP', 'RAB', 'Keuntungan'],
            details: ['labor_breakdown', 'material_breakdown', 'summary_cards', 'shape_info']
          },
          labor_rates: {
            tukang: 150000,
            pekerja: 135000
          }
        };
        break;
        
      case 'volume':
        calculatorConfig = {
          type: 'volume',
          redirect_url: '/volume-calculator',
          fields: [
            { name: 'project_name', label: 'Nama Proyek', unit: '', required: false, placeholder: 'Opsional' },
            { name: 'shape', label: 'Bentuk', unit: '', required: true, type: 'select', options: ['cube', 'cylinder', 'sphere', 'cone', 'pyramid', 'prism'] },
            { name: 'volume', label: 'Volume', unit: 'm³', required: true, min: 0.01, step: 0.01 },
            { name: 'productivity', label: 'Produktivitas', unit: 'm³/hari', required: true, min: 0.01, step: 0.01 },
            { name: 'profit_percentage', label: 'Keuntungan', unit: '%', required: true, default: 20, min: 0, step: 0.1 },
            { name: 'waste_factor', label: 'Faktor Pemborosan', unit: '%', required: true, default: 5, min: 0, step: 0.1 },
            { name: 'num_tukang', label: 'Jumlah Tukang', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'num_pekerja', label: 'Jumlah Pekerja', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'worker_ratio_display', label: 'Rasio Pekerja', unit: 'tukang:pekerja', required: true, default: '1:1', type: 'select', options: ['0:1', '1:1', '1:2', '2:1', '1:3', '3:1', '2:3', '3:2'] }
          ],
          calculation: 'volume_calculation_with_shapes',
          description: 'Kalkulator volume dengan berbagai bentuk bangun ruang dan input material, tenaga kerja detail',
          features: [
            'shape_selection',
            'material_input_optional', 
            'labor_calculation_with_ratio', 
            'hpp_rab_output_detailed', 
            'table_format_new',
            'waste_factor_calculation',
            'profit_margin_calculation'
          ],
          output_format: {
            type: 'table',
            columns: ['Volume', 'Satuan', 'Bahan', 'Tukang', 'HPP Bahan', 'HPP Tukang', 'RAB Bahan', 'RAB Tukang', 'HPP', 'RAB', 'Keuntungan'],
            details: ['labor_breakdown', 'material_breakdown', 'summary_cards', 'shape_info']
          },
          labor_rates: {
            tukang: 150000,
            pekerja: 135000
          }
        };
        break;
        
      case 'beam':
        calculatorConfig = {
          type: 'beam',
          redirect_url: '/beam-calculator',
          fields: [
            { name: 'project_name', label: 'Nama Proyek', unit: '', required: false, placeholder: 'Opsional' },
            { name: 'beam_length', label: 'Panjang Balok', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'beam_width', label: 'Lebar Balok', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'beam_height', label: 'Tinggi Balok', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'beam_cover', label: 'Selimut Balok', unit: 'mm', required: true, default: 25, min: 15, step: 1 },
            { name: 'main_reinforcement', label: 'Tulangan Utama', unit: '', required: true, type: 'select', options: ['D10', 'D12', 'D16', 'D19', 'D22', 'D25'], default: 'D16' },
            { name: 'stirrup_reinforcement', label: 'Tulangan Sengkang', unit: '', required: true, type: 'select', options: ['D10', 'D12', 'D16', 'D19', 'D22', 'D25'], default: 'D10' },
            { name: 'num_main_reinforcement', label: 'Jumlah Tulangan Utama', unit: 'buah', required: true, default: 4, min: 2, type: 'integer' },
            { name: 'stirrup_spacing', label: 'Jarak Sengkang', unit: 'mm', required: true, default: 150, min: 50, step: 10 },
            { name: 'concrete_mix', label: 'Campuran Beton', unit: '', required: true, type: 'select', options: ['K-175', 'K-200', 'K-225', 'K-250', 'K-275', 'K-300'], default: 'K-250' },
            { name: 'productivity', label: 'Produktivitas', unit: 'm³/hari', required: true, min: 0.01, step: 0.01 },
            { name: 'profit_percentage', label: 'Keuntungan', unit: '%', required: true, default: 20, min: 0, step: 0.1 },
            { name: 'waste_factor', label: 'Faktor Pemborosan', unit: '%', required: true, default: 5, min: 0, step: 0.1 },
            { name: 'num_tukang', label: 'Jumlah Tukang', unit: 'orang', required: true, default: 2, min: 0, type: 'integer' },
            { name: 'num_pekerja', label: 'Jumlah Pekerja', unit: 'orang', required: true, default: 4, min: 0, type: 'integer' },
            { name: 'worker_ratio_display', label: 'Rasio Pekerja', unit: 'tukang:pekerja', required: true, default: '1:2', type: 'select', options: ['0:1', '1:1', '1:2', '2:1', '1:3', '3:1', '2:3', '3:2'] }
          ],
          calculation: 'beam_structure_calculation',
          description: 'Kalkulator balok struktur beton bertulang dengan perhitungan tulangan utama, sengkang, dan volume beton',
          features: [
            'beam_dimensions_input',
            'reinforcement_configuration',
            'concrete_mix_selection',
            'material_input_optional', 
            'labor_calculation_with_ratio', 
            'hpp_rab_output_detailed', 
            'table_format_new',
            'waste_factor_calculation',
            'profit_margin_calculation',
            'reinforcement_weight_calculation'
          ],
          output_format: {
            type: 'table',
            columns: ['Volume', 'Satuan', 'Bahan', 'Tukang', 'HPP Bahan', 'HPP Tukang', 'RAB Bahan', 'RAB Tukang', 'HPP', 'RAB', 'Keuntungan'],
            details: ['beam_info', 'reinforcement_info', 'labor_breakdown', 'material_breakdown', 'summary_cards']
          },
          labor_rates: {
            tukang: 150000,
            pekerja: 135000
          }
        };
        break;
        
      case 'footplate':
        calculatorConfig = {
          type: 'footplate',
          redirect_url: '/footplate-calculator',
          fields: [
            { name: 'project_name', label: 'Nama Proyek', unit: '', required: false, placeholder: 'Opsional' },
            { name: 'footplate_length', label: 'Panjang Footplate', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'footplate_width', label: 'Lebar Footplate', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'footplate_thickness', label: 'Tebal Footplate', unit: 'm', required: true, min: 0.01, step: 0.01 },
            { name: 'concrete_cover', label: 'Selimut Beton', unit: 'mm', required: true, default: 40, min: 25, step: 1 },
            { name: 'main_reinforcement_x', label: 'Tulangan Arah X', unit: '', required: true, type: 'select', options: ['D10', 'D12', 'D16', 'D19', 'D22', 'D25'], default: 'D12' },
            { name: 'main_reinforcement_y', label: 'Tulangan Arah Y', unit: '', required: true, type: 'select', options: ['D10', 'D12', 'D16', 'D19', 'D22', 'D25'], default: 'D12' },
            { name: 'stirrup_spacing_x', label: 'Jarak Tulangan X', unit: 'mm', required: true, default: 200, min: 100, step: 10 },
            { name: 'stirrup_spacing_y', label: 'Jarak Tulangan Y', unit: 'mm', required: true, default: 200, min: 100, step: 10 },
            { name: 'concrete_quality', label: 'Kualitas Beton', unit: '', required: true, type: 'select', options: ['K-175', 'K-200', 'K-225', 'K-250', 'K-300', 'K-350'], default: 'K-225' },
            { name: 'productivity', label: 'Produktivitas', unit: 'm³/hari', required: true, min: 0.01, step: 0.01 },
            { name: 'profit_percentage', label: 'Keuntungan', unit: '%', required: true, default: 20, min: 0, step: 0.1 },
            { name: 'waste_factor', label: 'Faktor Pemborosan', unit: '%', required: true, default: 5, min: 0, step: 0.1 },
            { name: 'beton_num_tukang', label: 'Tukang Beton', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'beton_num_pekerja', label: 'Pekerja Beton', unit: 'orang', required: true, default: 2, min: 0, type: 'integer' },
            { name: 'bekisting_num_tukang', label: 'Tukang Bekisting', unit: 'orang', required: true, default: 2, min: 0, type: 'integer' },
            { name: 'bekisting_num_pekerja', label: 'Pekerja Bekisting', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' },
            { name: 'besi_num_tukang', label: 'Tukang Besi', unit: 'orang', required: true, default: 2, min: 0, type: 'integer' },
            { name: 'besi_num_pekerja', label: 'Pekerja Besi', unit: 'orang', required: true, default: 1, min: 0, type: 'integer' }
          ],
          calculation: 'footplate_structure_calculation',
          description: 'Kalkulator footplate beton bertulang dengan perhitungan tulangan dua arah dan volume beton',
          features: [
            'footplate_dimensions_input',
            'reinforcement_two_direction',
            'concrete_quality_selection',
            'material_input_optional', 
            'labor_calculation_detailed', 
            'hpp_rab_output_detailed', 
            'table_format_new',
            'waste_factor_calculation',
            'profit_margin_calculation',
            'reinforcement_weight_calculation'
          ],
          output_format: {
            type: 'table',
            columns: ['Volume', 'Satuan', 'Bahan', 'Tukang', 'HPP Bahan', 'HPP Tukang', 'RAB Bahan', 'RAB Tukang', 'HPP', 'RAB', 'Keuntungan'],
            details: ['footplate_info', 'reinforcement_info', 'labor_breakdown', 'material_breakdown', 'summary_cards']
          },
          labor_rates: {
            tukang: 150000,
            pekerja: 135000
          }
        };
        break;
        
      default:
        calculatorConfig = null;
    }
    
    // Save calculator configuration to database
    updateCalculatorConfigMutation.mutate({
      jobTypeId: jobType.id,
      calculatorConfig: calculatorConfig,
      calculatorType: calculatorType.id
    });
  };

  const handleCloseCalculatorSelector = () => {
    setShowCalculatorSelector(false);
    setSelectedJobTypeForCalculator(null);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat jenis pekerjaan..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-8 h-8 text-danger-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Gagal Memuat Data
          </h2>
          <p className="text-gray-600 mb-6">
            Terjadi kesalahan saat memuat jenis pekerjaan.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => refetch()}
              className="btn-primary"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{category?.name || 'Jenis Pekerjaan'} - Kalkulator Konstruksi</title>
        <meta 
          name="description" 
          content={`Pilih jenis pekerjaan ${category?.name?.toLowerCase()} untuk menghitung biaya konstruksi dengan akurat.`} 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
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
                    {category?.name || 'Jenis Pekerjaan'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {category?.description || 'Pilih jenis pekerjaan untuk memulai kalkulasi'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowMaterialManagementModal(true)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Package className="w-4 h-4" />
                      <span className="hidden sm:inline">Material & Konversi</span>
                      <span className="sm:hidden">Material</span>
                    </button>
                    <button
                      onClick={handleAddJobType}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Tambah Job Type</span>
                      <span className="sm:hidden">Tambah</span>
                    </button>
                  </div>
                )}
                
                {/* Breadcrumb */}
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <Link to="/" className="hover:text-gray-700">
                    Beranda
                  </Link>
                  <span>/</span>
                  <span className="text-gray-900">{category?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari jenis pekerjaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Job Types Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {searchQuery && (
            <div className="mb-6">
              <p className="text-gray-600">
                Menampilkan hasil untuk "{searchQuery}"
              </p>
              <button
                onClick={clearSearch}
                className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                ← Lihat semua jenis pekerjaan
              </button>
            </div>
          )}
          
          {/* Job Types Grid */}
          {jobTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobTypes.map((jobType) => (
                <div key={jobType.id} className="relative group">
                  <div
                    onClick={() => navigateToCalculator(jobType.id)}
                    className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 border border-gray-100 overflow-hidden hover:border-primary-200 touch-manipulation relative block cursor-pointer"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                          <Calculator className="w-6 h-6 text-primary-600" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors duration-200">
                        {jobType.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {jobType.description || 'Klik untuk mulai menghitung biaya pekerjaan ini'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            Satuan: {jobType.unit}
                          </span>
                          {jobType.base_productivity && (
                            <span className="text-gray-500">
                              {jobType.base_productivity} {jobType.unit}/hari
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Calculator Configuration Badge */}
                          {jobType.input_config ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${(() => {
                              try {
                                const config = JSON.parse(jobType.input_config);
                                if (config.type === 'length') return 'bg-amber-100 text-amber-700';
                                if (config.type === 'area') return 'bg-green-100 text-green-700';
                                if (config.type === 'volume') return 'bg-blue-100 text-blue-700';
                                if (config.type === 'beam') return 'bg-purple-100 text-purple-700';
                                if (config.type === 'footplate') return 'bg-indigo-100 text-indigo-700';
                                return 'bg-gray-100 text-gray-700';
                              } catch {
                                return 'bg-gray-100 text-gray-700';
                              }
                            })()}`}>
                              {(() => {
                                try {
                                  const config = JSON.parse(jobType.input_config);
                                  if (config.type === 'length') return 'Panjang';
                                  if (config.type === 'area') return 'Luas';
                                  if (config.type === 'volume') return 'Volume';
                                  if (config.type === 'beam') return 'Struktur';
                                  if (config.type === 'footplate') return 'Footplate';
                                  return 'Custom';
                                } catch {
                                  return 'Custom';
                                }
                              })()}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              Belum Dikonfigurasi
                            </span>
                          )}
                          <div className="flex items-center text-primary-600">
                            <Zap className="w-3 h-3 mr-1" />
                            <span>Hitung</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleJobTypeClick(jobType);
                        }}
                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors shadow-md"
                        title="Pilih jenis kalkulator"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleManageLabor(jobType);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-md"
                        title="Atur upah pekerja"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleManageMaterials(jobType);
                        }}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors shadow-md"
                        title="Atur material & komposisi"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditJobType(jobType);
                        }}
                        className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors shadow-md"
                        title="Edit job type"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteJobType(jobType);
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-md"
                        title="Hapus job type"
                        disabled={deleteJobTypeMutation.isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Jenis Pekerjaan'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `Tidak ditemukan jenis pekerjaan yang cocok dengan "${searchQuery}"`
                  : 'Belum ada jenis pekerjaan yang tersedia untuk kategori ini'
                }
              </p>
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="btn-primary"
                >
                  Lihat Semua Jenis Pekerjaan
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  Kembali ke Kategori
                </button>
              )}
            </div>
          )}
        </div>
        
        
        {/* Job Type Form Modal */}
        <JobTypeFormModal
          isOpen={showJobTypeForm}
          onClose={resetJobTypeForm}
          onSubmit={handleJobTypeFormSubmit}
          formData={jobTypeFormData}
          setFormData={setJobTypeFormData}
          categories={categories}
          selectedJobType={selectedJobType}
          isLoading={createJobTypeMutation.isLoading || updateJobTypeMutation.isLoading}
        />

        {/* Material Management Modal */}
        <MaterialManagementModal
          isOpen={showMaterialManagementModal}
          onClose={() => setShowMaterialManagementModal(false)}
        />

        {/* Job Type Labor Modal */}
        <JobTypeLaborModal
          isOpen={showLaborModal}
          onClose={() => {
            setShowLaborModal(false);
            setSelectedJobTypeForManagement(null);
          }}
          onSubmit={handleLaborSubmit}
          jobType={selectedJobTypeForManagement}
          isLoading={updateLaborAssignmentsMutation.isLoading}
        />

        {/* Job Type Material Modal */}
        <JobTypeMaterialModal
          isOpen={showMaterialAssignmentModal}
          onClose={() => {
            setShowMaterialAssignmentModal(false);
            setSelectedJobTypeForManagement(null);
          }}
          onSubmit={handleMaterialAssignmentSubmit}
          jobType={selectedJobTypeForManagement}
          materials={materials}
          isLoading={updateMaterialAssignmentsMutation.isLoading}
        />

        {/* Calculator Selection Modal */}
        {showCalculatorSelector && selectedJobTypeForCalculator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Konfigurasi Kalkulator</h3>
                    <p className="text-primary-100 mt-1">
                      {selectedJobTypeForCalculator.name} • {selectedJobTypeForCalculator.unit}
                    </p>
                    <p className="text-primary-200 text-sm mt-1">
                      Pilih jenis kalkulator yang akan digunakan untuk job type ini
                    </p>
                  </div>
                  <button
                    onClick={handleCloseCalculatorSelector}
                    className="p-2 text-primary-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Current Configuration */}
              {selectedJobTypeForCalculator && selectedJobTypeForCalculator.input_config && (() => {
                try {
                  const config = JSON.parse(selectedJobTypeForCalculator.input_config);
                  
                  const currentCalculator = calculatorTypes.find(calc => {
                    if (config.type === 'length') return calc.id === 'length';
                    if (config.type === 'area') return calc.id === 'area';
                    if (config.type === 'volume') return calc.id === 'volume';
                    if (config.type === 'beam') return calc.id === 'beam';
                    if (config.type === 'footplate') return calc.id === 'footplate';
                    return null;
                  });

                  if (!currentCalculator) return null;

                  const IconComponent = currentCalculator.icon;
                  const colorClasses = {
                    amber: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', textTitle: 'text-amber-900', textDesc: 'text-amber-700' },
                    green: { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100', iconColor: 'text-green-600', textTitle: 'text-green-900', textDesc: 'text-green-700' },
                    blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', textTitle: 'text-blue-900', textDesc: 'text-blue-700' },
                    purple: { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', textTitle: 'text-purple-900', textDesc: 'text-purple-700' },
                    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', textTitle: 'text-indigo-900', textDesc: 'text-indigo-700' }
                  };

                  const colors = colorClasses[currentCalculator.color];

                  return (
                    <div className={`p-4 ${colors.bg} border-b ${colors.border}`}>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${colors.iconBg} rounded-lg flex items-center justify-center mr-3`}>
                          <IconComponent className={`w-4 h-4 ${colors.iconColor}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${colors.textTitle}`}>Konfigurasi Saat Ini</p>
                          <p className={`${colors.textDesc} text-sm`}>
                            {currentCalculator.name}
                          </p>
                          <p className={`${colors.textDesc} text-xs opacity-80 mt-1`}>
                            {currentCalculator.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              {/* Calculator Options */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {calculatorTypes.map((calculator) => {
                    const IconComponent = calculator.icon;
                    const colorClasses = {
                      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
                      green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
                      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
                      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700',
                      red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
                      amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
                      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
                    };

                    return (
                      <div
                        key={calculator.id}
                        onClick={() => handleCalculatorSelect(calculator)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${colorClasses[calculator.color]} ${
                          updateCalculatorConfigMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            calculator.color === 'blue' ? 'bg-blue-100' :
                            calculator.color === 'green' ? 'bg-green-100' :
                            calculator.color === 'purple' ? 'bg-purple-100' :
                            calculator.color === 'orange' ? 'bg-orange-100' :
                            calculator.color === 'red' ? 'bg-red-100' :
                            calculator.color === 'indigo' ? 'bg-indigo-100' :
                            'bg-amber-100'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{calculator.name}</h4>
                          </div>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">
                          {calculator.description}
                        </p>
                        <div className="mt-3 flex items-center text-sm font-medium">
                          <span>Simpan Konfigurasi</span>
                          <Settings className="w-4 h-4 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>


                {/* Loading State */}
                {updateCalculatorConfigMutation.isLoading && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner w-5 h-5 mr-2"></div>
                      <span className="text-blue-700">Menyimpan konfigurasi kalkulator...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default JobTypePage;
