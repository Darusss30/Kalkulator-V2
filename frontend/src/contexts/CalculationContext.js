import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

import apiService, { apiUtils } from '../services/api';
import { useAuth } from './AuthContext';
import { downloadSingleCalculationPDF } from '../utils/pdfGenerator';

// Local storage utilities
const LOCAL_STORAGE_KEY = 'kalkulator_local_history';

const saveToLocalStorage = (calculation) => {
  try {
    const existingHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const newCalculation = {
      ...calculation,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      is_local: true
    };
    
    // Add to beginning of array (newest first)
    const updatedHistory = [newCalculation, ...existingHistory];
    
    // Keep only last 50 calculations to prevent localStorage bloat
    const trimmedHistory = updatedHistory.slice(0, 50);
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmedHistory));
    return newCalculation;
  } catch (error) {
    return null;
  }
};

const updateInLocalStorage = (calculationId, updatedCalculation) => {
  try {
    const existingHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updatedHistory = existingHistory.map(calc => {
      if (calc.id === calculationId) {
        return {
          ...updatedCalculation,
          id: calculationId, // Keep the same ID
          created_at: calc.created_at, // Keep original creation date
          updated_at: new Date().toISOString(), // Add update timestamp
          is_local: true
        };
      }
      return calc;
    });
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory.find(calc => calc.id === calculationId);
  } catch (error) {
    return null;
  }
};

const getFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
  }
};

const removeFromLocalStorage = (calculationId) => {
  try {
    const existingHistory = getFromLocalStorage();
    const updatedHistory = existingHistory.filter(calc => calc.id !== calculationId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    return false;
  }
};

// Initial state
const initialState = {
  currentCalculation: null,
  calculationHistory: [],
  calculationStats: null,
  isCalculating: false,
  error: null,
  
  // Form state
  formData: {
    volume: '',
    productivity: '',
    worker_ratio: '1:1',
    num_workers: '',
    num_tukang: '',
    num_pekerja: '',
    brick_type: 'bata_merah', // Default brick type for "Pemasangan Bata"
    material_specs: [],
    profit_percentage: '20', // Default 20% profit
    project_name: '', // New: Project/client name
    custom_waste_factor: '0', // New: Custom waste factor (default 5%)
  },
  
  // UI state
  showResults: false,
  showMaterialSpecs: false,
  activeStep: 1,
};

// Action types
const CALC_ACTIONS = {
  SET_CALCULATING: 'SET_CALCULATING',
  SET_CALCULATION: 'SET_CALCULATION',
  SET_HISTORY: 'SET_HISTORY',
  SET_STATS: 'SET_STATS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Form actions
  UPDATE_FORM_DATA: 'UPDATE_FORM_DATA',
  RESET_FORM: 'RESET_FORM',
  SET_MATERIAL_SPECS: 'SET_MATERIAL_SPECS',
  
  // UI actions
  SET_SHOW_RESULTS: 'SET_SHOW_RESULTS',
  SET_SHOW_MATERIAL_SPECS: 'SET_SHOW_MATERIAL_SPECS',
  SET_ACTIVE_STEP: 'SET_ACTIVE_STEP',
  
  // Clear all
  CLEAR_ALL: 'CLEAR_ALL',
};

// Reducer
const calculationReducer = (state, action) => {
  switch (action.type) {
    case CALC_ACTIONS.SET_CALCULATING:
      return {
        ...state,
        isCalculating: action.payload,
      };
      
    case CALC_ACTIONS.SET_CALCULATION:
      return {
        ...state,
        currentCalculation: action.payload,
        isCalculating: false,
        error: null,
        showResults: true,
      };
      
    case CALC_ACTIONS.SET_HISTORY:
      return {
        ...state,
        calculationHistory: action.payload,
      };
      
    case CALC_ACTIONS.SET_STATS:
      return {
        ...state,
        calculationStats: action.payload,
      };
      
    case CALC_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isCalculating: false,
      };
      
    case CALC_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    case CALC_ACTIONS.UPDATE_FORM_DATA:
      // Only update if data actually contains changes
      const hasChanges = Object.keys(action.payload).some(key => 
        state.formData[key] !== action.payload[key]
      );
      
      if (!hasChanges) {
        return state; // Return same state reference to prevent re-render
      }
      
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };
      
    case CALC_ACTIONS.RESET_FORM:
      return {
        ...state,
        formData: initialState.formData,
        showResults: false,
        showMaterialSpecs: false,
        activeStep: 1,
        currentCalculation: null,
        error: null,
      };
      
    case CALC_ACTIONS.SET_MATERIAL_SPECS:
      return {
        ...state,
        formData: {
          ...state.formData,
          material_specs: action.payload,
        },
      };
      
    case CALC_ACTIONS.SET_SHOW_RESULTS:
      return {
        ...state,
        showResults: action.payload,
      };
      
    case CALC_ACTIONS.SET_SHOW_MATERIAL_SPECS:
      return {
        ...state,
        showMaterialSpecs: action.payload,
      };
      
    case CALC_ACTIONS.SET_ACTIVE_STEP:
      return {
        ...state,
        activeStep: action.payload,
      };
      
    case CALC_ACTIONS.CLEAR_ALL:
      return {
        ...initialState,
      };
      
    default:
      return state;
  }
};

// Create context
const CalculationContext = createContext();

// Calculation Provider Component
export const CalculationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calculationReducer, initialState);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Calculate mutation (no longer auto-saves)
  const calculateMutation = useMutation(
    ({ jobTypeId, calculationData }) => apiService.calculations.calculate(jobTypeId, calculationData),
    {
      onMutate: () => {
        dispatch({ type: CALC_ACTIONS.SET_CALCULATING, payload: true });
        dispatch({ type: CALC_ACTIONS.CLEAR_ERROR });
      },
      onSuccess: (response) => {
        const calculation = response.data.calculation;
        dispatch({ type: CALC_ACTIONS.SET_CALCULATION, payload: calculation });
        
        // AUTOSAVE COMPLETELY DISABLED - No automatic saving for any users
        if (!user) {
          toast.success('Kalkulasi berhasil! Gunakan tombol Simpan untuk menyimpan di browser Anda.');
        } else {
          toast.success('Kalkulasi berhasil! Gunakan tombol Simpan untuk menyimpan ke akun Anda.');
        }
      },
      onError: (error) => {
        dispatch({ type: CALC_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message || 'Kalkulasi gagal');
      },
    }
  );

  // Manual save mutation (new)
  const manualSaveMutation = useMutation(
    ({ jobTypeId, calculationData }) => apiService.calculations.saveCalculation(jobTypeId, calculationData),
    {
      onMutate: () => {
        dispatch({ type: CALC_ACTIONS.SET_CALCULATING, payload: true });
        dispatch({ type: CALC_ACTIONS.CLEAR_ERROR });
      },
      onSuccess: (response) => {
        const calculation = response.data.calculation;
        toast.success('Kalkulasi berhasil disimpan ke akun Anda!');
        // Invalidate history cache so it refreshes automatically
        queryClient.invalidateQueries(['calculation-history']);
      },
      onError: (error) => {
        dispatch({ type: CALC_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message || 'Gagal menyimpan kalkulasi');
      },
    }
  );

  // Update calculation mutation
  const updateCalculationMutation = useMutation(
    async ({ calculationId, calculationData }) => {
      // Check if this is a local calculation (starts with 'local_')
      if (calculationId && typeof calculationId === 'string' && calculationId.startsWith('local_')) {
        // Handle local storage update
        const volume = parseFloat(calculationData.volume) || 0;
        const productivity = parseFloat(calculationData.productivity) || 1;
        const profitPercentage = parseFloat(calculationData.profit_percentage) || 20;
        
        // Extract worker numbers from worker_ratio
        const [numTukang, numPekerja] = calculationData.worker_ratio.split(':').map(Number);
        
        // Basic labor cost calculation (simplified for local storage)
        const tukangDailyRate = 150000; // Default rate
        const pekerjaDailyRate = 135000; // Default rate
        const estimatedDays = Math.ceil(volume / productivity);
        const totalLaborCost = (numTukang * tukangDailyRate + numPekerja * pekerjaDailyRate) * estimatedDays;
        
        // Material cost (simplified - would normally come from material specs)
        const totalMaterialCost = calculationData.material_specs?.length > 0 ? volume * 50000 : 0;
        
        // Total costs
        const totalCost = totalLaborCost + totalMaterialCost;
        const hppPerUnit = totalCost / volume;
        const rabTotal = totalCost * (1 + profitPercentage / 100);
        const rabPerUnit = rabTotal / volume;
        const profitAmount = rabTotal - totalCost;
        
        const mockUpdatedCalculation = {
          id: calculationId, // Keep the same ID
          job_type: { name: 'Updated Job', unit: 'unit' },
          input: {
            ...calculationData,
            estimated_days: estimatedDays,
            volume: volume,
            productivity: productivity,
            profit_percentage: profitPercentage
          },
          summary: {
            total_cost: totalCost,
            total_labor_cost: totalLaborCost,
            total_material_cost: totalMaterialCost,
            hpp_per_unit: hppPerUnit,
            rab_total: rabTotal,
            rab_per_unit: rabPerUnit,
            profit_percentage: profitPercentage,
            profit_amount: profitAmount
          },
          labor: {
            num_tukang: numTukang,
            num_pekerja: numPekerja,
            tukang_daily_rate: tukangDailyRate,
            pekerja_daily_rate: pekerjaDailyRate,
            daily_labor_cost: numTukang * tukangDailyRate + numPekerja * pekerjaDailyRate,
            total_labor_cost: totalLaborCost,
            labor_cost_per_unit: totalLaborCost / volume
          },
          materials: calculationData.material_specs?.length > 0 ? {
            total_material_cost: totalMaterialCost,
            details: calculationData.material_specs.map(spec => ({
              material_id: spec.material_id,
              material_name: `Material ${spec.material_id}`,
              material_unit: 'unit',
              material_price: 50000,
              quantity_per_unit: spec.quantity_override || 1,
              total_quantity: (spec.quantity_override || 1) * volume,
              material_cost: (spec.quantity_override || 1) * volume * 50000
            }))
          } : null,
          calculation_data: {
            input: {
              ...calculationData,
              estimated_days: estimatedDays,
              volume: volume,
              productivity: productivity,
              profit_percentage: profitPercentage
            },
            labor: {
              num_tukang: numTukang,
              num_pekerja: numPekerja,
              tukang_daily_rate: tukangDailyRate,
              pekerja_daily_rate: pekerjaDailyRate,
              total_labor_cost: totalLaborCost
            },
            materials: calculationData.material_specs?.length > 0 ? {
              total_material_cost: totalMaterialCost,
              details: calculationData.material_specs.map(spec => ({
                material_id: spec.material_id,
                quantity_per_unit: spec.quantity_override || 1,
                total_quantity: (spec.quantity_override || 1) * volume,
                material_cost: (spec.quantity_override || 1) * volume * 50000
              }))
            } : null
          }
        };
        
        const result = updateInLocalStorage(calculationId, mockUpdatedCalculation);
        if (!result) {
          throw new Error('Gagal memperbarui kalkulasi lokal');
        }
        return { data: { calculation: result } };
      } else {
        // For server calculations, use the real API endpoint
        return await apiService.calculations.updateCalculation(calculationId, calculationData);
      }
    },
    {
      onMutate: () => {
        dispatch({ type: CALC_ACTIONS.SET_CALCULATING, payload: true });
        dispatch({ type: CALC_ACTIONS.CLEAR_ERROR });
      },
      onSuccess: (response) => {
        // Handle different response structures
        const calculation = response.data?.calculation || response.data;
        
        if (calculation) {
          dispatch({ type: CALC_ACTIONS.SET_CALCULATION, payload: calculation });
          
          // Convert calculation.id to string before checking startsWith
          const calculationId = String(calculation.id || '');
          if (calculationId.startsWith('local_')) {
            toast.success('Kalkulasi berhasil diperbarui di browser Anda!');
          } else {
            toast.success('Kalkulasi berhasil diperbarui!');
            // Invalidate history cache so it refreshes automatically
            queryClient.invalidateQueries(['calculation-history']);
          }
        } else {
          // If no calculation data in response, just show success message
          toast.success('Kalkulasi berhasil diperbarui!');
          // Invalidate history cache so it refreshes automatically
          queryClient.invalidateQueries(['calculation-history']);
        }
      },
      onError: (error) => {
        dispatch({ type: CALC_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message || 'Gagal memperbarui kalkulasi');
      },
    }
  );
  
  // Quick calculate mutation
  const quickCalculateMutation = useMutation(
    ({ jobTypeId, calculationData }) => apiService.calculations.quickCalculate(jobTypeId, calculationData),
    {
      onMutate: () => {
        dispatch({ type: CALC_ACTIONS.SET_CALCULATING, payload: true });
        dispatch({ type: CALC_ACTIONS.CLEAR_ERROR });
      },
      onSuccess: (response) => {
        dispatch({ type: CALC_ACTIONS.SET_CALCULATION, payload: response.data.calculation });
        toast.success('Kalkulasi cepat berhasil!');
      },
      onError: (error) => {
        dispatch({ type: CALC_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.message || 'Kalkulasi cepat gagal');
      },
    }
  );
  
  // Calculation methods
  const calculate = useCallback(async (jobTypeId, calculationData) => {
    return calculateMutation.mutateAsync({ jobTypeId, calculationData });
  }, [calculateMutation]);

  const manualSaveCalculation = useCallback(async (jobTypeId, calculationData) => {
    return manualSaveMutation.mutateAsync({ jobTypeId, calculationData });
  }, [manualSaveMutation]);

  const updateCalculation = useCallback(async (calculationId, calculationData) => {
    return updateCalculationMutation.mutateAsync({ calculationId, calculationData });
  }, [updateCalculationMutation]);
  
  const quickCalculate = useCallback(async (jobTypeId, calculationData) => {
    return quickCalculateMutation.mutateAsync({ jobTypeId, calculationData });
  }, [quickCalculateMutation]);
  
  // Form methods with optimization to prevent unnecessary updates
  const updateFormData = useCallback((data) => {
    dispatch({ type: CALC_ACTIONS.UPDATE_FORM_DATA, payload: data });
  }, []);
  
  const resetForm = useCallback(() => {
    dispatch({ type: CALC_ACTIONS.RESET_FORM });
  }, []);
  
  const setMaterialSpecs = useCallback((specs) => {
    dispatch({ type: CALC_ACTIONS.SET_MATERIAL_SPECS, payload: specs });
  }, []);
  
  // UI methods
  const setShowResults = useCallback((show) => {
    dispatch({ type: CALC_ACTIONS.SET_SHOW_RESULTS, payload: show });
  }, []);
  
  const setShowMaterialSpecs = useCallback((show) => {
    dispatch({ type: CALC_ACTIONS.SET_SHOW_MATERIAL_SPECS, payload: show });
  }, []);
  
  const setActiveStep = useCallback((step) => {
    dispatch({ type: CALC_ACTIONS.SET_ACTIVE_STEP, payload: step });
  }, []);
  
  const clearError = useCallback(() => {
    dispatch({ type: CALC_ACTIONS.CLEAR_ERROR });
  }, []);
  
  const clearAll = useCallback(() => {
    dispatch({ type: CALC_ACTIONS.CLEAR_ALL });
  }, []);
  
  // Validation methods
  const validateFormData = useCallback((data = state.formData) => {
    const errors = {};
    
    // Volume validation - check both volume and manual_volume fields
    // Priority: manual_volume takes precedence if it exists and is not empty
    let volumeValue = null;
    let fieldName = 'volume';
    
    if (data.manual_volume !== undefined && data.manual_volume !== '') {
      volumeValue = data.manual_volume;
      fieldName = 'manual_volume';
    } else if (data.volume !== undefined && data.volume !== '') {
      volumeValue = data.volume;
      fieldName = 'volume';
    }
    
    const parsedVolume = parseFloat(volumeValue);
    
    if (!volumeValue || volumeValue === '' || isNaN(parsedVolume) || parsedVolume <= 0) {
      errors[fieldName] = 'Volume pekerjaan harus diisi dan lebih dari 0. Volume tidak boleh kosong atau bernilai negatif.';
    }
    
    // Productivity validation
    const productivityValue = parseFloat(data.productivity);
    if (!data.productivity || data.productivity === '' || isNaN(productivityValue) || productivityValue <= 0) {
      errors.productivity = 'Produktivitas harus diisi dan lebih dari 0. Masukkan nilai produktivitas per hari yang valid.';
    }
    
    // Profit percentage validation
    const profitPercentage = parseFloat(data.profit_percentage);
    if (data.profit_percentage === undefined || data.profit_percentage === '' || isNaN(profitPercentage)) {
      errors.profit_percentage = 'Persentase keuntungan harus diisi';
    } else if (profitPercentage < 0) {
      errors.profit_percentage = 'Persentase keuntungan tidak boleh negatif';
    } else if (profitPercentage >= 100) {
      errors.profit_percentage = 'Persentase keuntungan harus kurang dari 100%';
    }
    
    // Support both worker_ratio and num_tukang/num_pekerja formats
    if (data.num_tukang !== undefined && data.num_pekerja !== undefined) {
      // New format validation
      const numTukang = parseInt(data.num_tukang) || 0;
      const numPekerja = parseInt(data.num_pekerja) || 0;
      
      if (numTukang < 0) {
        errors.num_tukang = 'Jumlah tukang tidak boleh negatif';
      }
      
      if (numPekerja < 0) {
        errors.num_pekerja = 'Jumlah pekerja tidak boleh negatif';
      }
      
      // Ensure at least one worker (tukang or pekerja)
      if (numTukang === 0 && numPekerja === 0) {
        errors.workers = 'Minimal harus ada 1 tukang atau 1 pekerja untuk melakukan pekerjaan';
      }
    } else {
      // Legacy format validation
      if (!data.worker_ratio || !/^\d+:\d+$/.test(data.worker_ratio)) {
        errors.worker_ratio = 'Rasio pekerja harus dalam format "angka:angka" (contoh: 1:1)';
      }
    }
    
    if (data.num_workers && parseInt(data.num_workers) <= 0) {
      errors.num_workers = 'Jumlah pekerja harus lebih dari 0';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [state.formData]);
  
  // Calculation utilities
  const formatCurrency = useCallback((amount) => {
    return apiUtils.formatCurrency(amount);
  }, []);
  
  const formatNumber = useCallback((number, decimals = 0) => {
    return apiUtils.formatNumber(number, decimals);
  }, []);
  
  const parseNumber = useCallback((formattedNumber) => {
    return apiUtils.parseNumber(formattedNumber);
  }, []);
  
  // Calculate estimated days with workforce consideration
  const calculateEstimatedDays = useCallback((volume, productivity, numTukang = 0, numPekerja = 0, workerRatio = '1:1') => {
    if (!volume || !productivity) return 0;
    
    const vol = parseFloat(volume);
    const prod = parseFloat(productivity);
    const tukang = parseInt(numTukang) || 0;
    const pekerja = parseInt(numPekerja) || 0;
    
    // If no workers specified, use simple calculation
    if (tukang === 0 && pekerja === 0) {
      return Math.ceil(vol / prod);
    }
    
    // Parse worker ratio
    const [rasioTukang, rasioPerkerja] = workerRatio.split(':').map(Number);
    
    // Validate ratio
    if (isNaN(rasioTukang) || isNaN(rasioPerkerja) || rasioTukang < 0 || rasioPerkerja < 0) {
      return Math.ceil(vol / prod);
    }
    
    // Handle edge case: if both are 0, no work can be done
    if (rasioTukang === 0 && rasioPerkerja === 0) {
      return 0;
    }
    
    // Calculate number of teams that can be formed (same logic as backend)
    let jumlahTim = 0;
    
    if (rasioTukang > 0 && rasioPerkerja > 0) {
      // Both types of workers needed
      const timDariTukang = Math.floor(tukang / rasioTukang);
      const timDariPekerja = Math.floor(pekerja / rasioPerkerja);
      jumlahTim = Math.min(timDariTukang, timDariPekerja);
    } else if (rasioTukang > 0 && rasioPerkerja === 0) {
      // Only tukang needed
      jumlahTim = Math.floor(tukang / rasioTukang);
    } else if (rasioTukang === 0 && rasioPerkerja > 0) {
      // Only pekerja needed
      jumlahTim = Math.floor(pekerja / rasioPerkerja);
    }
    
    // Calculate total productivity based on number of teams
    const totalProduktivitas = prod * jumlahTim;
    
    // Calculate duration (round up, same as backend)
    const durasiKerja = totalProduktivitas > 0 ? Math.ceil(vol / totalProduktivitas) : 0;
    
    return durasiKerja;
  }, []);
  
  // Calculate total workers from ratio
  const calculateTotalWorkers = useCallback((ratio, baseWorkers = 1) => {
    if (!ratio || !/^\d+:\d+$/.test(ratio)) return 0;
    
    const [tukang, pekerja] = ratio.split(':').map(Number);
    return (tukang + pekerja) * baseWorkers;
  }, []);
  
  // Calculate RAB from HPP and profit percentage
  const calculateRAB = useCallback((hpp, profitPercentage) => {
    if (!hpp || !profitPercentage || profitPercentage >= 100) return 0;
    
    const profitDecimal = parseFloat(profitPercentage) / 100;
    const rab = hpp / (1 - profitDecimal);
    
    return Math.round(rab);
  }, []);
  
  // Calculate profit amount from RAB and profit percentage
  const calculateProfitAmount = useCallback((rab, profitPercentage) => {
    if (!rab || !profitPercentage) return 0;
    
    const profitDecimal = parseFloat(profitPercentage) / 100;
    const profitAmount = rab * profitDecimal;
    
    return Math.round(profitAmount);
  }, []);
  
  // Get calculation summary
  const getCalculationSummary = useCallback(() => {
    if (!state.currentCalculation) return null;
    
    const calc = state.currentCalculation;
    const profitPercentage = calc.input?.profit_percentage || 0;
    const hpp = calc.summary?.total_cost || 0;
    const rab = calculateRAB(hpp, profitPercentage);
    const profitAmount = calculateProfitAmount(rab, profitPercentage);
    
    return {
      jobType: calc.job_type?.name || 'Unknown',
      volume: calc.input?.volume || 0,
      unit: calc.job_type?.unit || '',
      totalCost: hpp,
      hppPerUnit: calc.summary?.hpp_per_unit || 0,
      laborCost: calc.summary?.total_labor_cost || 0,
      materialCost: calc.summary?.total_material_cost || 0,
      estimatedDays: calc.input?.estimated_days || 0,
      totalWorkers: calc.labor?.total_workers || 0,
      profitPercentage: profitPercentage,
      rabTotal: rab,
      rabPerUnit: Math.round(rab / (calc.input?.volume || 1)),
      profitAmount: profitAmount,
    };
  }, [state.currentCalculation, calculateRAB, calculateProfitAmount]);
  
  // Export calculation data
  const exportCalculation = useCallback((format = 'json') => {
    if (!state.currentCalculation) {
      toast.error('Tidak ada data kalkulasi untuk diekspor');
      return;
    }
    
    const data = state.currentCalculation;
    const filename = `kalkulasi-${data.job_type?.name?.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'pdf') {
      try {
        downloadSingleCalculationPDF(data);
        toast.success('Data kalkulasi berhasil diekspor sebagai PDF');
      } catch (error) {
        toast.error('Gagal mengekspor PDF');
        console.error('PDF export error:', error);
      }
    } else if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      apiUtils.downloadFile(blob, `${filename}.json`);
      toast.success('Data kalkulasi berhasil diekspor sebagai JSON');
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Item', 'Value'],
        ['Jenis Pekerjaan', data.job_type?.name || ''],
        ['Volume', `${data.input?.volume || 0} ${data.job_type?.unit || ''}`],
        ['Produktivitas', `${data.input?.productivity || 0} ${data.job_type?.unit || ''}/hari`],
        ['Rasio Pekerja', data.input?.worker_ratio || ''],
        ['Estimasi Hari', `${data.input?.estimated_days || 0} hari`],
        ['Total Pekerja', `${data.labor?.total_workers || 0} orang`],
        ['Biaya Jasa', formatCurrency(data.summary?.total_labor_cost || 0)],
        ['Biaya Bahan', formatCurrency(data.summary?.total_material_cost || 0)],
        ['HPP per Satuan', formatCurrency(data.summary?.hpp_per_unit || 0)],
        ['Total HPP', formatCurrency(data.summary?.total_cost || 0)],
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      apiUtils.downloadFile(blob, `${filename}.csv`);
      toast.success('Data kalkulasi berhasil diekspor sebagai CSV');
    }
  }, [state.currentCalculation, formatCurrency]);
  
  // Local storage methods
  const getLocalHistory = useCallback(() => {
    return getFromLocalStorage();
  }, []);
  
  const deleteLocalCalculation = useCallback((calculationId) => {
    const success = removeFromLocalStorage(calculationId);
    if (success) {
      toast.success('Kalkulasi berhasil dihapus dari browser');
    } else {
      toast.error('Gagal menghapus kalkulasi');
    }
    return success;
  }, []);
  
  const clearLocalHistory = useCallback(() => {
    clearLocalStorage();
    toast.success('Semua kalkulasi lokal berhasil dihapus');
  }, []);
  
  const syncLocalToServer = useCallback(async () => {
    if (!user) {
      toast.error('Anda harus login untuk menyinkronkan data');
      return false;
    }
    
    const localHistory = getFromLocalStorage();
    if (localHistory.length === 0) {
      toast.info('Tidak ada kalkulasi lokal untuk disinkronkan');
      return true;
    }
    
    try {
      // This would require a new backend endpoint to bulk save calculations
      // For now, we'll just clear local storage after successful login
      clearLocalStorage();
      toast.success(`${localHistory.length} kalkulasi lokal berhasil disinkronkan`);
      return true;
    } catch (error) {
      toast.error('Gagal menyinkronkan kalkulasi lokal');
      return false;
    }
  }, [user]);
  
  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    calculate,
    manualSaveCalculation,
    updateCalculation,
    quickCalculate,
    updateFormData,
    resetForm,
    setMaterialSpecs,
    setShowResults,
    setShowMaterialSpecs,
    setActiveStep,
    clearError,
    clearAll,
    
    // Validation
    validateFormData,
    
    // Utilities
    formatCurrency,
    formatNumber,
    parseNumber,
    calculateEstimatedDays,
    calculateTotalWorkers,
    calculateRAB,
    calculateProfitAmount,
    getCalculationSummary,
    exportCalculation,
    
    // Local storage methods
    getLocalHistory,
    deleteLocalCalculation,
    clearLocalHistory,
    syncLocalToServer,
    
    // Loading states
    isCalculating: state.isCalculating || calculateMutation.isLoading || manualSaveMutation.isLoading || updateCalculationMutation.isLoading || quickCalculateMutation.isLoading,
  };
  
  return (
    <CalculationContext.Provider value={value}>
      {children}
    </CalculationContext.Provider>
  );
};

// Custom hook to use calculation context
export const useCalculation = () => {
  const context = useContext(CalculationContext);
  
  if (!context) {
    throw new Error('useCalculation must be used within a CalculationProvider');
  }
  
  return context;
};

// HOC for components that need calculation context
export const withCalculation = (Component) => {
  return function CalculationComponent(props) {
    const calculationContext = useCalculation();
    
    return <Component {...props} calculation={calculationContext} />;
  };
};

export default CalculationContext;
