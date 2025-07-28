import React from 'react';
import { Building, Zap, Package } from 'lucide-react';
import { brickCalculator } from '../utils/brickCalculator';

const BrickPresets = ({ onSelectPreset, currentFormData }) => {
  const presets = brickCalculator.getPresets();

  const handlePresetSelect = (presetKey, preset) => {
    onSelectPreset({
      brick_length: preset.length.toString(),
      brick_width: preset.width.toString(),
      brick_height: preset.height.toString(),
      mortar_thickness: preset.mortarThickness.toString(),
      waste_factor: preset.wasteFactor.toString(),
      material_type: 'brick'
    });
  };

  const getPresetIcon = (presetKey) => {
    switch (presetKey) {
      case 'bata_merah':
        return <Building className="w-5 h-5 text-red-600" />;
      case 'bata_putih':
        return <Building className="w-5 h-5 text-slate-600" />;
      case 'batako':
        return <Package className="w-5 h-5 text-gray-600" />;
      case 'bata_ringan':
        return <Zap className="w-5 h-5 text-blue-600" />;
      default:
        return <Building className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPresetColor = (presetKey) => {
    switch (presetKey) {
      case 'bata_merah':
        return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'bata_putih':
        return 'border-slate-200 bg-slate-50 hover:bg-slate-100';
      case 'batako':
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
      case 'bata_ringan':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <Building className="w-4 h-4 text-primary-600 mr-2" />
        <h5 className="text-sm font-medium text-gray-900">Preset Bata Umum</h5>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => handlePresetSelect(key, preset)}
            className={`
              p-3 border rounded-lg text-left transition-all duration-200 hover:shadow-sm
              ${getPresetColor(key)}
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                {getPresetIcon(key)}
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {preset.name}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>📏 {preset.length}×{preset.width}×{preset.height}mm</div>
              <div>🧱 Mortar: {preset.mortarThickness}mm</div>
              <div>📊 Waste: {preset.wasteFactor}%</div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 italic">
              {preset.description}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        💡 Klik preset untuk mengisi dimensi otomatis, lalu sesuaikan jumlah bata per kemasan
      </div>
    </div>
  );
};

export default BrickPresets;
