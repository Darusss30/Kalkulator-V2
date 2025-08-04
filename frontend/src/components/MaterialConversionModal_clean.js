import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Package, Ruler, Building, Beaker } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { brickCalculator } from '../utils/brickCalculator';
import { concreteCalculator } from '../utils/concreteCalculator';
import jobSpecificMaterialConverter from '../utils/jobSpecificMaterialConverter';
import dynamicMaterialConverter from '../utils/dynamicMaterialConverter';
import BrickPresets from './BrickPresets';

const MaterialConversionModal = ({
  isOpen,
  onClose,
  onSubmit,
  material,
  isLoading,
  jobType = null // Add jobType prop for job-specific conversions
}) => {
  // Fetch existing units from database (get all materials without pagination)
  const { data: materialsData, isLoading: isLoadingUnits } = useQuery(
    ['materials-units', 'all-units'], // Remove timestamp to prevent infinite refetches
    () => api.get('/materials', { 
      params: { 
        limit: 500 // Maximum allowed by backend validation
        // Remove cache buster to prevent excessive requests
      } 
    }),
    {
      enabled: isOpen,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnMount: false, // Don't refetch on every mount
      refetchOnWindowFocus: false,
      retry: 2, // Retry failed requests only twice
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    }
  );

  // Extract unique units from existing materials
  const existingUnits = React.useMemo(() => {
    if (!materialsData) {
      return [];
    }

    // Handle the Axios response structure: response.data.materials
    let materials = [];
    
    if (materialsData.data && materialsData.data.materials && Array.isArray(materialsData.data.materials)) {
      materials = materialsData.data.materials;
    } else {
      return [];
    }

    if (materials.length === 0) {
      return [];
    }

    // Extract units
    const allUnitsRaw = [];
    
    materials.forEach((material) => {
      if (material.unit && typeof material.unit === 'string') {
        const cleanUnit = material.unit.trim();
        if (cleanUnit !== '') {
          allUnitsRaw.push(cleanUnit);
        }
      }
    });
    
    // Get unique units and sort alphabetically
    const uniqueUnits = [...new Set(allUnitsRaw)].sort();
    
    if (process.env.NODE_ENV === 'development') {
    }
    
    return uniqueUnits;
  }, [materialsData]);

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    conversion_factor: '',
    base_unit: '',
    conversion_description: '',
    pieces_per_unit: '',
    piece_dimensions: '',
    coverage_per_unit: '',
    supplier: '',
    description: '',
    // New fields for complex conversions
    material_type: '',
    brick_length: '',
    brick_width: '',
    brick_height: '',
    mortar_thickness: '',
    wall_thickness: '',
    waste_factor: '0'
  });

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

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        unit: material.unit || '',
        price: material.price || '',
        conversion_factor: material.conversion_factor || '',
        base_unit: material.base_unit || '',
        conversion_description: material.conversion_description || '',
        pieces_per_unit: material.pieces_per_unit || '',
        piece_dimensions: material.piece_dimensions || '',
        coverage_per_unit: material.coverage_per_unit || '',
        supplier: material.supplier || '',
        description: material.description || '',
        material_type: material.material_type || '',
        brick_length: material.brick_length || '',
        brick_width: material.brick_width || '',
        brick_height: material.brick_height || '',
        mortar_thickness: material.mortar_thickness || '',
        wall_thickness: material.wall_thickness || '',
        waste_factor: material.waste_factor || '0'
      });
    } else {
      resetForm();
    }
  }, [material]);

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      price: '',
      conversion_factor: '',
      base_unit: '',
      conversion_description: '',
      pieces_per_unit: '',
      piece_dimensions: '',
      coverage_per_unit: '',
      supplier: '',
      description: '',
      material_type: '',
      brick_length: '',
      brick_width: '',
      brick_height: '',
      mortar_thickness: '',
      wall_thickness: '',
      waste_factor: '0'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle brick preset selection
  const handlePresetSelect = (presetData) => {
    setFormData(prev => ({
      ...prev,
      ...presetData
    }));
  };

  // Calculate brick wall coverage using improved calculator
  const calculateBrickCoverage = () => {
    const pieces = parseInt(formData.pieces_per_unit) || 0;
    const brickLength = parseFloat(formData.brick_length) || 0;
    const brickWidth = parseFloat(formData.brick_width) || 0;
    const brickHeight = parseFloat(formData.brick_height) || 0;
    const mortarThickness = parseFloat(formData.mortar_thickness) || 10;
    const wasteFactor = parseFloat(formData.waste_factor) || 5;
    
    try {
      // Validate dimensions first
      const warnings = brickCalculator.validateDimensions(brickLength, brickWidth, brickHeight);
      
      // Calculate using improved brick calculator
      const result = brickCalculator.calculateWallCoverage({
        pieces,
        brickLength,
        brickWidth,
        brickHeight,
        mortarThickness,
        wasteFactor
      });
      
      // Update form with calculated values
      setFormData(prev => ({
        ...prev,
        coverage_per_unit: result.areas.totalAreaWithWaste.toFixed(4),
        conversion_factor: result.conversion.conversionFactor.toPrecision(4),
        base_unit: 'm2',
        conversion_description: `1 m² = ${result.conversion.conversionFactor.toPrecision(4)} ${prev.unit || 'truk'} (${pieces} bata @ ${brickLength}×${brickWidth}×${brickHeight}mm + mortar ${mortarThickness}mm = ${result.areas.totalAreaWithWaste.toFixed(2)} m² tembok termasuk waste ${wasteFactor}%)`
      }));
      
      // Show detailed calculation with warnings if any
      let alertMessage = `✅ Kalkulasi Bata Berhasil!

📊 Detail Perhitungan:
• Jumlah bata: ${pieces.toLocaleString()} pcs
• Ukuran bata: ${brickLength} × ${brickWidth} × ${brickHeight} mm
• Tebal mortar: ${mortarThickness} mm
• Ukuran efektif: ${(result.dimensions.effectiveLengthM * 1000).toFixed(0)} × ${(result.dimensions.effectiveHeightM * 1000).toFixed(0)} mm
• Area per bata: ${(result.areas.areaPerBrick * 10000).toFixed(2)} cm²
• Bata per m²: ${result.conversion.bricksPerM2} pcs
• Total area dasar: ${result.areas.totalAreaBase.toFixed(2)} m²
• Area pemborosan: ${result.areas.wasteArea.toFixed(2)} m² (${wasteFactor}%)
• Total area tembok: ${result.areas.totalAreaWithWaste.toFixed(2)} m²
• Volume mortar: ${result.mortar.volumePerM2.toFixed(4)} m³/m²

🔄 Konversi:
• 1 m² = ${result.conversion.conversionFactor.toPrecision(4)} ${formData.unit || 'kemasan'}
• 1 ${formData.unit || 'kemasan'} = ${result.areas.totalAreaWithWaste.toFixed(2)} m²

💡 Catatan: Perhitungan sudah termasuk mortar dan waste factor`;

      // Add warnings if any
      if (warnings.length > 0) {
        alertMessage += `\n\n⚠️ Peringatan:\n${warnings.map(w => `• ${w}`).join('\n')}`;
      }
      
      alert(alertMessage);
      
      
    } catch (error) {
      alert(`❌ Error dalam kalkulasi bata: ${error.message}\n\nPastikan semua data sudah diisi dengan benar:\n• Jumlah bata per kemasan\n• Panjang bata (mm)\n• Tinggi bata (mm)\n\nContoh:\n• Jumlah: 6000 pcs\n• Panjang: 230 mm\n• Tinggi: 50 mm`);
    }
  };

  // Auto-calculate coverage for tile/granit materials with flexible dimensions
  const calculateTileCoverage = () => {
    const pieces = parseInt(formData.pieces_per_unit) || 0;
    const dimensions = formData.piece_dimensions;
    
    if (pieces > 0 && dimensions) {
      // Parse various dimension formats: "60x60cm", "30x30", "60x60", "25x50cm", etc.
      const match = dimensions.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
      if (match) {
        const width = parseFloat(match[1]);
        const height = parseFloat(match[2]);
        
        // Determine unit - check if 'mm' or 'm' is specified, otherwise assume cm
        let unit = 'cm'; // default
        if (dimensions.toLowerCase().includes('mm')) {
          unit = 'mm';
        } else if (dimensions.toLowerCase().includes('m') && !dimensions.toLowerCase().includes('cm')) {
          unit = 'm';
        }
        
        // Convert to m²
        let areaPerPiece;
        switch (unit) {
          case 'mm':
            areaPerPiece = (width * height) / 1000000; // mm² to m²
            break;
          case 'm':
            areaPerPiece = width * height; // already in m²
            break;
          default: // cm
            areaPerPiece = (width * height) / 10000; // cm² to m²
        }
        
        const totalArea = pieces * areaPerPiece;
        
        // Calculate inverse conversion factor (1 m² = berapa dus)
        const inverseFactor = 1 / totalArea;
        
        // Update form with calculated values
        setFormData(prev => ({
          ...prev,
          coverage_per_unit: totalArea.toFixed(4),
          conversion_factor: inverseFactor.toPrecision(4),
          base_unit: 'm2',
          conversion_description: `1 m² = ${inverseFactor.toPrecision(4)} ${prev.unit || 'dus'} (${pieces} keping @ ${width}x${height}${unit} = ${totalArea.toFixed(4)} m²)`
        }));
        
        // Show success message with detailed info
        alert(`✅ Kalkulasi berhasil!\n${pieces} keping @ ${width}x${height}${unit} = ${totalArea.toFixed(4)} m²\n\nArea per keping: ${areaPerPiece.toFixed(4)} m²`);
      } else {
        alert('❌ Format dimensi tidak valid!\n\nContoh format yang benar:\n• 60x60cm\n• 30x50cm\n• 25x25\n• 1.2x0.8m\n• 600x600mm');
      }
    } else {
      alert('⚠️ Masukkan jumlah keping dan dimensi terlebih dahulu!\n\nContoh:\n• Jumlah keping: 4\n• Dimensi: 60x60cm');
    }
  };

  // Calculate cement conversion using research data
  const calculateCementConversion = () => {
    try {
      const conversion = concreteCalculator.calculateCementConversion({ 
        grade: 'K-225', 
        volume: 1 
      });

      setFormData(prev => ({
        ...prev,
        conversion_factor: conversion.conversion.conversion_factor.toString(),
        base_unit: conversion.conversion.base_unit,
        conversion_description: conversion.conversion.conversion_description,
        material_type: 'powder'
      }));

      alert(`✅ Konversi Semen Berhasil!\n\n📊 Data Riset Lokal:\n• 1 sak = ${conversion.conversion.conversion_factor} kg\n• Kebutuhan K-225: ${conversion.conversion.usage_per_m3.saks} sak/m³\n• Setara: ${conversion.conversion.usage_per_m3.kg} kg/m³\n\n💡 Data ini berdasarkan riset lokal dengan semen 40kg per sak`);
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Calculate pasir japanan conversion
  const calculatePasirJapananConversion = () => {
    try {
      const conversion = concreteCalculator.calculateSpecialMaterialConversion({
        material_type: 'pasir_japanan_granite',
        area: 1
      });

      setFormData(prev => ({
        ...prev,
        conversion_factor: conversion.conversion.conversion_factor.toString(),
        base_unit: conversion.conversion.calculation_unit,
        conversion_description: conversion.conversion.conversion_description,
        material_type: 'aggregate'
      }));

      alert(`✅ Konversi Pasir Japanan Berhasil!\n\n📊 Data Riset Lokal:\n• 1 truk = ${conversion.conversion.conversion_factor} m³\n• Kebutuhan per m² granite: ${conversion.conversion.usage_per_m2} m³\n• Untuk 1 m² granite butuh: ${(conversion.conversion.usage_per_m2 / conversion.conversion.conversion_factor).toFixed(4)} truk\n\n💡 Data ini berdasarkan riset lokal untuk pekerjaan granite`);
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Enhanced auto-suggest conversion with research data
  const suggestConversion = () => {
    const materialName = formData.name.toLowerCase();
    const unit = formData.unit.toLowerCase();
    
    let suggestions = {};
    
    // Auto-set conversion for common materials using research data
    if (materialName.includes('semen') || materialName.includes('cement') || materialName.includes('adamix')) {
      if (unit.includes('sak') || unit.includes('zak')) {
        // Use research data: 40kg per sak
        suggestions = {
          conversion_factor: '40',
          base_unit: 'kg',
          conversion_description: '1 sak semen = 40 kg (data riset lokal)',
          material_type: 'powder'
        };
      }
    } else if (materialName.includes('pasir') && materialName.includes('japanan')) {
      if (unit.includes('truk')) {
        // Use research data: 1 truk = 7 m³
        suggestions = {
          conversion_factor: '7',
          base_unit: 'm³',
          conversion_description: '1 truk = 7 m³, kebutuhan 0.0343 m³ per m² granite',
          material_type: 'aggregate'
        };
      }
    } else if (materialName.includes('pasir') || materialName.includes('sand')) {
      if (unit.includes('truk')) {
        suggestions = {
          conversion_factor: '6',
          base_unit: 'm3',
          conversion_description: '1 truk pasir = 6 m³',
          material_type: 'aggregate'
        };
      } else if (unit.includes('dum')) {
        suggestions = {
          conversion_factor: '1',
          base_unit: 'm3',
          conversion_description: '1 dum pasir = 1 m³',
          material_type: 'aggregate'
        };
      } else if (unit.includes('pickup')) {
        suggestions = {
          conversion_factor: '0.5',
          base_unit: 'm3',
          conversion_description: '1 pickup pasir = 0.5 m³',
          material_type: 'aggregate'
        };
      }
    } else if (materialName.includes('split') || materialName.includes('koral') || materialName.includes('batu')) {
      if (unit.includes('dum')) {
        suggestions = {
          conversion_factor: '1',
          base_unit: 'm3',
          conversion_description: '1 dum batu = 1 m³',
          material_type: 'aggregate'
        };
      }
    } else if (materialName.includes('granit') || materialName.includes('keramik') || materialName.includes('tile')) {
      if (unit.includes('dus') || unit.includes('box')) {
        // Default: 4 keping @ 60x60cm = 1.44 m², jadi 1 m² = 0.6944 dus
        const defaultArea = 4 * (0.6 * 0.6); // 4 keping @ 60x60cm = 1.44 m²
        const inverseFactor = 1 / defaultArea;
        suggestions = {
          base_unit: 'm2',
          pieces_per_unit: '4',
          piece_dimensions: '60x60cm',
          conversion_factor: inverseFactor.toPrecision(4),
          conversion_description: `1 m² = ${inverseFactor.toPrecision(4)} dus (gunakan kalkulator untuk dimensi yang tepat)`,
          material_type: 'tile'
        };
      }
    } else if (materialName.includes('cat')) {
      if (unit.includes('galon')) {
        suggestions = {
          conversion_factor: '3.8',
          base_unit: 'liter',
          conversion_description: '1 galon cat = 3.8 liter',
          material_type: 'liquid'
        };
      } else if (unit.includes('pill') || unit.includes('kaleng')) {
        suggestions = {
          conversion_factor: '1',
          base_unit: 'liter',
          conversion_description: '1 kaleng cat = 1 liter',
          material_type: 'liquid'
        };
      }
    } else if (materialName.includes('besi')) {
      if (unit.includes('lonjor')) {
        suggestions = {
          conversion_factor: '12',
          base_unit: 'm',
          conversion_description: '1 lonjor besi = 12 meter',
          material_type: 'steel'
        };
      }
    } else if (materialName.includes('bata')) {
      // Use accurate brick calculator for suggestions
      const brickConfigs = [
        { pieces: 6000, unit: 'truk', keywords: ['6000', 'truk'] },
        { pieces: 2000, unit: 'dum', keywords: ['2000', 'dum'] },
        { pieces: 500, unit: 'pickup', keywords: ['500', 'pickup'] }
      ];

      const config = brickConfigs.find(cfg => 
        cfg.keywords.some(keyword => 
          materialName.includes(keyword) || unit.includes(keyword)
        )
      );

      if (config) {
        try {
          // Calculate using improved brick calculator with standard red brick dimensions
          const result = brickCalculator.calculateWallCoverage({
            pieces: config.pieces,
            brickLength: 230,
            brickWidth: 110,
            brickHeight: 50,
            mortarThickness: 10,
            wasteFactor: 5
          });

          suggestions = {
            conversion_factor: result.conversion.conversionFactor.toPrecision(4),
            base_unit: 'm2',
            pieces_per_unit: config.pieces.toString(),
            brick_length: '230',
            brick_width: '110',
            brick_height: '50',
            mortar_thickness: '10',
            waste_factor: '5',
            coverage_per_unit: result.areas.totalAreaWithWaste.toFixed(4),
            conversion_description: `1 m² = ${result.conversion.conversionFactor.toPrecision(4)} ${config.unit} (${config.pieces} bata @ 230×110×50mm + mortar 10mm = ${result.areas.totalAreaWithWaste.toFixed(2)} m² termasuk waste 5%)`,
            material_type: 'brick'
          };
        } catch (error) {
          // Fallback to old calculation if error occurs
          const fallbackArea = config.pieces === 6000 ? 90.72 : config.pieces === 2000 ? 30.24 : 15.12;
          const inverseFactor = 1 / fallbackArea;
          suggestions = {
            conversion_factor: inverseFactor.toPrecision(4),
            base_unit: 'm2',
            pieces_per_unit: config.pieces.toString(),
            brick_length: '230',
            brick_width: '110',
            brick_height: '50',
            mortar_thickness: '10',
            waste_factor: '5',
            conversion_description: `1 m² = ${inverseFactor.toPrecision(4)} ${config.unit} (gunakan kalkulator bata untuk perhitungan akurat)`,
            material_type: 'brick'
          };
        }
      }
    }
    
    if (Object.keys(suggestions).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...suggestions
      }));
      
      alert(`✅ Saran konversi diterapkan!\n\nMaterial: ${formData.name}\nKonversi: ${suggestions.conversion_description || 'Lihat detail di form'}`);
    } else {
      alert('💡 Tidak ada saran konversi otomatis untuk material ini.\n\nAnda dapat mengisi konversi secara manual:\n• Tentukan satuan dasar (kg, m², m³, dll)\n• Masukkan faktor konversi\n• Untuk granit/keramik: isi jumlah keping dan dimensi\n• Untuk bata: isi dimensi bata dan gunakan kalkulator');
    }
  };

  // Dynamic job-specific auto-suggest conversion
  const suggestJobSpecificConversion = async () => {
    if (!jobType) {
      alert('⚠️ Tidak ada informasi job type.\n\nSaran konversi spesifik memerlukan informasi jenis pekerjaan.');
      return;
    }

    const materialName = formData.name;
    const unit = formData.unit;
    
    if (!materialName || !unit) {
      alert('⚠️ Lengkapi nama material dan satuan terlebih dahulu.');
      return;
    }

    try {
      // Generate dynamic job-specific conversion
      const dynamicConversion = await dynamicMaterialConverter.generateJobSpecificConversion(
        jobType.name, 
        materialName, 
        unit
      );

      if (dynamicConversion) {
        setFormData(prev => ({
          ...prev,
          conversion_factor: dynamicConversion.conversion_factor.toString(),
          base_unit: dynamicConversion.base_unit,
          conversion_description: dynamicConversion.conversion_description,
          material_type: dynamicConversion.material_type || prev.material_type
        }));
        
        const jobInfo = dynamicConversion.job_specific_data;
        let alertMessage = `✅ Saran konversi dinamis untuk "${jobType.name}" diterapkan!\n\n`;
        alertMessage += `📋 Job Type: ${jobType.name}\n`;
        alertMessage += `🏗️ Kategori: ${jobInfo?.category || 'Umum'}\n`;
        if (jobInfo?.grade) {
          alertMessage += `🎯 Grade/Jenis: ${jobInfo.grade}\n`;
        }
        alertMessage += `🔄 Konversi: ${dynamicConversion.conversion_description}\n`;
        alertMessage += `📊 Sumber: ${dynamicConversion.rule_name || 'Database Rule'}\n\n`;
        
        if (jobInfo?.requirement) {
          alertMessage += `📊 Kebutuhan Standar:\n`;
          alertMessage += `• ${jobInfo.requirement.quantity} ${jobInfo.requirement.unit}\n`;
          if (jobInfo.requirement.grade) {
            alertMessage += `• Grade: ${jobInfo.requirement.grade}\n`;
          }
        }
        
        alert(alertMessage);
      } else {
        // Fallback to static conversion
        const staticConversion = jobSpecificMaterialConverter.generateJobSpecificConversion(
          jobType.name, 
          materialName, 
          unit
        );

        if (staticConversion) {
          setFormData(prev => ({
            ...prev,
            ...staticConversion
          }));
          alert(`✅ Saran konversi statis diterapkan!\n\nKonversi: ${staticConversion.conversion_description}\n\n⚠️ Catatan: Ini menggunakan data statis. Pertimbangkan untuk menambahkan aturan dinamis di database.`);
        } else {
          // Final fallback to general conversion
          suggestConversion();
        }
      }
    } catch (error) {
      console.error('Error getting dynamic conversion:', error);
      alert('❌ Gagal mendapatkan saran konversi dinamis. Menggunakan fallback ke konversi umum.');
      suggestConversion();
    }
  };

  const baseUnits = [
    'kg', 'm', 'm2', 'm3', 'liter', 'pcs'
  ];

  const materialTypes = [
    { value: 'brick', label: 'Bata/Batako' },
    { value: 'tile', label: 'Keramik/Granit' },
    { value: 'aggregate', label: 'Agregat (Pasir/Batu)' },
    { value: 'powder', label: 'Serbuk (Semen/dll)' },
    { value: 'liquid', label: 'Cairan (Cat/dll)' },
    { value: 'steel', label: 'Besi/Logam' },
    { value: 'other', label: 'Lainnya' }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
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
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {material ? 'Edit Material & Konversi' : 'Tambah Material & Konversi'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Material ini akan tersedia untuk digunakan dalam komposisi job type
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Material Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Material *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Contoh: Bata Merah, Granit Apolion Black"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satuan Kemasan *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  required
                  disabled={isLoadingUnits}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {isLoadingUnits ? 'Memuat satuan...' : 'Pilih Satuan'}
                  </option>
                  {/* DATABASE UNITS ONLY */}
                  {existingUnits.length > 0 ? (
                    existingUnits.map(unit => (
                      <option key={`db-${unit}`} value={unit} className="font-medium">
                        {
