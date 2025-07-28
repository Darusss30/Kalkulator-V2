import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Package, Ruler, Building } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { brickCalculator } from '../utils/brickCalculator';
import BrickPresets from './BrickPresets';

const MaterialConversionModal = ({
  isOpen,
  onClose,
  onSubmit,
  material,
  isLoading
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

  // Enhanced auto-suggest conversion with more material types
  const suggestConversion = () => {
    const materialName = formData.name.toLowerCase();
    const unit = formData.unit.toLowerCase();
    
    let suggestions = {};
    
    // Auto-set conversion for common materials
    if (materialName.includes('semen') || materialName.includes('cement') || materialName.includes('adamix')) {
      if (unit.includes('sak') || unit.includes('zak')) {
        suggestions = {
          conversion_factor: '50',
          base_unit: 'kg',
          conversion_description: '1 sak semen = 50 kg',
          material_type: 'powder'
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
            <h3 className="text-lg font-semibold text-gray-900">
              {material ? 'Edit Material & Konversi' : 'Tambah Material & Konversi'}
            </h3>
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
                        {unit}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Tidak ada satuan di database
                    </option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {existingUnits.length > 0 
                    ? `satuan`
                    : 'Tidak ada satuan di database'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga per Satuan *
                </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    onWheel={(e) => e.preventDefault()}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Nama supplier/toko"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Material Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Material
              </label>
              <select
                value={formData.material_type}
                onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Pilih Jenis Material</option>
                {materialTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Brick Specific Section */}
            {formData.material_type === 'brick' && (
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <Building className="w-5 h-5 text-primary-600 mr-2" />
                  <h4 className="text-md font-semibold text-gray-900">Kalkulator Bata → Area Tembok</h4>
                </div>

                {/* Brick Presets */}
                <BrickPresets 
                  onSelectPreset={handlePresetSelect}
                  currentFormData={formData}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Bata per Kemasan
                    </label>
                    <input
                      type="number"
                      value={formData.pieces_per_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, pieces_per_unit: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="6000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Panjang Bata (mm)
                    </label>
                    <input
                      type="number"
                      value={formData.brick_length}
                      onChange={(e) => setFormData(prev => ({ ...prev, brick_length: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="230"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tinggi Bata (mm)
                    </label>
                    <input
                      type="number"
                      value={formData.brick_height}
                      onChange={(e) => setFormData(prev => ({ ...prev, brick_height: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lebar Bata (mm)
                    </label>
                    <input
                      type="number"
                      value={formData.brick_width}
                      onChange={(e) => setFormData(prev => ({ ...prev, brick_width: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="110"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tebal Mortar (mm)
                    </label>
                    <input
                      type="number"
                      value={formData.mortar_thickness}
                      onChange={(e) => setFormData(prev => ({ ...prev, mortar_thickness: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waste Factor (%)
                    </label>
                    <input
                      type="number"
                      value={formData.waste_factor}
                      onChange={(e) => setFormData(prev => ({ ...prev, waste_factor: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={calculateBrickCoverage}
                    className="w-full flex items-center justify-center py-3 px-4 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Building className="w-5 h-5 mr-2" />
                    <span>Hitung Area Tembok</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tile/Granit Specific Section */}
            {formData.material_type === 'tile' && (
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <Package className="w-5 h-5 text-primary-600 mr-2" />
                  <h4 className="text-md font-semibold text-gray-900">Khusus Keramik/Granit</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Keping per Kemasan
                    </label>
                    <input
                      type="number"
                      value={formData.pieces_per_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, pieces_per_unit: e.target.value }))}
                      onWheel={(e) => e.preventDefault()}
                      placeholder="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dimensi per Keping
                    </label>
                    <input
                      type="text"
                      value={formData.piece_dimensions}
                      onChange={(e) => setFormData(prev => ({ ...prev, piece_dimensions: e.target.value }))}
                      placeholder="60x60cm"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coverage per Kemasan (m²)
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        step="any"
                        value={formData.coverage_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, coverage_per_unit: e.target.value }))}
                        onWheel={(e) => e.preventDefault()}
                        placeholder="1.44"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={calculateTileCoverage}
                        className="px-3 py-2 bg-primary-100 text-primary-600 border border-l-0 border-gray-300 rounded-r-lg hover:bg-primary-200"
                        title="Hitung otomatis"
                      >
                        <Ruler className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 text-primary-600 mr-2" />
                  <h4 className="text-md font-semibold text-gray-900">Informasi Konversi</h4>
                </div>
                <button
                  type="button"
                  onClick={suggestConversion}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Saran konversi otomatis berdasarkan nama material"
                >
                  💡 Saran Auto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan Dasar
                  </label>
                  <select
                    value={formData.base_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Pilih Satuan Dasar</option>
                    {baseUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Satuan untuk kalkulasi (kg, m², m³, dll)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faktor Konversi
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.conversion_factor}
                    onChange={(e) => setFormData(prev => ({ ...prev, conversion_factor: e.target.value }))}
                    onWheel={(e) => e.preventDefault()}
                    placeholder="1.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 {formData.base_unit} = berapa {formData.unit}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Konversi
                </label>
                <input
                  type="text"
                  value={formData.conversion_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, conversion_description: e.target.value }))}
                  placeholder="Contoh: 1 sak = 50 kg, 1 dus = 4 keping @ 60x60cm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Material
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Deskripsi tambahan tentang material ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isLoading 
                    ? 'Menyimpan...' 
                    : material ? 'Update Material' : 'Simpan Material'
                  }
                </span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaterialConversionModal;
