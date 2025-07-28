import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Package,
  Save,
  Plus,
  X,
  Search,
  CheckCircle,
  Box,
  Cylinder,
  Globe,
  Cone,
  Pyramid,
  Cuboid,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const VolumeCalculator = ({ jobType, onSave }) => {
  const [formData, setFormData] = useState({
    volume: '',
    productivity: '',
    profit_percentage: '20',
    waste_factor: '5',
    num_tukang: '0',
    num_pekerja: '0',
    worker_ratio_display: '1:1',
    project_name: ''
  });

  // Shape selection state
  const [selectedShape, setSelectedShape] = useState('cube');
  const [useManualVolume, setUseManualVolume] = useState(false);
  
  // Dimension states for different shapes
  const [dimensions, setDimensions] = useState({
    // Cube/Rectangular Prism
    length: '',
    width: '',
    height: '',
    // Cylinder
    radius: '',
    cylinderHeight: '',
    // Sphere
    sphereRadius: '',
    // Cone
    coneRadius: '',
    coneHeight: '',
    // Pyramid
    baseLength: '',
    baseWidth: '',
    pyramidHeight: '',
    // Trapezoid Prism
    topLength: '',
    bottomLength: '',
    trapezoidWidth: '',
    trapezoidHeight: ''
  });

  const [materials, setMaterials] = useState([]);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Fixed rates as specified
  const TUKANG_RATE = 150000;
  const PEKERJA_RATE = 135000;
  
  // Available shapes for volume calculation
  const shapes = [
    {
      id: 'cube',
      name: 'Kubus/Balok',
      formula: 'panjang × lebar × tinggi',
      icon: Box
    },
    {
      id: 'cylinder',
      name: 'Silinder',
      formula: 'π × r² × tinggi',
      icon: Cylinder
    },
    {
      id: 'sphere',
      name: 'Bola',
      formula: '4/3 × π × r³',
      icon: Globe
    },
    {
      id: 'cone',
      name: 'Kerucut',
      formula: '1/3 × π × r² × tinggi',
      icon: Cone
    },
    {
      id: 'pyramid',
      name: 'Limas',
      formula: '1/3 × alas × tinggi',
      icon: Pyramid
    },
    {
      id: 'trapezoid',
      name: 'Prisma Trapesium',
      formula: '½ × (a + b) × lebar × tinggi',
      icon: Cuboid
    }
  ];

  // Load available materials (mock data for now)
  useEffect(() => {
    // This would normally fetch from API
    setAvailableMaterials([
      { id: 1, name: 'Semen Portland', unit: 'sak', price: 65000, supplier: 'Toko Bangunan A' },
      { id: 2, name: 'Pasir Halus', unit: 'm3', price: 350000, supplier: 'Supplier Pasir B' },
      { id: 3, name: 'Kerikil', unit: 'm3', price: 400000, supplier: 'Supplier Batu C' },
      { id: 4, name: 'Besi Beton 10mm', unit: 'batang', price: 85000, supplier: 'Toko Besi D' },
      { id: 5, name: 'Kawat Bendrat', unit: 'kg', price: 25000, supplier: 'Toko Bangunan A' }
    ]);
  }, []);

  // Set productivity from jobType when component mounts or jobType changes
  useEffect(() => {
    if (jobType && jobType.base_productivity) {
      setFormData(prev => ({
        ...prev,
        productivity: jobType.base_productivity.toString()
      }));
    }
  }, [jobType]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showMaterialSelector) {
      // Save current body overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showMaterialSelector]);
  
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

  // Calculate volume based on selected shape and dimensions
  const calculateVolume = useCallback(() => {
    if (useManualVolume) {
      return parseFloat(formData.volume) || 0;
    }
    
    const {
      length, width, height,
      radius, cylinderHeight,
      sphereRadius,
      coneRadius, coneHeight,
      baseLength, baseWidth, pyramidHeight,
      topLength, bottomLength, trapezoidWidth, trapezoidHeight
    } = dimensions;
    
    switch (selectedShape) {
      case 'cube':
        return (parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0);
      
      case 'cylinder':
        return Math.PI * Math.pow(parseFloat(radius) || 0, 2) * (parseFloat(cylinderHeight) || 0);
      
      case 'sphere':
        return (4/3) * Math.PI * Math.pow(parseFloat(sphereRadius) || 0, 3);
      
      case 'cone':
        return (1/3) * Math.PI * Math.pow(parseFloat(coneRadius) || 0, 2) * (parseFloat(coneHeight) || 0);
      
      case 'pyramid':
        const baseArea = (parseFloat(baseLength) || 0) * (parseFloat(baseWidth) || 0);
        return (1/3) * baseArea * (parseFloat(pyramidHeight) || 0);
      
      case 'trapezoid':
        const trapezoidArea = 0.5 * ((parseFloat(topLength) || 0) + (parseFloat(bottomLength) || 0)) * (parseFloat(trapezoidWidth) || 0);
        return trapezoidArea * (parseFloat(trapezoidHeight) || 0);
      
      default:
        return 0;
    }
  }, [useManualVolume, formData.volume, dimensions, selectedShape]);
  
  // Update calculated volume when dimensions change
  useEffect(() => {
    const volume = calculateVolume();
    setFormData(prev => ({ ...prev, volume: volume.toString() }));
  }, [dimensions, selectedShape, useManualVolume, calculateVolume]);
  
  // Handle dimension input changes
  const handleDimensionChange = (field, value) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMaterial = (material) => {
    const isAlreadyAdded = materials.some(m => m.id === material.id);
    if (!isAlreadyAdded) {
      setMaterials(prev => [...prev, { ...material, quantity: 1 }]);
    }
    setShowMaterialSelector(false);
    setMaterialSearch('');
  };

  const removeMaterial = (materialId) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const updateMaterialQuantity = (materialId, quantity) => {
    setMaterials(prev => prev.map(m => 
      m.id === materialId ? { ...m, quantity: parseFloat(quantity) || 0 } : m
    ));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.volume || parseFloat(formData.volume) <= 0) {
      newErrors.volume = 'Volume harus diisi dan lebih dari 0';
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

    // Validate worker ratio display
    if (!formData.worker_ratio_display) {
      newErrors.worker_ratio_display = 'Rasio pekerja harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCosts = () => {
    if (!validateForm()) return;

    setIsCalculating(true);

    try {
      const volume = parseFloat(formData.volume) || 0;
      const productivity = parseFloat(formData.productivity) || 0;
      const profitPercentage = (parseFloat(formData.profit_percentage) || 0) / 100;
      const wasteFactor = (parseFloat(formData.waste_factor) || 0) / 100;
      const numTukang = parseInt(formData.num_tukang) || 0;
      const numPekerja = parseInt(formData.num_pekerja) || 0;
      const workerRatio = formData.worker_ratio_display || '1:1';

      // Calculate labor costs with worker ratio - productivity affected by number of teams
      const dailyLaborCost = (numTukang * TUKANG_RATE) + (numPekerja * PEKERJA_RATE);
      
      // Calculate number of teams based on worker ratio
      const [tukangRatio, pekerjaRatio] = workerRatio.split(':').map(Number);
      
      let numberOfTeams = 0;
      if (tukangRatio === 0 && pekerjaRatio > 0) {
        // Special case: only pekerja working (0:X ratio)
        numberOfTeams = Math.floor(numPekerja / pekerjaRatio);
      } else if (pekerjaRatio === 0 && tukangRatio > 0) {
        // Special case: only tukang working (X:0 ratio)
        numberOfTeams = Math.floor(numTukang / tukangRatio);
      } else if (tukangRatio > 0 && pekerjaRatio > 0) {
        // Normal case: both tukang and pekerja working
        const maxTeamsFromTukang = Math.floor(numTukang / tukangRatio);
        const maxTeamsFromPekerja = Math.floor(numPekerja / pekerjaRatio);
        numberOfTeams = Math.min(maxTeamsFromTukang, maxTeamsFromPekerja);
      }
      
      // Ensure we have at least some productivity even with 0 teams
      const adjustedProductivity = numberOfTeams > 0 ? productivity * numberOfTeams : productivity;
      const estimatedDays = adjustedProductivity > 0 ? volume / adjustedProductivity : 0;
      const totalLaborCost = dailyLaborCost * estimatedDays;

      // Calculate material costs
      let totalMaterialCost = 0;
      const materialDetails = materials.map(material => {
        const baseQuantity = material.quantity * volume;
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

      const result = {
        volume,
        satuan: jobType?.unit || 'm³',
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
        shape: selectedShape,
        dimensions: useManualVolume ? { manual: formData.volume } : dimensions
      };

      setCalculation(result);
      toast.success('Kalkulasi berhasil dihitung!');
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

    if (onSave) {
      onSave(calculation);
    } else {
      // Save to localStorage as fallback
      const savedCalculations = JSON.parse(localStorage.getItem('volume_calculations') || '[]');
      const newCalculation = {
        ...calculation,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        jobType: jobType?.name || 'Pekerjaan Volume'
      };
      savedCalculations.unshift(newCalculation);
      localStorage.setItem('volume_calculations', JSON.stringify(savedCalculations.slice(0, 50)));
      toast.success('Kalkulasi berhasil disimpan!');
    }
  };

  const handleExportPDF = async () => {
    if (!calculation) {
      toast.error('Tidak ada kalkulasi untuk diekspor');
      return;
    }

    try {
      // Dynamic import to avoid bundle size issues
      const { GenericReportGenerator } = await import('../../utils/genericReportGenerator');
      
      const reportGenerator = new GenericReportGenerator(calculation, 'volume', jobType);
      const pdfDoc = reportGenerator.generateReport();
      
      const filename = `laporan-volume-${formData.project_name || 'konstruksi'}-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const filteredMaterials = availableMaterials.filter(material =>
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    !materials.some(m => m.id === material.id)
  );
  
  // Render dimension inputs based on selected shape
  const renderDimensionInputs = () => {
    switch (selectedShape) {
      case 'cube':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Panjang (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan panjang"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lebar (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan lebar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggi (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan tinggi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        );
      
      case 'cylinder':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.radius}
                onChange={(e) => handleDimensionChange('radius', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan radius"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggi (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.cylinderHeight}
                onChange={(e) => handleDimensionChange('cylinderHeight', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan tinggi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        );
      
      case 'sphere':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius (m) *
            </label>
            <input
              type="number"
              step="0.01"
              value={dimensions.sphereRadius}
              onChange={(e) => handleDimensionChange('sphereRadius', e.target.value)}
              onFocus={handleInputFocus}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.target.blur();
              }}
              placeholder="Masukkan radius"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        );
      
      case 'cone':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.coneRadius}
                onChange={(e) => handleDimensionChange('coneRadius', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan radius"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggi (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.coneHeight}
                onChange={(e) => handleDimensionChange('coneHeight', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan tinggi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        );
      
      case 'pyramid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Panjang Alas (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.baseLength}
                onChange={(e) => handleDimensionChange('baseLength', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan panjang alas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lebar Alas (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.baseWidth}
                onChange={(e) => handleDimensionChange('baseWidth', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan lebar alas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggi (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.pyramidHeight}
                onChange={(e) => handleDimensionChange('pyramidHeight', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Masukkan tinggi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        );

      case 'trapezoid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sisi Atas (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.topLength}
                onChange={(e) => handleDimensionChange('topLength', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Panjang sisi atas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sisi Bawah (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.bottomLength}
                onChange={(e) => handleDimensionChange('bottomLength', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Panjang sisi bawah"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lebar (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.trapezoidWidth}
                onChange={(e) => handleDimensionChange('trapezoidWidth', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Lebar trapesium"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggi (m) *
              </label>
              <input
                type="number"
                step="0.01"
                value={dimensions.trapezoidHeight}
                onChange={(e) => handleDimensionChange('trapezoidHeight', e.target.value)}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.target.blur();
                }}
                placeholder="Tinggi prisma"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-6 h-6 text-primary-600 mr-3" />
            Kalkulator Volume
          </h2>
          <p className="text-gray-600 mt-1">
            Hitung biaya pekerjaan berdasarkan volume dengan berbagai bentuk geometri
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

          {/* Shape Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Bentuk *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {shapes.map((shape) => {
                const IconComponent = shape.icon;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => setSelectedShape(shape.id)}
                    className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                      selectedShape === shape.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs font-medium">{shape.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{shape.formula}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Volume Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={useManualVolume}
                onChange={(e) => setUseManualVolume(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Input volume manual
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Centang jika ingin memasukkan volume secara manual tanpa menghitung dari dimensi
            </p>
          </div>

          {/* Volume Input or Dimensions */}
          {useManualVolume ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (m³) *
              </label>
              <input
                type="number"
                name="volume"
                value={formData.volume}
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
                  errors.volume ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan volume dalam m³"
              />
              {errors.volume && <p className="text-red-500 text-sm mt-1">{errors.volume}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensi {shapes.find(s => s.id === selectedShape)?.name}
              </label>
              {renderDimensionInputs()}
            </div>
          )}

          {/* Volume and Productivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (m³) *
              </label>
              <input
                type="number"
                name="volume"
                value={formData.volume}
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
                  errors.volume ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan volume dalam m³"
              />
              {errors.volume && <p className="text-red-500 text-sm mt-1">{errors.volume}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produktivitas (m³/hari) *
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
                placeholder={jobType?.base_productivity ? `Default: ${jobType.base_productivity}` : "Produktivitas per hari"}
              />
              {errors.productivity && <p className="text-red-500 text-sm mt-1">{errors.productivity}</p>}
              {jobType?.base_productivity && (
                <p className="text-xs text-gray-500 mt-1">
                  Nilai default dari job type: {jobType.name} ({jobType.base_productivity} {jobType.unit}/hari)
                </p>
              )}
            </div>
          </div>

          {/* Profit and Waste Factor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Workers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rasio Pekerja (Tukang:Pekerja) *
              </label>
              <select
                name="worker_ratio_display"
                value={formData.worker_ratio_display}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.worker_ratio_display ? 'border-red-500' : 'border-gray-300'
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
          {errors.worker_ratio_display && <p className="text-red-500 text-sm">{errors.worker_ratio_display}</p>}

          {/* Materials Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Material (Opsional)
            </label>
            
            {/* Selected Materials */}
            {materials.length > 0 && (
              <div className="mb-4 space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{material.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(material.price)}/{material.unit}
                        {material.supplier && ` • ${material.supplier}`}
                      </p>
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
                      <span className="text-sm text-gray-600">{material.unit}/m³</span>
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
              onClick={() => setShowMaterialSelector(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-gray-600 hover:text-primary-600"
            >
              <Plus className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Tambah Material</span>
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
              Hasil Kalkulasi
            </h3>
            {calculation.projectName && (
              <p className="text-gray-600 mt-2">Proyek: {calculation.projectName}</p>
            )}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 table-fixed">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Volume</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Satuan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-32">Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Tukang</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP Tukang</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB Tukang</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      {formatNumber(calculation.volume)}
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
                    <td className="border border-gray-300 px-1 py-2 text-center font-medium text-blue-600 text-xs w-24">
                      {formatCurrency(calculation.hppBahan)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-medium text-blue-600 text-xs w-24">
                      {formatCurrency(calculation.hppTukang)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-medium text-green-600 text-xs w-24">
                      {formatCurrency(calculation.rabBahan)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-medium text-green-600 text-xs w-24">
                      {formatCurrency(calculation.rabTukang)}
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
          onClick={() => {
            setShowMaterialSelector(false);
            setMaterialSearch('');
          }}
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
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pilih Material</h3>
                <button
                  onClick={() => {
                    setShowMaterialSelector(false);
                    setMaterialSearch('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
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
              {filteredMaterials.length > 0 ? (
                <div className="space-y-2">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => addMaterial(material)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{material.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(material.price)}/{material.unit}
                            {material.supplier && ` • ${material.supplier}`}
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {materialSearch ? 'Tidak ada material yang ditemukan' : 'Mulai mengetik untuk mencari material'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeCalculator;
