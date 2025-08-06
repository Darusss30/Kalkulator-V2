import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Package,
  Save,
  Plus,
  X,
  Search,
  CheckCircle,
  Building2,
  Ruler,
  Settings,
  Info,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import apiService from '../../services/api';

const BrickCalculator = ({ jobType, onCalculationComplete }) => {
  const [formData, setFormData] = useState({
    area: '',
    brick_type: 'bata_merah', // bata_merah, bata_putih, bata_ringan
    mortar_ratio: '1:4', // 1:3, 1:4, 1:5, 1:6
    productivity: '8',
    profit_percentage: '20',
    waste_factor: '5',
    // Workers
    worker_ratio: '1:1',
    num_tukang: '1',
    num_pekerja: '1',
    project_name: ''
  });

  const [materials, setMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Fixed rates
  const TUKANG_RATE = 150000;
  const PEKERJA_RATE = 135000;

  // Fetch materials from database
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    error: materialsError
  } = useQuery(
    ['materials', { limit: 500 }],
    () => apiService.materials.getMaterials({ limit: 500 }),
    {
      onSuccess: (data) => {
        setAvailableMaterials(data?.data?.materials || []);
      },
      onError: (error) => {
        console.error('Error fetching materials:', error);
        toast.error('Gagal memuat data material dari database');
        setAvailableMaterials([]);
      }
    }
  );

  // Fetch job-specific materials if jobType is available and has a valid numeric ID
  const {
    data: jobMaterialsData,
    isLoading: isLoadingJobMaterials
  } = useQuery(
    ['jobTypeMaterials', jobType?.id],
    () => apiService.materials.getMaterialsByJobType(jobType.id),
    {
      enabled: !!jobType?.id && typeof jobType.id === 'number',
      onSuccess: (data) => {
        console.log('Job-specific materials loaded:', data?.data);
      },
      onError: (error) => {
        console.error('Error fetching job materials:', error);
      }
    }
  );

  // Brick type options
  const brickTypes = [
    {
      value: 'bata_merah',
      label: 'Bata Merah',
      description: 'Bata tanah liat bakar tradisional',
      brickSize: { length: 20, width: 10, height: 5 }, // cm
      bricksPerM2: 60, // pieces per m² (sesuai data user: 60 biji/m²)
      cementPerM2: 11, // kg per m² (sesuai data user: 11 kg/m²)
      mortarThickness: 3.0, // cm
      materials: ['bata_merah', 'pasir_japanan', 'semen']
    },
    {
      value: 'bata_putih',
      label: 'Bata Putih',
      description: 'Bata putih kapur tradisional',
      brickSize: { length: 25, width: 12, height: 6 }, // cm (ukuran khas bata putih kapur)
      bricksPerM2: 35, // pieces per m² (sesuai data user: 35 biji/m²)
      cementPerM2: 16, // kg per m² (sesuai data user: 16 kg/m²)
      mortarThickness: 2.0, // cm
      materials: ['bata_putih', 'pasir_japanan', 'semen']
    },
    {
      value: 'bata_ringan',
      label: 'Bata Ringan',
      description: 'Bata ringan dengan mortar instan',
      brickSize: { length: 60, width: 20, height: 10 }, // cm
      bricksPerM2: 9, // pieces per m² (sesuai data user: 9 buah/m²)
      giantPerM2: 5, // kg per m² (sesuai data user: 5 kg/m²)
      mortarThickness: 0.3, // cm
      materials: ['bata_ringan', 'giant'] // Only brick and instant mortar
    }
  ];

  // Mortar ratio options
  const mortarRatios = [
    { value: '1:3', label: '1:3 (Semen : Pasir)', strength: 'Tinggi', cementRatio: 0.25 },
    { value: '1:4', label: '1:4 (Semen : Pasir)', strength: 'Sedang-Tinggi', cementRatio: 0.20 },
    { value: '1:5', label: '1:5 (Semen : Pasir)', strength: 'Sedang', cementRatio: 0.167 },
    { value: '1:6', label: '1:6 (Semen : Pasir)', strength: 'Rendah', cementRatio: 0.143 }
  ];

  // Get current brick type configuration
  const getCurrentBrickType = () => {
    return brickTypes.find(type => type.value === formData.brick_type) || brickTypes[0];
  };

  // Get current mortar ratio configuration
  const getCurrentMortarRatio = () => {
    return mortarRatios.find(ratio => ratio.value === formData.mortar_ratio) || mortarRatios[1];
  };

  // Calculate material coefficients based on brick type and mortar ratio
  const calculateMaterialCoefficients = useCallback(() => {
    const brickType = getCurrentBrickType();
    const mortarRatio = getCurrentMortarRatio();
    
    const coefficients = {
      brick: brickType.bricksPerM2, // pieces per m²
      mortar_volume: 0, // m³ per m²
      cement: 0, // sak per m²
      sand: 0, // m³ per m²
      giant: 0 // sak per m²
    };

    if (formData.brick_type === 'bata_ringan') {
      // Use specific GIANT requirements from user data
      if (brickType.giantPerM2) {
        // Convert kg to sak (1 sak GIANT = 25kg)
        coefficients.giant = brickType.giantPerM2 / 25; // sak per m²
      } else {
        // Fallback to old calculation
        coefficients.giant = 0.6; // sak per m²
      }
    } else {
      // Use specific cement requirements from user data
      if (brickType.cementPerM2) {
        // Convert kg to sak (1 sak = 40kg for Tiga Roda cement)
        coefficients.cement = brickType.cementPerM2 / 40; // sak per m²
      } else {
        // Fallback to old calculation method
        const brickArea = (brickType.brickSize.length * brickType.brickSize.height) / 10000; // m²
        const totalBrickArea = coefficients.brick * brickArea;
        const mortarArea = 1 - totalBrickArea; // remaining area for mortar
        const mortarVolume = mortarArea * (brickType.mortarThickness / 100); // m³
        
        coefficients.mortar_volume = mortarVolume;
        
        const cementRatio = mortarRatio.cementRatio;
        const sandRatio = 1 - cementRatio;
        
        // Cement: typically 1 sak cement = 0.024 m³
        coefficients.cement = (mortarVolume * cementRatio) / 0.024; // sak per m²
        coefficients.sand = mortarVolume * sandRatio; // m³ per m²
      }
      
      // Calculate sand requirement (estimate: 1 part cement needs 3-4 parts sand by volume)
      // For 1 sak cement (40kg), approximately need 0.1 m³ sand
      coefficients.sand = coefficients.cement * 0.1; // m³ per m²
    }

    return coefficients;
  }, [formData.brick_type, formData.mortar_ratio]);

  // Load materials from database based on brick type
  const loadDefaultMaterials = useCallback(() => {
    if (availableMaterials.length === 0) return;

    const brickType = getCurrentBrickType();
    const coefficients = calculateMaterialCoefficients();
    
    const defaultMaterials = [];

    // Helper function to find material from database
    const findMaterial = (searchTerms, fallbackData) => {
      // Try exact match first
      let found = availableMaterials.find(material => {
        const materialName = material.name.toLowerCase();
        return searchTerms.some(term => materialName === term.toLowerCase());
      });
      
      // If no exact match, try partial match
      if (!found) {
        found = availableMaterials.find(material => {
          const materialName = material.name.toLowerCase();
          return searchTerms.some(term => materialName.includes(term.toLowerCase()));
        });
      }
      
      if (found) {
        return {
          ...found,
          quantity: fallbackData.quantity,
          description: found.description || fallbackData.description,
          isFromDatabase: true
        };
      } else {
        // Create placeholder if not found in database
        return {
          id: `placeholder_${fallbackData.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: fallbackData.name,
          unit: fallbackData.unit,
          price: fallbackData.price,
          quantity: fallbackData.quantity,
          description: fallbackData.description,
          isPlaceholder: true,
          isFromDatabase: false
        };
      }
    };

    // Add brick material based on type
    if (formData.brick_type === 'bata_merah') {
      // For bata merah, use direct PCS calculation instead of database unit conversion
      // Find database material for price reference only
      const dbMaterial = availableMaterials.find(material => {
        const materialName = material.name.toLowerCase();
        return materialName.includes('bata merah') && materialName.includes('6000');
      });
      
      const brickMaterial = {
        id: dbMaterial?.id || 'placeholder_bata_merah',
        name: 'BATA MERAH',
        unit: 'PCS',
        price: dbMaterial ? (dbMaterial.price / 6000) : 800, // Convert from truk price to per piece
        quantity: coefficients.brick, // Direct pieces per m² (60 pieces)
        description: 'Bata merah tanah liat bakar tradisional',
        supplier: dbMaterial?.supplier || 'Supplier Lokal',
        isFromDatabase: !!dbMaterial,
        isPlaceholder: !dbMaterial
      };
      defaultMaterials.push(brickMaterial);
    } else if (formData.brick_type === 'bata_putih') {
      // For bata putih, use direct PCS calculation instead of database unit conversion
      // Find database material for price reference only
      const dbMaterial = availableMaterials.find(material => {
        const materialName = material.name.toLowerCase();
        return materialName.includes('bata putih') && materialName.includes('2000');
      });
      
      const brickMaterial = {
        id: dbMaterial?.id || 'placeholder_bata_putih',
        name: 'BATA PUTIH',
        unit: 'PCS',
        price: dbMaterial ? (dbMaterial.price / 2000) : 1350, // Convert from dum price to per piece (2000 pcs per dum)
        quantity: coefficients.brick, // Direct pieces per m² (35 pieces)
        description: 'Bata putih kapur tradisional',
        supplier: dbMaterial?.supplier || 'Supplier Lokal',
        isFromDatabase: !!dbMaterial,
        isPlaceholder: !dbMaterial
      };
      defaultMaterials.push(brickMaterial);
    } else if (formData.brick_type === 'bata_ringan') {
      // For bata ringan, use direct PCS calculation instead of database unit conversion
      // Find database material for price reference only
      const dbMaterial = availableMaterials.find(material => {
        const materialName = material.name.toLowerCase();
        return materialName.includes('bata ringan') || materialName.includes('aac') || materialName.includes('clc');
      });
      
      const brickMaterial = {
        id: dbMaterial?.id || 'placeholder_bata_ringan',
        name: 'BATA RINGAN',
        unit: 'PCS',
        price: dbMaterial ? (dbMaterial.unit === 'M3' ? (dbMaterial.price / 111) : dbMaterial.price) : 2200, // Convert from M3 price to per piece (111 pcs per M3)
        quantity: coefficients.brick, // Direct pieces per m² (9 pieces)
        description: 'Bata ringan ukuran 60×20×10 cm',
        supplier: dbMaterial?.supplier || 'Supplier Lokal',
        isFromDatabase: !!dbMaterial,
        isPlaceholder: !dbMaterial
      };
      defaultMaterials.push(brickMaterial);
    }

    // Add mortar materials
    if (formData.brick_type === 'bata_ringan') {
      // Giant mortar for bata ringan
      const giantMaterial = findMaterial(
        ['giant', 'mortar instan', 'semen instan'],
        {
          name: 'GIANT MORTAR INSTAN',
          unit: 'SAK',
          price: 45000,
          quantity: coefficients.giant,
          description: 'Mortar instan untuk bata ringan (25kg per sak)'
        }
      );
      defaultMaterials.push(giantMaterial);
    } else {
      // Cement and sand for bata merah/putih
      const cementMaterial = findMaterial(
        ['SEMEN TIGA RODA'],
        {
          name: 'SEMEN TIGA RODA',
          unit: 'SAK',
          price: 54000, // Updated price from database
          quantity: coefficients.cement,
          description: 'Semen Tiga Roda 40kg per sak untuk spesi'
        }
      );
      defaultMaterials.push(cementMaterial);
      
      const sandMaterial = findMaterial(
        ['PASIR JAPANAN TRUK'],
        {
          name: 'PASIR JAPANAN TRUK',
          unit: 'truk',
          price: 1700000,
          quantity: coefficients.sand / 7, // Convert m³ to truk (1 truk = 7 m³)
          description: 'Pasir Japanan halus untuk spesi (7 m³ per truk)'
        }
      );
      defaultMaterials.push(sandMaterial);
    }

    setMaterials(defaultMaterials);

    // Show success message
    const foundMaterials = defaultMaterials.filter(m => !m.isPlaceholder).length;
    const placeholderMaterials = defaultMaterials.filter(m => m.isPlaceholder).length;
    
    if (foundMaterials > 0) {
      toast.success(`${foundMaterials} material ditemukan di database${placeholderMaterials > 0 ? `, ${placeholderMaterials} material placeholder dibuat` : ''}`);
    } else if (placeholderMaterials > 0) {
      toast(`${placeholderMaterials} material placeholder dibuat. Pastikan database memiliki material yang diperlukan.`, {
        icon: '⚠️',
        duration: 4000,
      });
    }
  }, [availableMaterials, formData.brick_type, formData.mortar_ratio, calculateMaterialCoefficients]);

  // Load materials when brick type or mortar ratio changes
  useEffect(() => {
    loadDefaultMaterials();
  }, [formData.brick_type, formData.mortar_ratio, loadDefaultMaterials]);

  // Set productivity from jobType when component mounts or jobType changes
  useEffect(() => {
    if (jobType && jobType.base_productivity) {
      setFormData(prev => ({
        ...prev,
        productivity: jobType.base_productivity.toString()
      }));
    }
  }, [jobType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInputFocus = (e) => {
    // Auto-select all text when input is focused
    e.target.select();
  };

  const updateMaterialQuantity = (materialId, quantity) => {
    setMaterials(prev => prev.map(m => 
      m.id === materialId ? { ...m, quantity: parseFloat(quantity) || 0 } : m
    ));
  };

  // Material selector functions
  const toggleMaterialSelection = (material) => {
    setSelectedMaterials(prev => {
      const isSelected = prev.some(m => m.id === material.id);
      if (isSelected) {
        return prev.filter(m => m.id !== material.id);
      } else {
        return [...prev, material];
      }
    });
  };

  const addSelectedMaterials = () => {
    const newMaterials = selectedMaterials.filter(material => 
      !materials.some(m => m.id === material.id)
    ).map(material => ({
      ...material,
      quantity: material.quantity_per_unit || 1
    }));
    
    setMaterials(prev => [...prev, ...newMaterials]);
    setSelectedMaterials([]);
    setShowMaterialSelector(false);
    setMaterialSearch('');
    
    if (newMaterials.length > 0) {
      toast.success(`${newMaterials.length} material berhasil ditambahkan`);
    }
  };

  const removeMaterial = (materialId) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const openMaterialSelector = () => {
    setShowMaterialSelector(true);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showMaterialSelector) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showMaterialSelector]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.area || parseFloat(formData.area) <= 0) {
      newErrors.area = 'Luas dinding harus diisi dan lebih dari 0';
    }

    if (!formData.productivity || parseFloat(formData.productivity) <= 0) {
      newErrors.productivity = 'Produktivitas harus diisi dan lebih dari 0';
    }

    const profitPercentage = parseFloat(formData.profit_percentage);
    if (isNaN(profitPercentage) || profitPercentage < 0) {
      newErrors.profit_percentage = 'Keuntungan minimal 0%';
    }

    const wasteFactor = parseFloat(formData.waste_factor);
    if (isNaN(wasteFactor) || wasteFactor < 0) {
      newErrors.waste_factor = 'Faktor pemborosan minimal 0%';
    }

    const numTukang = parseInt(formData.num_tukang) || 0;
    const numPekerja = parseInt(formData.num_pekerja) || 0;
    if (numTukang < 0 || numPekerja < 0) {
      newErrors.workers = 'Jumlah pekerja tidak boleh negatif';
    }

    if (numTukang === 0 && numPekerja === 0) {
      newErrors.workers = 'Minimal harus ada 1 tukang atau 1 pekerja';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCosts = () => {
    if (!validateForm()) return;

    setIsCalculating(true);

    try {
      const area = parseFloat(formData.area) || 0;
      const productivity = parseFloat(formData.productivity) || 0;
      const profitPercentage = (parseFloat(formData.profit_percentage) || 0) / 100;
      const wasteFactor = (parseFloat(formData.waste_factor) || 0) / 100;
      const numTukang = parseInt(formData.num_tukang) || 0;
      const numPekerja = parseInt(formData.num_pekerja) || 0;
      const workerRatio = formData.worker_ratio || '1:1';

      // Calculate labor costs
      const dailyLaborCost = (numTukang * TUKANG_RATE) + (numPekerja * PEKERJA_RATE);
      
      // Calculate number of teams based on worker ratio
      const [tukangRatio, pekerjaRatio] = workerRatio.split(':').map(Number);
      
      let numberOfTeams = 0;
      if (tukangRatio === 0 && pekerjaRatio > 0) {
        numberOfTeams = Math.floor(numPekerja / pekerjaRatio);
      } else if (pekerjaRatio === 0 && tukangRatio > 0) {
        numberOfTeams = Math.floor(numTukang / tukangRatio);
      } else if (tukangRatio > 0 && pekerjaRatio > 0) {
        const maxTeamsFromTukang = Math.floor(numTukang / tukangRatio);
        const maxTeamsFromPekerja = Math.floor(numPekerja / pekerjaRatio);
        numberOfTeams = Math.min(maxTeamsFromTukang, maxTeamsFromPekerja);
      }
      
      const adjustedProductivity = numberOfTeams > 0 ? productivity * numberOfTeams : productivity;
      const estimatedDays = adjustedProductivity > 0 ? Math.ceil(area / adjustedProductivity) : 0;
      const totalLaborCost = dailyLaborCost * estimatedDays;

      // Calculate material costs
      let totalMaterialCost = 0;
      const materialDetails = materials.map(material => {
        const baseQuantity = material.quantity * area;
        const quantityWithWaste = baseQuantity * (1 + wasteFactor);
        const materialCost = quantityWithWaste * material.price;
        totalMaterialCost += materialCost;

        return {
          ...material,
          baseQuantity,
          quantityWithWaste,
          materialCost,
          hppBahan: materialCost,
          rabBahan: materialCost * (1 + profitPercentage)
        };
      });

      // Calculate totals
      const hpp = totalLaborCost + totalMaterialCost;
      const rab = hpp * (1 + profitPercentage);
      const keuntungan = rab - hpp;

      const brickType = getCurrentBrickType();
      const mortarRatio = getCurrentMortarRatio();

      const result = {
        area,
        satuan: 'm²',
        brickType: brickType.label,
        mortarRatio: formData.mortar_ratio,
        bahan: materialDetails,
        tukang: {
          count: numTukang,
          rate: TUKANG_RATE,
          days: estimatedDays,
          total: numTukang * TUKANG_RATE * estimatedDays
        },
        pekerja: {
          count: numPekerja,
          rate: PEKERJA_RATE,
          days: estimatedDays,
          total: numPekerja * PEKERJA_RATE * estimatedDays
        },
        hppBahan: totalMaterialCost,
        hppTukang: totalLaborCost,
        hpp,
        rabBahan: totalMaterialCost * (1 + profitPercentage),
        rabTukang: totalLaborCost * (1 + profitPercentage),
        rab,
        keuntungan,
        profitPercentage: parseFloat(formData.profit_percentage),
        wasteFactor: parseFloat(formData.waste_factor),
        projectName: formData.project_name,
        workerRatio: workerRatio,
        coefficients: calculateMaterialCoefficients()
      };

      setCalculation(result);
      
      // Call the completion callback if provided
      if (onCalculationComplete) {
        onCalculationComplete(result);
      }
      
      toast.success('Kalkulasi bata berhasil dihitung!');
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghitung');
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = () => {
    if (!calculation) {
      toast.error('Tidak ada kalkulasi untuk disimpan');
      return;
    }

    // Save to localStorage as fallback
    const savedCalculations = JSON.parse(localStorage.getItem('brick_calculations') || '[]');
    const newCalculation = {
      ...calculation,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      jobType: jobType?.name || 'Kalkulator Bata'
    };
    savedCalculations.unshift(newCalculation);
    localStorage.setItem('brick_calculations', JSON.stringify(savedCalculations.slice(0, 50)));
    toast.success('Kalkulasi bata berhasil disimpan!');
  };

  const handleExportPDF = async () => {
    if (!calculation) {
      toast.error('Tidak ada kalkulasi untuk diekspor');
      return;
    }

    try {
      // Use generic report generator
      const { GenericReportGenerator } = await import('../../utils/genericReportGenerator');
      const reportGenerator = new GenericReportGenerator(calculation, 'brick', jobType);
      const filename = `laporan-bata-${formData.project_name || 'konstruksi'}-${new Date().toISOString().split('T')[0]}.pdf`;
      reportGenerator.save(filename);
      toast.success('Laporan PDF berhasil diunduh!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Gagal mengekspor PDF. Pastikan semua dependensi tersedia.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num, decimals = 2) => {
    return parseFloat(num).toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-6 h-6 text-primary-600 mr-3" />
            Kalkulator Bata
          </h2>
          <p className="text-gray-600 mt-1">
            Hitung biaya pemasangan bata dengan berbagai jenis dan spesi mortar
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Proyek
            </label>
            <input
              type="text"
              name="project_name"
              value={formData.project_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Masukkan nama proyek"
            />
          </div>

          {/* Area Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Luas Dinding (m²) *
            </label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.target.blur();
              }}
              step="0.01"
              min="0.01"
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.area ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan luas dinding dalam m²"
            />
            {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
          </div>

          {/* Brick Type Selection */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Jenis Bata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {brickTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, brick_type: type.value }))}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.brick_type === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatNumber(type.bricksPerM2, 1)} buah/m²
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mortar Ratio Selection (only for bata merah/putih) */}
          {formData.brick_type !== 'bata_ringan' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Perbandingan Spesi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mortarRatios.map((ratio) => (
                  <div
                    key={ratio.value}
                    onClick={() => setFormData(prev => ({ ...prev, mortar_ratio: ratio.value }))}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.mortar_ratio === ratio.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">{ratio.label}</div>
                    <div className="text-xs text-gray-500 mt-1">Kekuatan: {ratio.strength}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productivity and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produktivitas (m²/hari) *
              </label>
              <input
                type="number"
                name="productivity"
                value={formData.productivity}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                step="0.01"
                min="0.01"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.productivity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Produktivitas per hari"
              />
              {errors.productivity && <p className="text-red-500 text-sm mt-1">{errors.productivity}</p>}
              {jobType?.base_productivity && (
                <p className="text-xs text-gray-500 mt-1">
                  Nilai default dari job type: {jobType.name} ({jobType.base_productivity} {jobType.unit}/hari)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keuntungan (%) *
              </label>
              <input
                type="number"
                name="profit_percentage"
                value={formData.profit_percentage}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                step="0.1"
                min="0"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.profit_percentage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="20"
              />
              {errors.profit_percentage && <p className="text-red-500 text-sm mt-1">{errors.profit_percentage}</p>}
              <p className="text-xs text-gray-500 mt-1">Minimal 0%, default 20%</p>
            </div>
          </div>

          {/* Waste Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faktor Pemborosan (%) *
            </label>
            <input
              type="number"
              name="waste_factor"
              value={formData.waste_factor}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.target.blur();
              }}
              step="0.1"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.waste_factor ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="5"
            />
            {errors.waste_factor && <p className="text-red-500 text-sm mt-1">{errors.waste_factor}</p>}
            <p className="text-xs text-gray-500 mt-1">Minimal 0%, default 5%</p>
          </div>

          {/* Workers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rasio Pekerja (Tukang:Pekerja) *
              </label>
              <select
                name="worker_ratio"
                value={formData.worker_ratio}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.worker_ratio ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="1:0">1:0 (1 Tukang : 0 Pekerja)</option>
                <option value="0:1">0:1 (0 Tukang : 1 Pekerja)</option>
                <option value="1:1">1:1 (1 Tukang : 1 Pekerja)</option>
                <option value="1:2">1:2 (1 Tukang : 2 Pekerja)</option>
                <option value="2:1">2:1 (2 Tukang : 1 Pekerja)</option>
                <option value="1:3">1:3 (1 Tukang : 3 Pekerja)</option>
                <option value="3:1">3:1 (3 Tukang : 1 Pekerja)</option>
                <option value="2:3">2:3 (2 Tukang : 3 Pekerja)</option>
                <option value="3:2">3:2 (3 Tukang : 2 Pekerja)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Rasio dasar untuk menghitung efektivitas pekerja</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Tukang *
              </label>
              <input
                type="number"
                name="num_tukang"
                value={formData.num_tukang}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                min="0"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.workers ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Harga: {formatCurrency(TUKANG_RATE)}/hari</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Pekerja *
              </label>
              <input
                type="number"
                name="num_pekerja"
                value={formData.num_pekerja}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                min="0"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.workers ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Harga: {formatCurrency(PEKERJA_RATE)}/hari</p>
            </div>
          </div>
          {errors.workers && <p className="text-red-500 text-sm">{errors.workers}</p>}

          {/* Materials Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material dari Database
            </label>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
              <div className="flex items-center text-green-800">
                <Info className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Material Database Aktif</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Material diambil dari database dan disesuaikan berdasarkan jenis bata yang dipilih.
              </p>
            </div>
            
            {/* Selected Materials */}
            {materials.length > 0 && (
              <div className="space-y-2 mb-4">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{material.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(material.price)}/{material.unit}
                        {material.supplier && ` • ${material.supplier}`}
                      </p>
                      {material.isPlaceholder && (
                        <p className="text-xs text-orange-600">
                          ⚠️ Material tidak ditemukan di database. Menggunakan harga default.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => updateMaterialQuantity(material.id, e.target.value)}
                        onFocus={handleInputFocus}
                        onWheel={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.target.blur();
                        }}
                        step="0.01"
                        min="0"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Qty"
                      />
                      <span className="text-sm text-gray-600">{material.unit}/m²</span>
                      <button
                        type="button"
                        onClick={() => removeMaterial(material.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Material Button */}
            <button
              type="button"
              onClick={openMaterialSelector}
              disabled={isLoadingMaterials}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">
                {isLoadingMaterials ? 'Memuat Material...' : 'Tambah Material dari Database'}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={calculateCosts}
              disabled={isCalculating}
              className={`flex-1 btn-primary flex items-center justify-center space-x-2 ${
                isCalculating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Calculator className="w-5 h-5" />
              <span>{isCalculating ? 'Menghitung...' : 'Hitung'}</span>
            </button>

            {calculation && (
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 btn-secondary flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Simpan</span>
              </button>
            )}
          </div>

          {calculation && (
            <button
              type="button"
              onClick={handleExportPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors mt-3"
            >
              <Download className="w-5 h-5" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      {calculation && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              Hasil Kalkulasi Bata
            </h3>
            {calculation.projectName && (
              <p className="text-gray-600 mt-2">Proyek: {calculation.projectName}</p>
            )}
            <div className="mt-2 text-sm text-gray-600">
              <p>Jenis Bata: {calculation.brickType}</p>
              {calculation.mortarRatio && (
                <p>Spesi: {calculation.mortarRatio}</p>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 table-fixed">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Luas</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Satuan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-32">Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Tukang</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      {formatNumber(calculation.area)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      {calculation.satuan}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-xs w-32">
                      {calculation.bahan.length > 0 ? (
                        <div className="space-y-1">
                          {calculation.bahan.map((material, index) => (
                            <div key={index} className="text-xs">
                              <div className="font-medium truncate" title={material.name}>{material.name}</div>
                              <div className="text-gray-600">
                                {formatNumber(material.quantityWithWaste)} {material.unit}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">-</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-xs w-24 align-top">
                      <div className="space-y-1">
                        <div>Tukang: {calculation.tukang.count}</div>
                        <div>Pekerja: {calculation.pekerja.count}</div>
                        <div>Rasio: {calculation.workerRatio}</div>
                        <div className="text-gray-600">
                          Hari: {Math.round(calculation.tukang.days)} hari
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-700 bg-blue-50 text-xs w-24">
                      {formatCurrency(calculation.hpp)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-green-700 bg-green-50 text-xs w-24">
                      {formatCurrency(calculation.rab)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-orange-700 bg-orange-50 text-xs w-24">
                      {formatCurrency(calculation.keuntungan)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analisis Harga per Satuan Luas */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Analisis Harga per Satuan Luas</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">Luas</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">Satuan</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">HPP Bahan per Satuan</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">RAB Bahan per Satuan</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">HPP Tukang per Satuan</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">RAB Tukang per Satuan</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">HPP per Satuan</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">RAB per Satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                        {formatNumber(calculation.area)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                        {calculation.satuan}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-blue-600">
                        {formatCurrency(calculation.area > 0 ? calculation.hppBahan / calculation.area : 0)}/{calculation.satuan}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-blue-700">
                        {formatCurrency(calculation.area > 0 ? calculation.rabBahan / calculation.area : 0)}/{calculation.satuan}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-green-600">
                        {formatCurrency(calculation.area > 0 ? calculation.hppTukang / calculation.area : 0)}/{calculation.satuan}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-green-700">
                        {formatCurrency(calculation.area > 0 ? calculation.rabTukang / calculation.area : 0)}/{calculation.satuan}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-purple-700">
                        {formatCurrency(calculation.area > 0 ? calculation.hpp / calculation.area : 0)}/{calculation.satuan}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-teal-700">
                        {formatCurrency(calculation.area > 0 ? calculation.rab / calculation.area : 0)}/{calculation.satuan}
                      </td>
                    </tr>
                    {/* Total Row */}
                    <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                        -
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-blue-700 bg-blue-100">
                        {formatCurrency(calculation.hppBahan)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-blue-800 bg-blue-200">
                        {formatCurrency(calculation.rabBahan)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-green-700 bg-green-100">
                        {formatCurrency(calculation.hppTukang)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-green-800 bg-green-200">
                        {formatCurrency(calculation.rabTukang)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-purple-800 bg-purple-200">
                        {formatCurrency(calculation.hpp)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-teal-800 bg-teal-200">
                        {formatCurrency(calculation.rab)}
                      </td>
                    </tr>
                    {/* Total Keseluruhan Row */}
                    <tr className="bg-orange-50 border-t-2 border-orange-400">
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-gray-900">
                        TOTAL KESELURUHAN
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                        -
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-blue-700 bg-blue-100">
                        {formatCurrency(calculation.hppBahan)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-blue-800 bg-blue-200">
                        {formatCurrency(calculation.rabBahan)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-green-700 bg-green-100">
                        {formatCurrency(calculation.hppTukang)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-green-800 bg-green-200">
                        {formatCurrency(calculation.rabTukang)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-purple-800 bg-purple-200">
                        {formatCurrency(calculation.hpp)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-teal-800 bg-teal-200">
                        {formatCurrency(calculation.rab)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail Information */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Labor Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Detail Tenaga Kerja</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Upah Tukang/hari:</span>
                    <span className="font-medium">{formatCurrency(TUKANG_RATE)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upah Pekerja/hari:</span>
                    <span className="font-medium">{formatCurrency(PEKERJA_RATE)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rasio Pekerja:</span>
                    <span className="font-medium">{calculation.workerRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Upah/hari:</span>
                    <span className="font-medium">{formatCurrency((calculation.tukang.count * TUKANG_RATE) + (calculation.pekerja.count * PEKERJA_RATE))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimasi Hari Kerja:</span>
                    <span className="font-medium">{formatNumber(calculation.tukang.days, 1)} hari</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Biaya Tenaga Kerja:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(calculation.hppTukang)}</span>
                  </div>
                </div>
              </div>

              {/* Material Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Detail Material</h4>
                {calculation.bahan.length > 0 ? (
                  <div className="space-y-3">
                    {calculation.bahan.map((material, index) => (
                      <div key={index} className="text-sm border-b border-gray-200 pb-2 last:border-b-0">
                        <div className="font-medium">{material.name}</div>
                        <div className="text-gray-600 space-y-1">
                          <div>Kebutuhan: {formatNumber(material.baseQuantity)} {material.unit}</div>
                          <div>+ Pemborosan ({calculation.wasteFactor}%): {formatNumber(material.quantityWithWaste)} {material.unit}</div>
                          <div>Harga: {formatCurrency(material.price)}/{material.unit}</div>
                          <div className="font-medium text-blue-600">Total: {formatCurrency(material.materialCost)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total Biaya Material:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(calculation.hppBahan)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Tidak ada material yang dipilih</p>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Total HPP</h4>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.hpp)}</p>
                <p className="text-sm text-blue-700 mt-1">Harga Pokok Produksi</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Total RAB</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculation.rab)}</p>
                <p className="text-sm text-green-700 mt-1">Rencana Anggaran Biaya</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Keuntungan ({calculation.profitPercentage}%)</h4>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculation.keuntungan)}</p>
                <p className="text-sm text-orange-700 mt-1">Margin Keuntungan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Selector Modal */}
      {showMaterialSelector && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMaterialSelector(false);
              setMaterialSearch('');
            }
          }}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pilih Material</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Pilih material dari database untuk ditambahkan ke kalkulasi
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMaterialSelector(false);
                    setMaterialSearch('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari material..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {isLoadingMaterials ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Memuat material...</p>
                </div>
              ) : materialsError ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-red-300 mx-auto mb-4" />
                  <p className="text-red-500 mb-2">Gagal memuat material</p>
                  <p className="text-sm text-gray-500">Periksa koneksi internet Anda</p>
                </div>
              ) : (() => {
                const filteredMaterials = availableMaterials.filter(material => {
                  const matchesSearch = material.name.toLowerCase().includes(materialSearch.toLowerCase());
                  const notAlreadySelected = !materials.some(m => m.id === material.id);
                  return matchesSearch && notAlreadySelected;
                });

                return filteredMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {filteredMaterials.map((material) => {
                      const isSelected = selectedMaterials.some(m => m.id === material.id);
                      return (
                        <div
                          key={material.id}
                          onClick={() => toggleMaterialSelection(material)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary-500 bg-primary-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{material.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(material.price)}/{material.unit}
                                {material.supplier && ` • ${material.supplier}`}
                              </p>
                              {material.description && (
                                <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                              )}
                            </div>
                            <div className="flex items-center">
                              {isSelected ? (
                                <CheckCircle className="w-5 h-5 text-primary-600" />
                              ) : (
                                <Plus className="w-5 h-5 text-primary-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {materialSearch ? 'Tidak ada material yang ditemukan' : 
                       availableMaterials.length === 0 ? 'Belum ada material tersedia' :
                       'Mulai mengetik untuk mencari material'}
                    </p>
                    {availableMaterials.length === 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Hubungi administrator untuk menambahkan material
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Add Selected Materials Button */}
            {selectedMaterials.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={addSelectedMaterials}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah {selectedMaterials.length} Material Terpilih</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrickCalculator;
