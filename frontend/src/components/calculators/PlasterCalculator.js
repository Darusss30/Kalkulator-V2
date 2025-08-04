import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Package,
  Save,
  Plus,
  X,
  Search,
  CheckCircle,
  Download,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import apiService from '../../services/api';

const PlasterCalculator = ({ jobType, onSave }) => {
  const [formData, setFormData] = useState({
    area: '',
    productivity: '',
    profit_percentage: '20',
    waste_factor: '5',
    num_tukang: '1',
    num_pekerja: '1',
    worker_ratio_display: '1:1',
    project_name: ''
  });

  // Separate materials for each layer
  const [lapis1Materials, setLapis1Materials] = useState([]);
  const [lapis2Materials, setLapis2Materials] = useState([]);
  const [lapis3Materials, setLapis3Materials] = useState([]);
  
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [currentMaterialType, setCurrentMaterialType] = useState(''); // 'lapis1', 'lapis2', 'lapis3'
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Fixed rates as specified
  const TUKANG_RATE = 150000;
  const PEKERJA_RATE = 135000;
  
  // Default prices for placeholder materials (in IDR)
  const getDefaultPrice = (materialName, unit) => {
    const name = materialName.toLowerCase();
    
    if (name.includes('adamix')) {
      return unit === 'sak' ? 95000 : 95000; // Rp 95,000 per sak
    }
    
    if (name.includes('giant')) {
      return unit === 'sak' ? 80000 : 80000; // Rp 80,000 per sak
    }
    
    if (name.includes('lem rajawali')) {
      return unit === 'BOX' ? 1010000 : 16833; // Rp 1,010,000 per BOX (60 pcs) or Rp 16,833 per pcs
    }
    
    // Default fallback price
    return 50000;
  };
  
  // Plaster layer specifications
  const plasterLayers = {
    lapis1: {
      name: 'Lapis 1',
      description: 'Lapis dasar plamiran',
      baseArea: 30, // m²
      materials: [
        { name: 'Adamix', quantity: 1, unit: 'sak' },
        { name: 'Giant', quantity: 2, unit: 'sak' },
        { name: 'Lem rajawali', quantity: 5/60, unit: 'BOX' } // 5 pcs = 5/60 BOX
      ]
    },
    lapis2: {
      name: 'Lapis 2',
      description: 'Lapis tengah plamiran',
      baseArea: 30, // m²
      materials: [
        { name: 'Adamix', quantity: 1, unit: 'sak' },
        { name: 'Giant', quantity: 3, unit: 'sak' },
        { name: 'Lem rajawali', quantity: 4/60, unit: 'BOX' } // 4 pcs = 4/60 BOX
      ]
    },
    lapis3: {
      name: 'Lapis 3',
      description: 'Lapis finishing plamiran',
      baseArea: 25, // m²
      materials: [
        { name: 'Giant', quantity: 2, unit: 'sak' },
        { name: 'Lem rajawali', quantity: 5/60, unit: 'BOX' } // 5 pcs = 5/60 BOX
      ]
    }
  };

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
        toast.error('Gagal memuat data material');
        setAvailableMaterials([]);
      }
    }
  );

  // Set productivity from jobType when component mounts or jobType changes
  useEffect(() => {
    if (jobType && jobType.base_productivity) {
      setFormData(prev => ({
        ...prev,
        productivity: jobType.base_productivity.toString()
      }));
    }
  }, [jobType]);

  // Auto-load plaster materials for each layer separately
  useEffect(() => {
    if (availableMaterials.length > 0) {
      // Auto-distribute materials to appropriate layers based on specifications
      const lapis1Mats = [];
      const lapis2Mats = [];
      const lapis3Mats = [];
      
      // Process each layer
      Object.entries(plasterLayers).forEach(([layerId, layerData]) => {
        layerData.materials.forEach(layerMaterial => {
          // Find matching material from database with flexible matching logic
          const dbMaterial = availableMaterials.find(material => {
            const materialNameLower = material.name.toLowerCase();
            const layerMaterialNameLower = layerMaterial.name.toLowerCase();
            
            // Specific matching for plaster materials based on actual database content
            if (layerMaterialNameLower.includes('lem rajawali')) {
              // Prioritas utama: cari "LEM RAJAWALI ISI 60 PCS" secara spesifik
              const exactMatch = materialNameLower === 'lem rajawali isi 60 pcs';
              const containsMatch = materialNameLower.includes('lem rajawali isi 60 pcs');
              const generalMatch = (materialNameLower.includes('lem') && materialNameLower.includes('rajawali')) ||
                                  materialNameLower.includes('rajawali');
              return exactMatch || containsMatch || generalMatch;
            }
            
            if (layerMaterialNameLower === 'giant') {
              return materialNameLower.includes('giant') ||
                     (materialNameLower.includes('semen') && 
                     (materialNameLower.includes('putih') || materialNameLower.includes('instan')));
            }
            
            if (layerMaterialNameLower === 'adamix') {
              return materialNameLower.includes('adamix') ||
                     (materialNameLower.includes('semen') && materialNameLower.includes('instan')) ||
                     materialNameLower.includes('plester');
            }
            
            // General matching
            return materialNameLower.includes(layerMaterialNameLower) ||
                   layerMaterialNameLower.includes(materialNameLower);
          });
          
          // Ensure price is always set correctly
          const finalPrice = dbMaterial ? 
            (dbMaterial.price && dbMaterial.price > 0 ? dbMaterial.price : getDefaultPrice(dbMaterial.name, dbMaterial.unit)) :
            getDefaultPrice(layerMaterial.name, layerMaterial.unit);
          
          const materialWithQuantity = dbMaterial ? {
            ...dbMaterial,
            price: finalPrice, // Always use a valid price
            quantity: layerMaterial.quantity / layerData.baseArea // quantity per m²
          } : {
            id: `placeholder_${layerMaterial.name.toLowerCase().replace(/\s+/g, '_')}_${layerId}`,
            name: layerMaterial.name,
            unit: layerMaterial.unit,
            price: finalPrice, // Always use a valid price
            quantity: layerMaterial.quantity / layerData.baseArea,
            isPlaceholder: true
          };
          
          // Distribute to appropriate layer
          if (layerId === 'lapis1') {
            lapis1Mats.push(materialWithQuantity);
          } else if (layerId === 'lapis2') {
            lapis2Mats.push(materialWithQuantity);
          } else if (layerId === 'lapis3') {
            lapis3Mats.push(materialWithQuantity);
          }
        });
      });
      
      setLapis1Materials(lapis1Mats);
      setLapis2Materials(lapis2Mats);
      setLapis3Materials(lapis3Mats);
      
      const totalMaterials = lapis1Mats.length + lapis2Mats.length + lapis3Mats.length;
      const foundMaterials = [...lapis1Mats, ...lapis2Mats, ...lapis3Mats].filter(m => !m.isPlaceholder).length;
      const placeholderMaterials = totalMaterials - foundMaterials;
      
      if (totalMaterials > 0) {
        if (foundMaterials > 0) {
          toast.success(`${foundMaterials} material ditemukan di database, ${placeholderMaterials} material placeholder dibuat`);
        } else {
          toast(`${totalMaterials} material placeholder dibuat. Pastikan database memiliki material yang diperlukan.`, {
            icon: '⚠️',
            duration: 4000,
          });
        }
        
      }
    }
  }, [availableMaterials]);

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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInputFocus = (e) => {
    e.target.select();
  };

  const getCurrentMaterials = () => {
    switch (currentMaterialType) {
      case 'lapis1': return lapis1Materials;
      case 'lapis2': return lapis2Materials;
      case 'lapis3': return lapis3Materials;
      default: return [];
    }
  };

  const setCurrentMaterials = (materials) => {
    switch (currentMaterialType) {
      case 'lapis1': setLapis1Materials(materials); break;
      case 'lapis2': setLapis2Materials(materials); break;
      case 'lapis3': setLapis3Materials(materials); break;
    }
  };

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
    const currentMats = getCurrentMaterials();
    const newMaterials = selectedMaterials.filter(material => 
      !currentMats.some(m => m.id === material.id)
    ).map(material => ({
      ...material,
      quantity: material.quantity_per_unit || 1
    }));
    
    setCurrentMaterials([...currentMats, ...newMaterials]);
    setSelectedMaterials([]);
    setShowMaterialSelector(false);
    setMaterialSearch('');
    setCurrentMaterialType('');
    
    if (newMaterials.length > 0) {
      const typeNames = { lapis1: 'Lapis 1', lapis2: 'Lapis 2', lapis3: 'Lapis 3' };
      toast.success(`${newMaterials.length} material ${typeNames[currentMaterialType]} berhasil ditambahkan`);
    }
  };

  const removeMaterial = (materialId, type) => {
    switch (type) {
      case 'lapis1':
        setLapis1Materials(prev => prev.filter(m => m.id !== materialId));
        break;
      case 'lapis2':
        setLapis2Materials(prev => prev.filter(m => m.id !== materialId));
        break;
      case 'lapis3':
        setLapis3Materials(prev => prev.filter(m => m.id !== materialId));
        break;
    }
  };

  const updateMaterialQuantity = (materialId, quantity, type) => {
    switch (type) {
      case 'lapis1':
        setLapis1Materials(prev => prev.map(m => 
          m.id === materialId ? { ...m, quantity: parseFloat(quantity) || 0 } : m
        ));
        break;
      case 'lapis2':
        setLapis2Materials(prev => prev.map(m => 
          m.id === materialId ? { ...m, quantity: parseFloat(quantity) || 0 } : m
        ));
        break;
      case 'lapis3':
        setLapis3Materials(prev => prev.map(m => 
          m.id === materialId ? { ...m, quantity: parseFloat(quantity) || 0 } : m
        ));
        break;
    }
  };

  const openMaterialSelector = (type) => {
    setCurrentMaterialType(type);
    setShowMaterialSelector(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.area || parseFloat(formData.area) <= 0) {
      newErrors.area = 'Luas harus diisi dan lebih dari 0';
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
      const area = parseFloat(formData.area) || 0;
      const productivity = parseFloat(formData.productivity) || 0;
      const profitPercentage = (parseFloat(formData.profit_percentage) || 0) / 100;
      const wasteFactor = (parseFloat(formData.waste_factor) || 0) / 100;
      const numTukang = parseInt(formData.num_tukang) || 0;
      const numPekerja = parseInt(formData.num_pekerja) || 0;
      const workerRatio = formData.worker_ratio_display || '1:1';

      // Helper function to calculate teams
      const calculateTeams = (tukangCount, pekerjaCount, ratio) => {
        const [tukangRatio, pekerjaRatio] = ratio.split(':').map(Number);
        
        let numberOfTeams = 0;
        if (tukangRatio === 0 && pekerjaRatio > 0) {
          numberOfTeams = Math.floor(pekerjaCount / pekerjaRatio);
        } else if (pekerjaRatio === 0 && tukangRatio > 0) {
          numberOfTeams = Math.floor(tukangCount / tukangRatio);
        } else if (tukangRatio > 0 && pekerjaRatio > 0) {
          const maxTeamsFromTukang = Math.floor(tukangCount / tukangRatio);
          const maxTeamsFromPekerja = Math.floor(pekerjaCount / pekerjaRatio);
          numberOfTeams = Math.min(maxTeamsFromTukang, maxTeamsFromPekerja);
        }
        
        return numberOfTeams;
      };

      // Calculate labor costs with worker ratio
      const dailyLaborCost = (numTukang * TUKANG_RATE) + (numPekerja * PEKERJA_RATE);
      const numberOfTeams = calculateTeams(numTukang, numPekerja, workerRatio);
      const adjustedProductivity = numberOfTeams > 0 ? productivity * numberOfTeams : productivity;
      const estimatedDays = adjustedProductivity > 0 ? Math.ceil(area / adjustedProductivity) : 0;
      const totalLaborCost = dailyLaborCost * estimatedDays;

      // Calculate sub-pekerjaan (layers)
      const subPekerjaan = [];

      // 1. LAPIS 1
      let lapis1MaterialCost = 0;
      const processedLapis1Materials = [];

      lapis1Materials.forEach(material => {
        const materialQuantity = material.quantity * area * (1 + wasteFactor);
        // Ensure we always have a valid price
        const materialPrice = (material.price && material.price > 0) ? material.price : getDefaultPrice(material.name, material.unit);
        const materialCost = materialQuantity * materialPrice;
        lapis1MaterialCost += materialCost;
        
        processedLapis1Materials.push({
          name: material.name,
          quantity: materialQuantity,
          unit: material.unit,
          price: materialPrice,
          cost: materialCost
        });
      });

      const lapis1HPP = (totalLaborCost / 3) + lapis1MaterialCost; // Divide labor equally among 3 layers
      const lapis1RAB = lapis1HPP * (1 + profitPercentage);

      subPekerjaan.push({
        name: 'Lapis 1',
        description: 'Lapis dasar plamiran',
        volume: area,
        unit: 'm²',
        materials: processedLapis1Materials,
        laborCost: totalLaborCost / 3,
        materialCost: lapis1MaterialCost,
        hpp: lapis1HPP,
        rab: lapis1RAB,
        days: estimatedDays / 3
      });

      // 2. LAPIS 2
      let lapis2MaterialCost = 0;
      const processedLapis2Materials = [];

      lapis2Materials.forEach(material => {
        const materialQuantity = material.quantity * area * (1 + wasteFactor);
        // Ensure we always have a valid price
        const materialPrice = (material.price && material.price > 0) ? material.price : getDefaultPrice(material.name, material.unit);
        const materialCost = materialQuantity * materialPrice;
        lapis2MaterialCost += materialCost;
        
        processedLapis2Materials.push({
          name: material.name,
          quantity: materialQuantity,
          unit: material.unit,
          price: materialPrice,
          cost: materialCost
        });
      });

      const lapis2HPP = (totalLaborCost / 3) + lapis2MaterialCost;
      const lapis2RAB = lapis2HPP * (1 + profitPercentage);

      subPekerjaan.push({
        name: 'Lapis 2',
        description: 'Lapis tengah plamiran',
        volume: area,
        unit: 'm²',
        materials: processedLapis2Materials,
        laborCost: totalLaborCost / 3,
        materialCost: lapis2MaterialCost,
        hpp: lapis2HPP,
        rab: lapis2RAB,
        days: estimatedDays / 3
      });

      // 3. LAPIS 3
      let lapis3MaterialCost = 0;
      const processedLapis3Materials = [];

      lapis3Materials.forEach(material => {
        const materialQuantity = material.quantity * area * (1 + wasteFactor);
        // Ensure we always have a valid price
        const materialPrice = (material.price && material.price > 0) ? material.price : getDefaultPrice(material.name, material.unit);
        const materialCost = materialQuantity * materialPrice;
        lapis3MaterialCost += materialCost;
        
        processedLapis3Materials.push({
          name: material.name,
          quantity: materialQuantity,
          unit: material.unit,
          price: materialPrice,
          cost: materialCost
        });
      });

      const lapis3HPP = (totalLaborCost / 3) + lapis3MaterialCost;
      const lapis3RAB = lapis3HPP * (1 + profitPercentage);

      subPekerjaan.push({
        name: 'Lapis 3',
        description: 'Lapis finishing plamiran',
        volume: area,
        unit: 'm²',
        materials: processedLapis3Materials,
        laborCost: totalLaborCost / 3,
        materialCost: lapis3MaterialCost,
        hpp: lapis3HPP,
        rab: lapis3RAB,
        days: estimatedDays / 3
      });

      // Calculate totals
      const totalMaterialCost = subPekerjaan.reduce((sum, sub) => sum + sub.materialCost, 0);
      const totalHPP = subPekerjaan.reduce((sum, sub) => sum + sub.hpp, 0);
      const totalRAB = subPekerjaan.reduce((sum, sub) => sum + sub.rab, 0);
      const totalKeuntungan = totalRAB - totalHPP;

      const result = {
        area,
        satuan: jobType?.unit || 'm²',
        subPekerjaan,
        additionalMaterials: {
          lapis1: lapis1Materials,
          lapis2: lapis2Materials,
          lapis3: lapis3Materials
        },
        totals: {
          laborCost: totalLaborCost,
          materialCost: totalMaterialCost,
          hpp: totalHPP,
          rab: totalRAB,
          keuntungan: totalKeuntungan,
          days: estimatedDays,
          profitPercentage: parseFloat(formData.profit_percentage),
          wasteFactor: parseFloat(formData.waste_factor)
        },
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
        profitPercentage: parseFloat(formData.profit_percentage),
        wasteFactor: parseFloat(formData.waste_factor),
        projectName: formData.project_name,
        workerRatio: workerRatio
      };

      setCalculation(result);
      toast.success('Kalkulasi plamiran berhasil dihitung!');
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghitung');
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
      const savedCalculations = JSON.parse(localStorage.getItem('plaster_calculations') || '[]');
      const newCalculation = {
        ...calculation,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        jobType: jobType?.name || 'Pekerjaan Plamiran'
      };
      savedCalculations.unshift(newCalculation);
      localStorage.setItem('plaster_calculations', JSON.stringify(savedCalculations.slice(0, 50)));
      toast.success('Kalkulasi berhasil disimpan!');
    }
  };

  const handleExportPDF = async () => {
    if (!calculation) {
      toast.error('Tidak ada kalkulasi untuk diekspor');
      return;
    }

    try {
      const { GenericReportGenerator } = await import('../../utils/genericReportGenerator');
      
      const reportGenerator = new GenericReportGenerator(calculation, 'plaster', jobType);
      const pdfDoc = reportGenerator.generateReport();
      
      const filename = `laporan-plamiran-${formData.project_name || 'konstruksi'}-${new Date().toISOString().split('T')[0]}.pdf`;
      reportGenerator.save(filename);
      
      toast.success('Laporan PDF berhasil diunduh!');
    } catch (error) {
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

  const filteredMaterials = availableMaterials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(materialSearch.toLowerCase());
    const currentMats = getCurrentMaterials();
    const notAlreadySelected = !currentMats.some(m => m.id === material.id);
    return matchesSearch && notAlreadySelected;
  });

  const isMaterialsLoading = isLoadingMaterials;
  
  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Layers className="w-6 h-6 text-primary-600 mr-3" />
            Kalkulator Plamiran
          </h2>
          <p className="text-gray-600 mt-1">
            Hitung biaya pekerjaan plamiran dengan material standar per lapis
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

          {/* Layer Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spesifikasi Plamiran per Lapis
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(plasterLayers).map(([layerId, layer]) => (
                <div
                  key={layerId}
                  className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50"
                >
                  <div className="text-center">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold text-lg text-gray-900">{layer.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{layer.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Standar untuk {layer.baseArea}m²:
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {layer.materials.map((material, index) => (
                        <div key={index}>
                          {material.name}: {
                            material.name.toLowerCase().includes('lem rajawali') 
                              ? `${Math.round(material.quantity * 60)} pcs (${material.quantity.toFixed(3)} ${material.unit})`
                              : `${material.quantity} ${material.unit}`
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Area and Productivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Luas (m²) *
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
                placeholder="Masukkan luas dalam m²"
              />
              {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
            </div>

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
                placeholder={jobType?.base_productivity ? `Default: ${jobType.base_productivity}` : "Produktivitas per hari"}
              />
              {errors.productivity && <p className="text-red-500 text-sm mt-1">{errors.productivity}</p>}
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

          {/* Materials Section - 3 Layers */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Material per Lapis</h3>
            
            {/* Lapis 1 Materials */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                Material Lapis 1 (Dasar)
              </h4>
              
              {/* Selected Lapis 1 Materials */}
              {lapis1Materials.length > 0 && (
                <div className="mb-4 space-y-2">
                  {lapis1Materials.map((material) => (
                    <div key={material.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-sm text-gray-600">
                          {material.price ? formatCurrency(material.price) : 'Harga belum diset'}
                          /{material.unit}
                          {material.supplier && ` • ${material.supplier}`}
                        </p>
                        {material.isPlaceholder && (
                          <p className="text-xs text-orange-600">
                            ⚠️ Material tidak ditemukan di database. Silakan set harga manual.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={material.quantity}
                          onChange={(e) => updateMaterialQuantity(material.id, e.target.value, 'lapis1')}
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
                          onClick={() => removeMaterial(material.id, 'lapis1')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Lapis 1 Material Button */}
              <button
                type="button"
                onClick={() => openMaterialSelector('lapis1')}
                disabled={isMaterialsLoading}
                className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-100 transition-colors text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">
                  {isMaterialsLoading ? 'Memuat Material...' : 'Tambah Material Lapis 1'}
                </span>
              </button>
            </div>

            {/* Lapis 2 Materials */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                Material Lapis 2 (Tengah)
              </h4>
              
              {/* Selected Lapis 2 Materials */}
              {lapis2Materials.length > 0 && (
                <div className="mb-4 space-y-2">
                  {lapis2Materials.map((material) => (
                    <div key={material.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-sm text-gray-600">
                          {material.price ? formatCurrency(material.price) : 'Harga belum diset'}
                          /{material.unit}
                          {material.supplier && ` • ${material.supplier}`}
                        </p>
                        {material.isPlaceholder && (
                          <p className="text-xs text-orange-600">
                            ⚠️ Material tidak ditemukan di database. Silakan set harga manual.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={material.quantity}
                          onChange={(e) => updateMaterialQuantity(material.id, e.target.value, 'lapis2')}
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
                          onClick={() => removeMaterial(material.id, 'lapis2')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Lapis 2 Material Button */}
              <button
                type="button"
                onClick={() => openMaterialSelector('lapis2')}
                disabled={isMaterialsLoading}
                className="w-full p-3 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-100 transition-colors text-yellow-600 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">
                  {isMaterialsLoading ? 'Memuat Material...' : 'Tambah Material Lapis 2'}
                </span>
              </button>
            </div>

            {/* Lapis 3 Materials */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                Material Lapis 3 (Finishing)
              </h4>
              
              {/* Selected Lapis 3 Materials */}
              {lapis3Materials.length > 0 && (
                <div className="mb-4 space-y-2">
                  {lapis3Materials.map((material) => (
                    <div key={material.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-sm text-gray-600">
                          {material.price ? formatCurrency(material.price) : 'Harga belum diset'}
                          /{material.unit}
                          {material.supplier && ` • ${material.supplier}`}
                        </p>
                        {material.isPlaceholder && (
                          <p className="text-xs text-orange-600">
                            ⚠️ Material tidak ditemukan di database. Silakan set harga manual.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={material.quantity}
                          onChange={(e) => updateMaterialQuantity(material.id, e.target.value, 'lapis3')}
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
                          onClick={() => removeMaterial(material.id, 'lapis3')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Lapis 3 Material Button */}
              <button
                type="button"
                onClick={() => openMaterialSelector('lapis3')}
                disabled={isMaterialsLoading}
                className="w-full p-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-100 transition-colors text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">
                  {isMaterialsLoading ? 'Memuat Material...' : 'Tambah Material Lapis 3'}
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
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
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      {calculation && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              Hasil Kalkulasi Plamiran
            </h3>
            {calculation.projectName && (
              <p className="text-gray-600 mt-2">Proyek: {calculation.projectName}</p>
            )}
            <p className="text-gray-600 mt-1">
              Perhitungan untuk setiap lapis plamiran secara terpisah
            </p>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 table-fixed">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-32">Lapis</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Luas</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Satuan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-32">Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Hari Kerja</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP/Satuan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB/Satuan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.subPekerjaan.map((sub, index) => {
                    const hppPerSatuan = sub.volume > 0 ? sub.hpp / sub.volume : 0;
                    const rabPerSatuan = sub.volume > 0 ? sub.rab / sub.volume : 0;
                    
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 py-2 text-xs w-32">
                          <div className="font-medium text-gray-900">{sub.name}</div>
                          <div className="text-xs text-gray-600">{sub.description}</div>
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                          {formatNumber(sub.volume)}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                          {sub.unit}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-xs w-32">
                          <div className="space-y-1">
                            {sub.materials.map((material, matIndex) => (
                              <div key={matIndex} className="text-xs">
                                <div className="font-medium truncate" title={material.name}>{material.name}</div>
                                <div className="text-gray-600">
                                  {formatNumber(material.quantity)} {material.unit}
                                  {material.name.toLowerCase().includes('lem rajawali') && material.unit === 'BOX' && (
                                    <span className="text-gray-500"> ({formatNumber(material.quantity * 60)} pcs)</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs w-24">
                          {formatNumber(sub.days, 1)} hari
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-700 text-xs w-24">
                          {formatCurrency(sub.hpp)}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center font-medium text-purple-600 text-xs w-24">
                          {formatCurrency(hppPerSatuan)}/{sub.unit}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center font-bold text-green-700 text-xs w-24">
                          {formatCurrency(sub.rab)}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center font-medium text-teal-600 text-xs w-24">
                          {formatCurrency(rabPerSatuan)}/{sub.unit}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center font-bold text-orange-700 text-xs w-24">
                          {formatCurrency(sub.rab - sub.hpp)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                    <td className="border border-gray-300 px-2 py-2 text-xs w-32">
                      <div className="font-bold text-gray-900">TOTAL</div>
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      {formatNumber(calculation.area)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      m²
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-32">
                      -
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-24">
                      {formatNumber(calculation.totals.days, 1)} hari
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-800 bg-blue-200 text-xs w-24">
                      {formatCurrency(calculation.totals.hpp)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-purple-800 bg-purple-200 text-xs w-24">
                      {formatCurrency(calculation.area > 0 ? calculation.totals.hpp / calculation.area : 0)}/m²
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-green-800 bg-green-200 text-xs w-24">
                      {formatCurrency(calculation.totals.rab)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-teal-800 bg-teal-200 text-xs w-24">
                      {formatCurrency(calculation.area > 0 ? calculation.totals.rab / calculation.area : 0)}/m²
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-orange-800 bg-orange-200 text-xs w-24">
                      {formatCurrency(calculation.totals.keuntungan)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analisis Harga per Satuan Volume */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Analisis Harga per Satuan Volume</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-xs">Lapis</th>
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
                    {calculation.subPekerjaan.map((sub, index) => {
                      const hppBahanPerSatuan = sub.volume > 0 ? sub.materialCost / sub.volume : 0;
                      const rabBahanPerSatuan = hppBahanPerSatuan * (1 + (calculation.profitPercentage / 100));
                      const hppTukangPerSatuan = sub.volume > 0 ? sub.laborCost / sub.volume : 0;
                      const rabTukangPerSatuan = hppTukangPerSatuan * (1 + (calculation.profitPercentage / 100));
                      const hppPerSatuan = sub.volume > 0 ? sub.hpp / sub.volume : 0;
                      const rabPerSatuan = sub.volume > 0 ? sub.rab / sub.volume : 0;

                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900">
                            {sub.name}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                            {formatNumber(sub.volume)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                            {sub.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-blue-600">
                            {formatCurrency(hppBahanPerSatuan)}/{sub.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-blue-700">
                            {formatCurrency(rabBahanPerSatuan)}/{sub.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-green-600">
                            {formatCurrency(hppTukangPerSatuan)}/{sub.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-green-700">
                            {formatCurrency(rabTukangPerSatuan)}/{sub.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-purple-700">
                            {formatCurrency(hppPerSatuan)}/{sub.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-teal-700">
                            {formatCurrency(rabPerSatuan)}/{sub.unit}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                      <td className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                        {formatNumber(calculation.area)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                        m²
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-blue-700 bg-blue-100">
                        {formatCurrency(calculation.area > 0 ? calculation.totals.materialCost / calculation.area : 0)}/m²
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-blue-800 bg-blue-200">
                        {formatCurrency(calculation.area > 0 ? (calculation.totals.materialCost * (1 + (calculation.profitPercentage / 100))) / calculation.area : 0)}/m²
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-green-700 bg-green-100">
                        {formatCurrency(calculation.area > 0 ? calculation.totals.laborCost / calculation.area : 0)}/m²
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-green-800 bg-green-200">
                        {formatCurrency(calculation.area > 0 ? (calculation.totals.laborCost * (1 + (calculation.profitPercentage / 100))) / calculation.area : 0)}/m²
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-purple-800 bg-purple-200">
                        {formatCurrency(calculation.area > 0 ? calculation.totals.hpp / calculation.area : 0)}/m²
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-teal-800 bg-teal-200">
                        {formatCurrency(calculation.area > 0 ? calculation.totals.rab / calculation.area : 0)}/m²
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
                    <span className="font-medium">{formatNumber(calculation.totals.days, 1)} hari</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Biaya Tenaga Kerja:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(calculation.totals.laborCost)}</span>
                  </div>
                </div>
              </div>

              {/* Material Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Detail Material</h4>
                {calculation.subPekerjaan.some(sub => sub.materials.length > 0) ? (
                  <div className="space-y-3">
                    {calculation.subPekerjaan.map((sub, subIndex) => (
                      sub.materials.length > 0 && (
                        <div key={subIndex} className="border-b border-gray-200 pb-2 last:border-b-0">
                          <div className="font-medium text-sm mb-2">{sub.name}:</div>
                          {sub.materials.map((material, matIndex) => (
                            <div key={matIndex} className="text-sm text-gray-600 ml-2 mb-2">
                              <div className="font-medium">{material.name}</div>
                              <div className="text-xs space-y-1">
                                <div>Kebutuhan: {formatNumber(material.quantity)} {material.unit}
                                  {material.name.toLowerCase().includes('lem rajawali') && material.unit === 'BOX' && (
                                    <span className="text-gray-500"> ({formatNumber(material.quantity * 60)} pcs)</span>
                                  )}
                                </div>
                                <div>Harga: {formatCurrency(material.price)}/{material.unit}</div>
                                <div className="font-medium text-blue-600">Total: {formatCurrency(material.cost)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total Biaya Material:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(calculation.totals.materialCost)}</span>
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
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.totals.hpp)}</p>
                <p className="text-sm text-blue-700 mt-1">Harga Pokok Produksi</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Total RAB</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculation.totals.rab)}</p>
                <p className="text-sm text-green-700 mt-1">Rencana Anggaran Biaya</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Keuntungan ({calculation.profitPercentage}%)</h4>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculation.totals.keuntungan)}</p>
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
                  {currentMaterialType && (
                    <p className="text-sm text-gray-600 mt-1">
                      Untuk: <span className="font-medium capitalize">{
                        currentMaterialType === 'lapis1' ? 'Lapis 1 (Dasar)' :
                        currentMaterialType === 'lapis2' ? 'Lapis 2 (Tengah)' :
                        'Lapis 3 (Finishing)'
                      }</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowMaterialSelector(false);
                    setMaterialSearch('');
                    setCurrentMaterialType('');
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
              {isMaterialsLoading ? (
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
              ) : filteredMaterials.length > 0 ? (
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
              )}
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

export default PlasterCalculator;
