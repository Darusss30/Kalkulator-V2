import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Clock, 
  Calculator, 
  Trash2, 
  Eye, 
  Download,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  DollarSign,
  Building,
  X,
  Edit,
  FolderOpen,
  ArrowLeft,
  Users,
  Package,
  Copy,
  FileText,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiService, { apiUtils } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCalculation } from '../contexts/CalculationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { downloadSingleCalculationPDF, downloadBulkCalculationsPDF } from '../utils/pdfGenerator';

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { getLocalHistory, deleteLocalCalculation } = useCalculation();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [localHistory, setLocalHistory] = useState([]);
  
  // Project-based navigation state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [viewMode, setViewMode] = useState('projects'); // 'projects' or 'calculations'
  
  // Project management state
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  
  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(null);
  const [showBulkExportDropdown, setShowBulkExportDropdown] = useState(false);
  
  const itemsPerPage = 10;
  
  // Initialize state from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectParam = urlParams.get('project');
    const modeParam = urlParams.get('mode');
    
    if (projectParam && modeParam === 'calculations') {
      // Find project from projectList when it's available
      setViewMode('calculations');
    } else {
      setViewMode('projects');
      setSelectedProject(null);
    }
  }, [location.search]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const projectParam = urlParams.get('project');
      const modeParam = urlParams.get('mode');
      
      if (projectParam && modeParam === 'calculations') {
        // Find project from projectList
        const project = projectList.find(p => p.name === decodeURIComponent(projectParam));
        if (project) {
          setSelectedProject(project);
          setViewMode('calculations');
        } else {
          // Project not found, go back to projects view
          setViewMode('projects');
          setSelectedProject(null);
          navigate('/history', { replace: true });
        }
      } else {
        setViewMode('projects');
        setSelectedProject(null);
      }
      setSelectedItems(new Set()); // Clear selections
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [projectList, navigate]);
  
  // Extract projects from calculations
  const extractProjectsFromCalculations = (calculations) => {
    const projectMap = new Map();
    
    calculations.forEach(calc => {
      const projectName = calc.project_name || 'Tanpa Nama Proyek';
      
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, {
          name: projectName,
          calculations: [],
          totalCalculations: 0,
          lastUpdated: calc.created_at,
          totalValue: 0
        });
      }
      
      const project = projectMap.get(projectName);
      project.calculations.push(calc);
      project.totalCalculations++;
      
      // Update last updated date if this calculation is newer
      if (new Date(calc.created_at) > new Date(project.lastUpdated)) {
        project.lastUpdated = calc.created_at;
      }
      
      // Add to total value
      const rabValue = calc.is_local 
        ? (calc.summary?.rab_total || 0)
        : (parseFloat(calc.total_rab) || 0);
      project.totalValue += rabValue;
    });
    
    return Array.from(projectMap.values()).sort((a, b) => 
      new Date(b.lastUpdated) - new Date(a.lastUpdated)
    );
  };

  // Fetch calculation history for authenticated users
  const { 
    data: historyData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['calculation-history', { page: currentPage, search: searchQuery }],
    () => apiService.calculations.getHistory({ 
      page: currentPage, 
      limit: itemsPerPage,
      search: searchQuery 
    }),
    {
      enabled: !!user,
      keepPreviousData: true,
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Load local history for unauthenticated users
  useEffect(() => {
    if (!user) {
      const localCalcs = getLocalHistory();
      setLocalHistory(localCalcs);
      
      // Extract unique projects from local history
      const projects = extractProjectsFromCalculations(localCalcs);
      setProjectList(projects);
    }
  }, [user, getLocalHistory]);
  
  // Update project list when history data changes
  useEffect(() => {
    if (user && historyData?.data?.calculations) {
      const projects = extractProjectsFromCalculations(historyData.data.calculations);
      setProjectList(projects);
    }
  }, [user, historyData]);

  // Sync selected project with URL when projectList changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectParam = urlParams.get('project');
    const modeParam = urlParams.get('mode');
    
    if (projectParam && modeParam === 'calculations' && projectList.length > 0) {
      const project = projectList.find(p => p.name === decodeURIComponent(projectParam));
      if (project) {
        setSelectedProject(project);
        setViewMode('calculations');
      } else {
        // Project not found, redirect to projects view
        setViewMode('projects');
        setSelectedProject(null);
        navigate('/history', { replace: true });
      }
    }
  }, [projectList, location.search, navigate]);

  // Keyboard shortcuts - DISABLED to fix error
  /*useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when in calculations view and not typing in input fields
      if (viewMode !== 'calculations' || 
          event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + A: Select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        if (filteredCalculations.length > 0) {
          const allIds = new Set(filteredCalculations.map(calc => calc.id));
          setSelectedItems(allIds);
          toast.success(`${filteredCalculations.length} item dipilih`);
        }
      }

      // Escape: Clear selection or go back to projects
      if (event.key === 'Escape') {
        if (selectedItems.size > 0) {
          setSelectedItems(new Set());
          toast.info('Pilihan dibersihkan');
        } else if (viewMode === 'calculations') {
          handleBackToProjects();
        }
      }

      // Delete: Delete selected items
      if (event.key === 'Delete' && selectedItems.size > 0) {
        event.preventDefault();
        handleBulkDelete();
      }

      // Ctrl/Cmd + E: Export selected items
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && selectedItems.size > 0) {
        event.preventDefault();
        handleBulkExport();
      }

      // Ctrl/Cmd + D: Duplicate first selected item
      if ((event.ctrlKey || event.metaKey) && event.key === 'd' && selectedItems.size === 1) {
        event.preventDefault();
        const selectedId = Array.from(selectedItems)[0];
        const calculation = filteredCalculations.find(calc => calc.id === selectedId);
        if (calculation) {
          handleDuplicateCalculation(calculation);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedItems, filteredCalculations, handleBulkDelete, handleBulkExport, handleDuplicateCalculation, handleBackToProjects]);*/
  
  // Delete single calculation mutation
  const deleteMutation = useMutation(
    (id) => apiService.calculations.deleteCalculation(id),
    {
      onSuccess: () => {
        toast.success('History berhasil dihapus');
        queryClient.invalidateQueries(['calculation-history']);
        setShowDeleteConfirm(false);
        setItemToDelete(null);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus history');
      }
    }
  );
  
  // Delete multiple calculations mutation
  const bulkDeleteMutation = useMutation(
    (calculationIds) => apiService.calculations.deleteCalculationsBulk(calculationIds),
    {
      onSuccess: (response) => {
        toast.success(`${response.data.deleted_count} history berhasil dihapus`);
        queryClient.invalidateQueries(['calculation-history']);
        setSelectedItems(new Set());
        setShowBulkDeleteConfirm(false);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus history');
      }
    }
  );
  
  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setViewMode('calculations');
    setSelectedItems(new Set()); // Clear selections
    
    // Update URL to reflect the current state
    const params = new URLSearchParams();
    params.set('project', encodeURIComponent(project.name));
    params.set('mode', 'calculations');
    navigate(`/history?${params.toString()}`, { replace: false });
  };

  // Handle back to projects
  const handleBackToProjects = () => {
    setSelectedProject(null);
    setViewMode('projects');
    setSelectedItems(new Set());
    
    // Update URL to go back to projects view
    navigate('/history', { replace: false });
  };

  // Handle edit project
  const handleEditProject = (project, event) => {
    event.stopPropagation(); // Prevent project selection
    setProjectToEdit(project);
    setEditProjectName(project.name);
    setShowProjectEditModal(true);
  };

  // Handle delete project
  const handleDeleteProject = (project, event) => {
    event.stopPropagation(); // Prevent project selection
    setProjectToDelete(project);
    setShowProjectDeleteConfirm(true);
  };

  // Confirm edit project
  const confirmEditProject = async () => {
    if (!projectToEdit || !editProjectName.trim()) {
      toast.error('Nama proyek tidak boleh kosong');
      return;
    }

    if (editProjectName.trim() === projectToEdit.name) {
      setShowProjectEditModal(false);
      return;
    }

    try {
      // Update all calculations with the old project name to the new project name
      const calculationsToUpdate = projectToEdit.calculations;
      
      if (user) {
        // For authenticated users, update via API
        const updatePromises = calculationsToUpdate.map(calc => 
          apiService.calculations.updateCalculation(calc.id, {
            ...calc,
            project_name: editProjectName.trim()
          })
        );
        
        await Promise.all(updatePromises);
        queryClient.invalidateQueries(['calculation-history']);
      } else {
        // For local storage, update each calculation
        calculationsToUpdate.forEach(calc => {
          const updatedCalc = { ...calc, project_name: editProjectName.trim() };
          const existingHistory = JSON.parse(localStorage.getItem('kalkulator_local_history') || '[]');
          const updatedHistory = existingHistory.map(historyCalc => 
            historyCalc.id === calc.id ? updatedCalc : historyCalc
          );
          localStorage.setItem('kalkulator_local_history', JSON.stringify(updatedHistory));
        });
        
        // Update local state
        setLocalHistory(prev => prev.map(calc => 
          calculationsToUpdate.find(c => c.id === calc.id) 
            ? { ...calc, project_name: editProjectName.trim() }
            : calc
        ));
      }

      toast.success('Nama proyek berhasil diubah');
      setShowProjectEditModal(false);
      setProjectToEdit(null);
      setEditProjectName('');
    } catch (error) {
      toast.error('Gagal mengubah nama proyek');
    }
  };

  // Confirm delete project
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const calculationsToDelete = projectToDelete.calculations;
      
      if (user) {
        // For authenticated users, delete via API
        const deletePromises = calculationsToDelete.map(calc => 
          apiService.calculations.deleteCalculation(calc.id)
        );
        
        await Promise.all(deletePromises);
        queryClient.invalidateQueries(['calculation-history']);
      } else {
        // For local storage, delete each calculation
        calculationsToDelete.forEach(calc => {
          const existingHistory = JSON.parse(localStorage.getItem('kalkulator_local_history') || '[]');
          const updatedHistory = existingHistory.filter(historyCalc => historyCalc.id !== calc.id);
          localStorage.setItem('kalkulator_local_history', JSON.stringify(updatedHistory));
        });
        
        // Update local state
        setLocalHistory(prev => prev.filter(calc => 
          !calculationsToDelete.find(c => c.id === calc.id)
        ));
      }

      toast.success(`Proyek "${projectToDelete.name}" dan ${calculationsToDelete.length} kalkulasi berhasil dihapus`);
      setShowProjectDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error('Gagal menghapus proyek');
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Handle individual item selection
  const handleItemSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (viewMode === 'calculations') {
      const calculations = filteredCalculations || [];
      if (selectedItems.size === calculations.length) {
        setSelectedItems(new Set());
      } else {
        const allIds = new Set(calculations.map(calc => calc.id) || []);
        setSelectedItems(allIds);
      }
    }
  };
  
  // Handle single delete
  const handleDelete = (calculation) => {
    setItemToDelete(calculation);
    setShowDeleteConfirm(true);
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      toast.error('Pilih item yang ingin dihapus');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  // Handle bulk export
  const handleBulkExport = (format = 'json') => {
    if (selectedItems.size === 0) {
      toast.error('Pilih item yang ingin diekspor');
      return;
    }

    const selectedCalculations = filteredCalculations.filter(calc => 
      selectedItems.has(calc.id)
    );

    if (selectedCalculations.length === 0) {
      toast.error('Tidak ada kalkulasi yang dipilih');
      return;
    }

    if (format === 'pdf') {
      // Export as PDF
      try {
        downloadBulkCalculationsPDF(selectedCalculations, selectedProject?.name || 'Multiple Projects');
        toast.success(`${selectedCalculations.length} kalkulasi berhasil diekspor sebagai PDF`);
      } catch (error) {
        toast.error('Gagal mengekspor PDF');
        console.error('PDF export error:', error);
      }
    } else {
      // Export as JSON (existing functionality)
      const exportData = {
        export_date: new Date().toISOString(),
        project_name: selectedProject?.name || 'Multiple Projects',
        total_calculations: selectedCalculations.length,
        calculations: selectedCalculations.map(calc => ({
          id: calc.id,
          job_type_name: calc.job_type_name || calc.job_type?.name,
          category_name: calc.category_name || calc.job_type?.category_name,
          volume: calc.volume || calc.calculation_data?.input?.volume,
          unit: calc.job_type_unit || calc.job_type?.unit,
          productivity: calc.productivity || calc.calculation_data?.input?.productivity,
          estimated_days: calc.estimated_days || calc.calculation_data?.input?.estimated_days,
          project_name: calc.project_name || calc.calculation_data?.input?.project_name,
          profit_percentage: calc.profit_percentage || calc.calculation_data?.input?.profit_percentage,
          labor_cost: calc.is_local 
            ? (calc.summary?.total_labor_cost || 0)
            : (calc.labor_cost || 0),
          material_cost: calc.is_local 
            ? (calc.summary?.total_material_cost || 0)
            : (calc.material_cost || 0),
          total_hpp: calc.is_local 
            ? (calc.summary?.total_cost || 0)
            : ((calc.labor_cost || 0) + (calc.material_cost || 0)),
          total_rab: calc.is_local 
            ? (calc.summary?.rab_total || 0)
            : (calc.total_rab || 0),
          created_at: calc.created_at,
          updated_at: calc.updated_at
        })),
        summary: {
          total_labor_cost: selectedCalculations.reduce((sum, calc) => {
            const laborCost = calc.is_local 
              ? (calc.summary?.total_labor_cost || 0)
              : (calc.labor_cost || 0);
            return sum + laborCost;
          }, 0),
          total_material_cost: selectedCalculations.reduce((sum, calc) => {
            const materialCost = calc.is_local 
              ? (calc.summary?.total_material_cost || 0)
              : (calc.material_cost || 0);
            return sum + materialCost;
          }, 0),
          total_hpp: selectedCalculations.reduce((sum, calc) => {
            const hpp = calc.is_local 
              ? (calc.summary?.total_cost || 0)
              : ((calc.labor_cost || 0) + (calc.material_cost || 0));
            return sum + hpp;
          }, 0),
          total_rab: selectedCalculations.reduce((sum, calc) => {
            const rab = calc.is_local 
              ? (calc.summary?.rab_total || 0)
              : (calc.total_rab || 0);
            return sum + rab;
          }, 0)
        }
      };

      // Export as JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const filename = `bulk-export-${selectedProject?.name?.replace(/\s+/g, '-').toLowerCase() || 'calculations'}-${new Date().toISOString().split('T')[0]}.json`;
      apiUtils.downloadFile(dataBlob, filename);

      toast.success(`${selectedCalculations.length} kalkulasi berhasil diekspor sebagai JSON`);
    }

    setSelectedItems(new Set()); // Clear selection
    setShowBulkExportDropdown(false); // Close dropdown
  };
  
  // Confirm single delete
  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.is_local) {
        // Delete from localStorage
        const success = deleteLocalCalculation(itemToDelete.id);
        if (success) {
          setLocalHistory(prev => prev.filter(calc => calc.id !== itemToDelete.id));
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }
      } else {
        // Delete from server
        deleteMutation.mutate(itemToDelete.id);
      }
    }
  };
  
  // Confirm bulk delete
  const confirmBulkDelete = () => {
    const idsArray = Array.from(selectedItems);
    
    if (!user) {
      // Handle local bulk delete
      let deletedCount = 0;
      idsArray.forEach(id => {
        const success = deleteLocalCalculation(id);
        if (success) deletedCount++;
      });
      
      if (deletedCount > 0) {
        setLocalHistory(prev => prev.filter(calc => !idsArray.includes(calc.id)));
        toast.success(`${deletedCount} kalkulasi berhasil dihapus`);
      }
      
      setSelectedItems(new Set());
      setShowBulkDeleteConfirm(false);
    } else {
      // Handle server bulk delete
      bulkDeleteMutation.mutate(idsArray);
    }
  };
  
  // Handle view details
  const handleViewDetails = (calculation) => {
    setSelectedCalculation(calculation);
    setShowDetailModal(true);
  };
  
  // Handle edit calculation - navigate back to calculator with pre-filled data
  const handleEditCalculation = (calculation) => {
    const jobTypeId = calculation.job_type_id || calculation.calculation_data?.job_type?.id;
    if (jobTypeId) {
      navigate(`/calculate/${jobTypeId}`, {
        state: {
          editMode: true,
          calculationData: calculation,
          formData: {
            volume: calculation.volume || calculation.calculation_data?.input?.volume || '',
            productivity: calculation.productivity || calculation.calculation_data?.input?.productivity || '',
            num_tukang: calculation.calculation_data?.labor?.num_tukang || '',
            num_pekerja: calculation.calculation_data?.labor?.num_pekerja || '',
            profit_percentage: calculation.profit_percentage || calculation.calculation_data?.input?.profit_percentage || '20',
            project_name: calculation.project_name || calculation.calculation_data?.input?.project_name || '',
            custom_waste_factor: calculation.custom_waste_factor || calculation.calculation_data?.input?.custom_waste_factor || '5'
          }
        }
      });
    } else {
      toast.error('Tidak dapat mengedit kalkulasi ini - data job type tidak ditemukan');
    }
  };

  // Duplicate calculation mutation
  const duplicateCalculationMutation = useMutation(
    (calculationId) => apiService.calculations.duplicateCalculation(calculationId),
    {
      onSuccess: () => {
        toast.success('Kalkulasi berhasil diduplikasi');
        queryClient.invalidateQueries(['calculation-history']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menduplikasi kalkulasi');
      }
    }
  );

  // Handle duplicate calculation
  const handleDuplicateCalculation = (calculation) => {
    if (calculation.is_local) {
      // For local calculations, navigate to calculator with pre-filled data
      const jobTypeId = calculation.job_type_id || calculation.calculation_data?.job_type?.id;
      if (jobTypeId) {
        navigate(`/calculate/${jobTypeId}`, {
          state: {
            duplicateMode: true,
            calculationData: calculation,
            formData: {
              volume: calculation.volume || calculation.calculation_data?.input?.volume || '',
              productivity: calculation.productivity || calculation.calculation_data?.input?.productivity || '',
              num_tukang: calculation.calculation_data?.labor?.num_tukang || '',
              num_pekerja: calculation.calculation_data?.labor?.num_pekerja || '',
              profit_percentage: calculation.profit_percentage || calculation.calculation_data?.input?.profit_percentage || '20',
              project_name: `${calculation.project_name || calculation.calculation_data?.input?.project_name || 'Untitled'} (Copy)`,
              custom_waste_factor: calculation.custom_waste_factor || calculation.calculation_data?.input?.custom_waste_factor || '5'
            }
          }
        });
      } else {
        toast.error('Tidak dapat menduplikasi kalkulasi ini - data job type tidak ditemukan');
      }
    } else {
      // For server calculations, use API
      duplicateCalculationMutation.mutate(calculation.id);
    }
  };

  // Export calculation
  const handleExport = (calculation, format = 'json') => {
    if (format === 'pdf') {
      try {
        downloadSingleCalculationPDF(calculation);
        toast.success('Kalkulasi berhasil diekspor sebagai PDF');
      } catch (error) {
        toast.error('Gagal mengekspor PDF');
        console.error('PDF export error:', error);
      }
    } else {
      // JSON export (existing functionality)
      const dataStr = JSON.stringify(calculation.calculation_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      apiUtils.downloadFile(dataBlob, `calculation-${calculation.id}-${new Date().toISOString().split('T')[0]}.json`);
      toast.success('Kalkulasi berhasil diekspor sebagai JSON');
    }
    
    setShowExportDropdown(null); // Close dropdown
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const isLoadingData = user ? isLoading : false;
  const dataError = user ? error : null;

  // Filter projects based on search
  const filteredProjects = searchQuery 
    ? projectList.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projectList;

  // Filter calculations for selected project based on search
  const filteredCalculations = selectedProject && searchQuery
    ? selectedProject.calculations.filter(calc =>
        calc.job_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.job_type?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.job_type?.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedProject?.calculations || [];
  
  // Debug logging - FIXED
  
  // Additional debug for condition checking
  
  return (
    <>
      <Helmet>
        <title>{viewMode === 'projects' ? 'Pilih Proyek - Kalkulator Konstruksi' : `${selectedProject?.name} - Kalkulator Konstruksi`}</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {viewMode === 'calculations' && (
                  <button
                    onClick={handleBackToProjects}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Clock className="w-8 h-8 text-primary-600 mr-3" />
                    {viewMode === 'projects' ? 'Pilih Proyek' : `Proyek: ${selectedProject?.name}`}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {viewMode === 'projects' 
                      ? 'Pilih proyek untuk melihat history perhitungan'
                      : `${selectedProject?.totalCalculations || 0} kalkulasi dalam proyek ini`
                    }
                  </p>
                </div>
              </div>
              
              {/* Bulk Actions - only show in calculations view */}
              {viewMode === 'calculations' && selectedItems.size > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} item dipilih
                  </span>
                  
                  {/* Bulk Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowBulkExportDropdown(!showBulkExportDropdown)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Terpilih</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showBulkExportDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleBulkExport('json')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export sebagai JSON
                          </button>
                          <button
                            onClick={() => handleBulkExport('pdf')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Export sebagai PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isLoading}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Terpilih</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Notice for unauthenticated users */}
          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    History Lokal Browser
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Kalkulasi ini tersimpan di browser Anda. Untuk menyimpan secara permanen dan mengakses dari perangkat lain, 
                    <button 
                      onClick={() => window.location.href = '/login'}
                      className="font-medium underline hover:no-underline ml-1"
                    >
                      silakan login
                    </button>.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={viewMode === 'projects' 
                    ? "Cari nama proyek..." 
                    : "Cari berdasarkan nama pekerjaan atau kategori..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Quick Stats for Projects View */}
              {viewMode === 'projects' && projectList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{projectList.length}</div>
                    <div className="text-sm text-gray-600">Total Proyek</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {projectList.reduce((sum, project) => sum + project.totalCalculations, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Kalkulasi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {apiUtils.formatCurrency(projectList.reduce((sum, project) => sum + project.totalValue, 0))}
                    </div>
                    <div className="text-sm text-gray-600">Total Nilai RAB</div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
          {/* Content */}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Memuat history..." />
            </div>
          ) : dataError ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat History</h3>
              <p className="text-gray-600 mb-4">{dataError.message || 'Terjadi kesalahan saat memuat data'}</p>
              <button onClick={() => refetch()} className="btn-primary">
                Coba Lagi
              </button>
            </div>
          ) : viewMode === 'projects' ? (
            /* Projects View */
            filteredProjects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Tidak Ada Proyek Ditemukan' : 'Belum Ada Proyek'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? `Tidak ditemukan proyek untuk pencarian "${searchQuery}"`
                    : 'Mulai melakukan perhitungan dengan nama proyek untuk melihat history di sini'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                  <div
                    key={index}
                    onClick={() => handleProjectSelect(project)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group relative"
                  >
                    {/* Project Actions */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleEditProject(project, e)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Proyek"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(project, e)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-primary-200 transition-colors">
                          <FolderOpen className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {project.totalCalculations} kalkulasi
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Nilai RAB:</span>
                        <span className="font-semibold text-primary-600">
                          {apiUtils.formatCurrency(project.totalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Terakhir Update:</span>
                        <span className="text-sm text-gray-900">
                          {formatDate(project.lastUpdated)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
                        <span>Lihat Kalkulasi</span>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Calculations View for Selected Project - TABLE FORMAT */
            filteredCalculations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Kalkulasi'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? `Tidak ditemukan kalkulasi untuk pencarian "${searchQuery}"`
                    : 'Belum ada kalkulasi dalam proyek ini'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[1200px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            onChange={() => {
                              if (selectedItems.size === filteredCalculations.length) {
                                setSelectedItems(new Set());
                              } else {
                                setSelectedItems(new Set(filteredCalculations.map(calc => calc.id)));
                              }
                            }}
                            checked={selectedItems.size === filteredCalculations.length && filteredCalculations.length > 0}
                          />
                        </th>
                        <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pekerjaan
                        </th>
                        <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volume
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          HPP Jasa
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RAB Jasa
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          HPP Bahan
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RAB Bahan
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total HPP
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total RAB
                        </th>
                        <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Keuntungan
                        </th>
                        <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCalculations.map((calculation) => (
                        <tr key={calculation.id} className="hover:bg-gray-50">
                          <td className="w-12 px-2 py-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              checked={selectedItems.has(calculation.id)}
                              onChange={() => handleItemSelect(calculation.id)}
                            />
                          </td>
                          <td className="w-48 px-3 py-3">
                            <div className="truncate">
                              <div className="flex items-center space-x-1">
                                <div className="text-xs font-medium text-gray-900 truncate">
                                  {calculation.job_type_name || calculation.job_type?.name}
                                </div>
                                {calculation.updated_at && calculation.updated_at !== calculation.created_at && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                    Edited
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {calculation.category_name || calculation.job_type?.category_name}
                              </div>
                            </div>
                          </td>
                          <td className="w-24 px-2 py-3 text-xs text-gray-900 truncate">
                            {apiUtils.formatNumber(calculation.volume || calculation.input?.volume, 1)} {calculation.job_type_unit || calculation.job_type?.unit}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-gray-900 truncate">
                            {apiUtils.formatCurrency(
                              calculation.is_local 
                                ? (calculation.summary?.total_labor_cost || 0)
                                : (calculation.labor_cost || 0)
                            )}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-blue-600 truncate">
                            {apiUtils.formatCurrency(
                              calculation.is_local 
                                ? ((calculation.summary?.total_labor_cost || 0) * (1 + (calculation.summary?.profit_percentage || 0) / 100))
                                : ((calculation.labor_cost || 0) * (1 + (calculation.profit_percentage || 0) / 100))
                            )}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-gray-900 truncate">
                            {apiUtils.formatCurrency(
                              calculation.is_local 
                                ? (calculation.summary?.total_material_cost || 0)
                                : (calculation.material_cost || 0)
                            )}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-orange-600 truncate">
                            {apiUtils.formatCurrency(
                              calculation.is_local 
                                ? ((calculation.summary?.total_material_cost || 0) * (1 + (calculation.summary?.profit_percentage || 0) / 100))
                                : ((calculation.material_cost || 0) * (1 + (calculation.profit_percentage || 0) / 100))
                            )}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-gray-900 truncate">
                            {(() => {
                              if (calculation.is_local) {
                                return apiUtils.formatCurrency(calculation.summary?.total_cost || 0);
                              } else {
                                const laborCost = parseFloat(calculation.labor_cost) || 0;
                                const materialCost = parseFloat(calculation.material_cost) || 0;
                                const totalHPP = laborCost + materialCost;
                                return apiUtils.formatCurrency(isNaN(totalHPP) ? 0 : totalHPP);
                              }
                            })()}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-primary-600 truncate">
                            {(() => {
                              if (calculation.is_local) {
                                return apiUtils.formatCurrency(calculation.summary?.rab_total || 0);
                              } else {
                                const totalRAB = parseFloat(calculation.total_rab) || 0;
                                return apiUtils.formatCurrency(isNaN(totalRAB) ? 0 : totalRAB);
                              }
                            })()}
                          </td>
                          <td className="w-28 px-2 py-3 text-xs font-medium text-green-600 truncate">
                            {(() => {
                              if (calculation.is_local) {
                                return apiUtils.formatCurrency(calculation.summary?.profit_amount || 0);
                              } else {
                                const totalRAB = parseFloat(calculation.total_rab) || 0;
                                const laborCost = parseFloat(calculation.labor_cost) || 0;
                                const materialCost = parseFloat(calculation.material_cost) || 0;
                                const totalHPP = laborCost + materialCost;
                                const profit = totalRAB - totalHPP;
                                return apiUtils.formatCurrency(isNaN(profit) ? 0 : profit);
                              }
                            })()}
                          </td>
                          <td className="w-32 px-2 py-3 text-xs text-gray-900">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <span className="text-xs text-gray-600">Dibuat:</span>
                              </div>
                              <div className="text-xs font-medium">
                                {formatDate(calculation.created_at)}
                              </div>
                              {calculation.updated_at && calculation.updated_at !== calculation.created_at && (
                                <>
                                  <div className="flex items-center">
                                    <span className="text-xs text-blue-600">Diedit:</span>
                                  </div>
                                  <div className="text-xs font-medium text-blue-600">
                                    {formatDate(calculation.updated_at)}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="w-24 px-2 py-3">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditCalculation(calculation)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleViewDetails(calculation)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title="Detail"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              
                              {/* Export Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setShowExportDropdown(showExportDropdown === calculation.id ? null : calculation.id)}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Export"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                
                                {showExportDropdown === calculation.id && (
                                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                    <div className="py-1">
                                      <button
                                        onClick={() => handleExport(calculation, 'json')}
                                        className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                      >
                                        <Download className="w-3 h-3 mr-2" />
                                        JSON
                                      </button>
                                      <button
                                        onClick={() => handleExport(calculation, 'pdf')}
                                        className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                      >
                                        <FileText className="w-3 h-3 mr-2" />
                                        PDF
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleDelete(calculation)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Hapus"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Hapus History</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus history perhitungan "{itemToDelete?.job_type_name || itemToDelete?.job_type?.name}"? 
                {itemToDelete?.is_local ? 'Data akan dihapus dari browser Anda.' : 'Tindakan ini tidak dapat dibatalkan.'}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                  disabled={deleteMutation.isLoading}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-danger"
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Hapus Multiple History</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus {selectedItems.size} history yang dipilih? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="btn-secondary"
                  disabled={bulkDeleteMutation.isLoading}
                >
                  Batal
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="btn-danger"
                  disabled={bulkDeleteMutation.isLoading}
                >
                  {bulkDeleteMutation.isLoading ? 'Menghapus...' : `Hapus ${selectedItems.size} Item`}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Detail Modal */}
        {showDetailModal && selectedCalculation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detail Perhitungan</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Informasi Pekerjaan */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      Informasi Pekerjaan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Nama Pekerjaan:</span>
                        <p className="font-medium">{selectedCalculation.job_type_name || selectedCalculation.job_type?.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Kategori:</span>
                        <p className="font-medium">{selectedCalculation.category_name || selectedCalculation.job_type?.category_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Volume:</span>
                        <p className="font-medium">
                          {apiUtils.formatNumber(selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume, 2)} {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Produktivitas:</span>
                        <p className="font-medium">
                          {apiUtils.formatNumber(selectedCalculation.productivity || selectedCalculation.calculation_data?.input?.productivity, 2)} {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}/hari
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Nama Proyek:</span>
                        <p className="font-medium">{selectedCalculation.project_name || selectedCalculation.calculation_data?.input?.project_name || 'Tidak ada'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tanggal:</span>
                        <p className="font-medium">{formatDate(selectedCalculation.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detail HPP dan RAB - Side by Side Layout */}
                  <div className="bg-primary-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Detail HPP dan RAB
                    </h4>
                    
                    {/* HPP dan RAB dalam 2 kolom */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* KOLOM KIRI - HPP Detail Section */}
                      <div className="bg-white p-4 rounded-lg border border-primary-200">
                        <h5 className="font-semibold text-primary-900 mb-4 text-lg flex items-center">
                          <Calculator className="w-5 h-5 mr-2" />
                          HPP (Harga Pokok Produksi)
                        </h5>
                        
                        {/* HPP Tenaga Kerja Detail */}
                        <div className="mb-6">
                          <h6 className="font-medium text-primary-800 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            HPP Tenaga Kerja
                          </h6>
                          <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
                            {/* Breakdown per worker type */}
                            {(selectedCalculation.calculation_data?.labor?.num_tukang || 0) > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Jumlah Tukang:</span>
                                  <span className="font-medium">{selectedCalculation.calculation_data?.labor?.num_tukang || 0} orang</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Upah Tukang per hari:</span>
                                  <span className="font-medium">{apiUtils.formatCurrency(selectedCalculation.calculation_data?.labor?.tukang_daily_rate || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total upah Tukang per hari:</span>
                                  <span className="font-medium text-blue-600">
                                    {apiUtils.formatCurrency((selectedCalculation.calculation_data?.labor?.num_tukang || 0) * (selectedCalculation.calculation_data?.labor?.tukang_daily_rate || 0))}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {(selectedCalculation.calculation_data?.labor?.num_pekerja || 0) > 0 && (
                              <div className="space-y-1 pt-2 border-t border-blue-200">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Jumlah Pekerja:</span>
                                  <span className="font-medium">{selectedCalculation.calculation_data?.labor?.num_pekerja || 0} orang</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Upah Pekerja per hari:</span>
                                  <span className="font-medium">{apiUtils.formatCurrency(selectedCalculation.calculation_data?.labor?.pekerja_daily_rate || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total upah Pekerja per hari:</span>
                                  <span className="font-medium text-blue-600">
                                    {apiUtils.formatCurrency((selectedCalculation.calculation_data?.labor?.num_pekerja || 0) * (selectedCalculation.calculation_data?.labor?.pekerja_daily_rate || 0))}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="border-t border-blue-200 pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total upah per hari:</span>
                                <span className="font-medium">{apiUtils.formatCurrency(selectedCalculation.calculation_data?.labor?.daily_labor_cost || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Estimasi hari kerja:</span>
                                <span className="font-medium">{apiUtils.formatNumber(selectedCalculation.calculation_data?.input?.estimated_days || 0, 1)} hari</span>
                              </div>
                              <div className="flex justify-between font-semibold text-base">
                                <span className="text-blue-800">HPP Tenaga Kerja Total:</span>
                                <span className="text-blue-600">
                                  {apiUtils.formatCurrency(
                                    selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">HPP Tenaga Kerja per {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}:</span>
                                <span className="font-medium text-blue-600">
                                  {(() => {
                                    const volume = selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume || 1;
                                    const laborCost = selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0);
                                    return apiUtils.formatCurrency(laborCost / volume);
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* HPP Material Detail */}
                        {selectedCalculation.calculation_data?.materials?.details?.length > 0 && (
                          <div className="mb-6">
                            <h6 className="font-medium text-primary-800 mb-3 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              HPP Material
                            </h6>
                            <div className="bg-green-50 p-3 rounded-lg space-y-3 text-sm">
                              {selectedCalculation.calculation_data.materials.details.map((material, index) => (
                                <div key={index} className="bg-white p-3 rounded border border-green-200">
                                  <div className="font-medium text-green-800 mb-2">{material.material_name}</div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Harga satuan:</span>
                                      <span className="font-medium">{apiUtils.formatCurrency(material.material_price)}/{material.material_unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Kebutuhan per {material.volume_unit}:</span>
                                      <span className="font-medium">{apiUtils.formatNumber(material.quantity_per_unit, 2)} {material.material_unit}</span>
                                    </div>
                                    {material.waste_factor > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Faktor pemborosan:</span>
                                        <span className="font-medium text-orange-600">{(material.waste_factor_percentage || (material.waste_factor * 100)).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total kebutuhan:</span>
                                      <span className="font-medium text-green-600">{apiUtils.formatNumber(material.total_quantity, 0)} {material.material_unit}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                      <span className="text-green-700">HPP Material ini:</span>
                                      <span className="text-green-600">{apiUtils.formatCurrency(material.material_cost)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="border-t border-green-200 pt-2 mt-2">
                                <div className="flex justify-between font-semibold text-base">
                                  <span className="text-green-800">HPP Material Total:</span>
                                  <span className="text-green-600">
                                    {apiUtils.formatCurrency(
                                      selectedCalculation.is_local 
                                        ? (selectedCalculation.summary?.total_material_cost || 0)
                                        : (selectedCalculation.material_cost || 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Total HPP */}
                        <div className="bg-primary-100 p-4 rounded-lg border-2 border-primary-300">
                          <div className="space-y-2">
                            <div className="flex justify-between text-lg font-semibold">
                              <span className="text-primary-800">TOTAL HPP:</span>
                              <span className="text-primary-600">
                                {(() => {
                                  if (selectedCalculation.is_local) {
                                    return apiUtils.formatCurrency(selectedCalculation.summary?.total_cost || 0);
                                  } else {
                                    const laborCost = parseFloat(selectedCalculation.labor_cost) || 0;
                                    const materialCost = parseFloat(selectedCalculation.material_cost) || 0;
                                    const totalHPP = laborCost + materialCost;
                                    return apiUtils.formatCurrency(isNaN(totalHPP) ? 0 : totalHPP);
                                  }
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-primary-700">HPP per {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}:</span>
                              <span className="font-semibold text-primary-600">
                                {(() => {
                                  const volume = selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume || 1;
                                  if (selectedCalculation.is_local) {
                                    return apiUtils.formatCurrency((selectedCalculation.summary?.total_cost || 0) / volume);
                                  } else {
                                    const laborCost = parseFloat(selectedCalculation.labor_cost) || 0;
                                    const materialCost = parseFloat(selectedCalculation.material_cost) || 0;
                                    const totalHPP = laborCost + materialCost;
                                    return apiUtils.formatCurrency((isNaN(totalHPP) ? 0 : totalHPP) / volume);
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* KOLOM KANAN - RAB Detail Section */}
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-4 text-lg flex items-center">
                          <DollarSign className="w-5 h-5 mr-2" />
                          RAB (Rencana Anggaran Biaya)
                        </h5>
                        
                        {/* RAB Tenaga Kerja */}
                        <div className="mb-6">
                          <h6 className="font-medium text-green-800 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            RAB Tenaga Kerja
                          </h6>
                          <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
                            {/* Breakdown per worker type - same as HPP */}
                            {(selectedCalculation.calculation_data?.labor?.num_tukang || 0) > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Jumlah Tukang:</span>
                                  <span className="font-medium">{selectedCalculation.calculation_data?.labor?.num_tukang || 0} orang</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Upah Tukang per hari:</span>
                                  <span className="font-medium">{apiUtils.formatCurrency(selectedCalculation.calculation_data?.labor?.tukang_daily_rate || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total upah Tukang per hari:</span>
                                  <span className="font-medium text-blue-600">
                                    {apiUtils.formatCurrency((selectedCalculation.calculation_data?.labor?.num_tukang || 0) * (selectedCalculation.calculation_data?.labor?.tukang_daily_rate || 0))}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {(selectedCalculation.calculation_data?.labor?.num_pekerja || 0) > 0 && (
                              <div className="space-y-1 pt-2 border-t border-blue-200">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Jumlah Pekerja:</span>
                                  <span className="font-medium">{selectedCalculation.calculation_data?.labor?.num_pekerja || 0} orang</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Upah Pekerja per hari:</span>
                                  <span className="font-medium">{apiUtils.formatCurrency(selectedCalculation.calculation_data?.labor?.pekerja_daily_rate || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total upah Pekerja per hari:</span>
                                  <span className="font-medium text-blue-600">
                                    {apiUtils.formatCurrency((selectedCalculation.calculation_data?.labor?.num_pekerja || 0) * (selectedCalculation.calculation_data?.labor?.pekerja_daily_rate || 0))}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="border-t border-blue-200 pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total upah per hari:</span>
                                <span className="font-medium">{apiUtils.formatCurrency(selectedCalculation.calculation_data?.labor?.daily_labor_cost || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Estimasi hari kerja:</span>
                                <span className="font-medium">{apiUtils.formatNumber(selectedCalculation.calculation_data?.input?.estimated_days || 0, 1)} hari</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">HPP Tenaga Kerja Total:</span>
                                <span className="font-medium">
                                  {apiUtils.formatCurrency(
                                    selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">HPP Tenaga Kerja per {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}:</span>
                                <span className="font-medium">
                                  {(() => {
                                    const volume = selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume || 1;
                                    const laborCost = selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0);
                                    return apiUtils.formatCurrency(laborCost / volume);
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Persentase Keuntungan:</span>
                                <span className="font-medium">{selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0}%</span>
                              </div>
                              <div className="flex justify-between font-semibold text-base">
                                <span className="text-green-800">RAB Tenaga Kerja Total:</span>
                                <span className="text-green-600">
                                  {(() => {
                                    const laborCost = selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0);
                                    const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                    return apiUtils.formatCurrency(laborCost * (1 + profitPercentage));
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">RAB TK per {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}:</span>
                                <span className="font-medium text-green-600">
                                  {(() => {
                                    const volume = selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume || 1;
                                    const laborCost = selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0);
                                    const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                    return apiUtils.formatCurrency((laborCost * (1 + profitPercentage)) / volume);
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Keuntungan Tenaga Kerja:</span>
                                <span className="font-medium text-green-600">
                                  {(() => {
                                    const laborCost = selectedCalculation.is_local 
                                      ? (selectedCalculation.summary?.total_labor_cost || 0)
                                      : (selectedCalculation.labor_cost || 0);
                                    const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                    return apiUtils.formatCurrency(laborCost * profitPercentage);
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RAB Material Detail */}
                        {selectedCalculation.calculation_data?.materials?.details?.length > 0 && (
                          <div className="mb-6">
                            <h6 className="font-medium text-green-800 mb-3 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              RAB Material
                            </h6>
                            <div className="bg-green-50 p-3 rounded-lg space-y-3 text-sm">
                              {selectedCalculation.calculation_data.materials.details.map((material, index) => (
                                <div key={index} className="bg-white p-3 rounded border border-green-200">
                                  <div className="font-medium text-green-800 mb-2">{material.material_name}</div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">HPP Material ini:</span>
                                      <span className="font-medium">{apiUtils.formatCurrency(material.material_cost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Persentase Keuntungan:</span>
                                      <span className="font-medium">{selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Keuntungan Material ini:</span>
                                      <span className="font-medium text-green-600">
                                        {(() => {
                                          const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                          return apiUtils.formatCurrency(material.material_cost * profitPercentage);
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                      <span className="text-green-700">RAB Material ini:</span>
                                      <span className="text-green-600">
                                        {(() => {
                                          const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                          return apiUtils.formatCurrency(material.material_cost * (1 + profitPercentage));
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="border-t border-green-200 pt-2 mt-2">
                                <div className="flex justify-between font-semibold text-base">
                                  <span className="text-green-800">RAB Material Total:</span>
                                  <span className="text-green-600">
                                    {(() => {
                                      const materialCost = selectedCalculation.is_local 
                                        ? (selectedCalculation.summary?.total_material_cost || 0)
                                        : (selectedCalculation.material_cost || 0);
                                      const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                      return apiUtils.formatCurrency(materialCost * (1 + profitPercentage));
                                    })()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">RAB Material per {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}:</span>
                                  <span className="font-medium text-green-600">
                                    {(() => {
                                      const volume = selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume || 1;
                                      const materialCost = selectedCalculation.is_local 
                                        ? (selectedCalculation.summary?.total_material_cost || 0)
                                        : (selectedCalculation.material_cost || 0);
                                      const profitPercentage = (selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0) / 100;
                                      return apiUtils.formatCurrency((materialCost * (1 + profitPercentage)) / volume);
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Total RAB Summary */}
                        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
                          <div className="space-y-2">
                            <div className="flex justify-between text-lg font-semibold">
                              <span className="text-green-800">TOTAL RAB AKHIR:</span>
                              <span className="text-green-600">
                                {(() => {
                                  if (selectedCalculation.is_local) {
                                    return apiUtils.formatCurrency(selectedCalculation.summary?.rab_total || 0);
                                  } else {
                                    const totalRAB = parseFloat(selectedCalculation.total_rab) || 0;
                                    return apiUtils.formatCurrency(isNaN(totalRAB) ? 0 : totalRAB);
                                  }
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">RAB per {selectedCalculation.job_type_unit || selectedCalculation.job_type?.unit}:</span>
                              <span className="font-semibold text-green-600">
                                {(() => {
                                  const volume = selectedCalculation.volume || selectedCalculation.calculation_data?.input?.volume || 1;
                                  if (selectedCalculation.is_local) {
                                    return apiUtils.formatCurrency((selectedCalculation.summary?.rab_total || 0) / volume);
                                  } else {
                                    const totalRAB = parseFloat(selectedCalculation.total_rab) || 0;
                                    return apiUtils.formatCurrency((isNaN(totalRAB) ? 0 : totalRAB) / volume);
                                  }
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Margin Keuntungan:</span>
                              <span className="font-medium text-green-600">
                                {(() => {
                                  const profitPercentage = selectedCalculation.profit_percentage || selectedCalculation.calculation_data?.input?.profit_percentage || 0;
                                  let totalHPP, totalRAB;
                                  
                                  if (selectedCalculation.is_local) {
                                    totalHPP = selectedCalculation.summary?.total_cost || 0;
                                    totalRAB = selectedCalculation.summary?.rab_total || 0;
                                  } else {
                                    const laborCost = parseFloat(selectedCalculation.labor_cost) || 0;
                                    const materialCost = parseFloat(selectedCalculation.material_cost) || 0;
                                    totalHPP = laborCost + materialCost;
                                    totalRAB = parseFloat(selectedCalculation.total_rab) || 0;
                                  }
                                  
                                  const actualMargin = totalHPP > 0 ? ((totalRAB - totalHPP) / totalHPP * 100) : 0;
                                  return `${profitPercentage}% (Aktual: ${actualMargin.toFixed(1)}%)`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Project Edit Modal */}
        {showProjectEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Nama Proyek</h3>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Proyek
                </label>
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama proyek"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProjectEditModal(false);
                    setProjectToEdit(null);
                    setEditProjectName('');
                  }}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={confirmEditProject}
                  className="btn-primary"
                  disabled={!editProjectName.trim()}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Delete Confirmation Modal */}
        {showProjectDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Hapus Proyek</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus proyek <strong>"{projectToDelete?.name}"</strong>? 
                Semua <strong>{projectToDelete?.totalCalculations} kalkulasi</strong> dalam proyek ini akan ikut terhapus.
                <br /><br />
                <span className="text-red-600 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProjectDeleteConfirm(false);
                    setProjectToDelete(null);
                  }}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="btn-danger"
                >
                  Hapus Proyek
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HistoryPage;
