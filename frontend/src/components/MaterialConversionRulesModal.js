import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Search, Save, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const MaterialConversionRulesModal = ({
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState('');
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  const [ruleFormData, setRuleFormData] = useState({
    rule_name: '',
    material_pattern: '',
    unit_pattern: '',
    conversion_factor: '',
    base_unit: '',
    conversion_description: '',
    material_type: '',
    job_category_pattern: '',
    priority: '100',
    notes: ''
  });

  // Fetch conversion rules
  const { 
    data: rulesData, 
    isLoading: isLoadingRules, 
    refetch: refetchRules 
  } = useQuery(
    ['material-conversion-rules', { search: searchQuery, material_type: selectedMaterialType }],
    () => api.get('/material-conversion-rules', {
      params: {
        search: searchQuery,
        material_type: selectedMaterialType,
        active_only: true,
        limit: 50
      }
    }),
    {
      enabled: isOpen,
      keepPreviousData: true
    }
  );

  // Fetch conversion presets
  const { data: presetsData, isLoading: isLoadingPresets } = useQuery(
    ['material-conversion-presets'],
    () => api.get('/material-conversion-rules/presets'),
    {
      enabled: isOpen && showPresets
    }
  );

  // Create rule mutation
  const createRuleMutation = useMutation(
    (ruleData) => api.post('/material-conversion-rules', ruleData),
    {
      onSuccess: () => {
        toast.success('Aturan konversi berhasil dibuat');
        queryClient.invalidateQueries(['material-conversion-rules']);
        resetRuleForm();
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal membuat aturan konversi');
      }
    }
  );

  // Update rule mutation
  const updateRuleMutation = useMutation(
    ({ id, data }) => api.put(`/material-conversion-rules/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Aturan konversi berhasil diupdate');
        queryClient.invalidateQueries(['material-conversion-rules']);
        resetRuleForm();
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengupdate aturan konversi');
      }
    }
  );

  // Delete rule mutation
  const deleteRuleMutation = useMutation(
    (id) => api.delete(`/material-conversion-rules/${id}`),
    {
      onSuccess: () => {
        toast.success('Aturan konversi berhasil dihapus');
        queryClient.invalidateQueries(['material-conversion-rules']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal menghapus aturan konversi');
      }
    }
  );

  const rules = rulesData?.data?.rules || [];
  const presets = presetsData?.data?.presets || [];

  const materialTypes = [
    { value: '', label: 'Semua Jenis' },
    { value: 'brick', label: 'Bata/Batako' },
    { value: 'tile', label: 'Keramik/Granit' },
    { value: 'aggregate', label: 'Agregat (Pasir/Batu)' },
    { value: 'powder', label: 'Serbuk (Semen/dll)' },
    { value: 'liquid', label: 'Cairan (Cat/dll)' },
    { value: 'steel', label: 'Besi/Logam' },
    { value: 'other', label: 'Lainnya' }
  ];

  const baseUnits = ['kg', 'm', 'm2', 'm3', 'liter', 'pcs'];

  const resetRuleForm = () => {
    setRuleFormData({
      rule_name: '',
      material_pattern: '',
      unit_pattern: '',
      conversion_factor: '',
      base_unit: '',
      conversion_description: '',
      material_type: '',
      job_category_pattern: '',
      priority: '100',
      notes: ''
    });
    setSelectedRule(null);
    setShowRuleForm(false);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setRuleFormData({
      rule_name: rule.rule_name || '',
      material_pattern: rule.material_pattern || '',
      unit_pattern: rule.unit_pattern || '',
      conversion_factor: rule.conversion_factor?.toString() || '',
      base_unit: rule.base_unit || '',
      conversion_description: rule.conversion_description || '',
      material_type: rule.material_type || '',
      job_category_pattern: rule.job_category_pattern || '',
      priority: rule.priority?.toString() || '100',
      notes: rule.notes || ''
    });
    setShowRuleForm(true);
  };

  const handleDeleteRule = (rule) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aturan "${rule.rule_name}"?`)) {
      deleteRuleMutation.mutate(rule.id);
    }
  };

  const handleSubmitRule = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...ruleFormData,
      conversion_factor: parseFloat(ruleFormData.conversion_factor),
      priority: parseInt(ruleFormData.priority)
    };

    if (selectedRule) {
      updateRuleMutation.mutate({
        id: selectedRule.id,
        data: submitData
      });
    } else {
      createRuleMutation.mutate(submitData);
    }
  };

  const handleApplyPreset = (preset) => {
    setRuleFormData(prev => ({
      ...prev,
      rule_name: preset.preset_name,
      conversion_factor: preset.conversion_factor.toString(),
      base_unit: preset.base_unit,
      conversion_description: preset.conversion_description,
      material_type: preset.material_type || '',
      priority: '50' // Higher priority for presets
    }));
    setShowPresets(false);
    toast.success('Preset diterapkan');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Kelola Aturan Konversi Material
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Atur aturan konversi material yang dinamis dan dapat dikonfigurasi
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showRuleForm ? (
            <>
              {/* Search and Filter */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari aturan konversi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedMaterialType}
                  onChange={(e) => setSelectedMaterialType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {materialTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Preset</span>
                </button>
                <button
                  onClick={() => setShowRuleForm(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Aturan</span>
                </button>
              </div>

              {/* Presets Panel */}
              {showPresets && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">Preset Konversi</h4>
                  {isLoadingPresets ? (
                    <div className="text-center py-4">
                      <div className="loading-spinner w-6 h-6 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {presets.map(preset => (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 cursor-pointer transition-colors"
                        >
                          <h5 className="font-medium text-gray-900">{preset.preset_name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{preset.conversion_description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {preset.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              Digunakan {preset.usage_count}x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rules List */}
              <div className="space-y-4">
                {isLoadingRules ? (
                  <div className="text-center py-8">
                    <div className="loading-spinner w-8 h-8 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Memuat aturan konversi...</p>
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Aturan</h4>
                    <p className="text-gray-600 mb-4">
                      Belum ada aturan konversi yang dibuat. Klik "Tambah Aturan" untuk membuat aturan baru.
                    </p>
                  </div>
                ) : (
                  rules.map(rule => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{rule.rule_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rule.material_type === 'brick' ? 'bg-orange-100 text-orange-800' :
                              rule.material_type === 'tile' ? 'bg-purple-100 text-purple-800' :
                              rule.material_type === 'aggregate' ? 'bg-yellow-100 text-yellow-800' :
                              rule.material_type === 'powder' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.material_type || 'Umum'}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Prioritas: {rule.priority}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Pattern Material:</span>
                              <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">{rule.material_pattern}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Pattern Satuan:</span>
                              <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">{rule.unit_pattern}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Konversi:</span>
                              <span className="ml-2 text-blue-600 font-medium">
                                1 {rule.base_unit} = {rule.conversion_factor}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Satuan Dasar:</span>
                              <span className="ml-2">{rule.base_unit}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2">{rule.conversion_description}</p>
                          
                          {rule.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{rule.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit aturan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus aturan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Rule Form */
            <form onSubmit={handleSubmitRule} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {selectedRule ? 'Edit Aturan Konversi' : 'Tambah Aturan Konversi'}
                </h4>
                <button
                  type="button"
                  onClick={resetRuleForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Aturan *
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.rule_name}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                    required
                    placeholder="Contoh: Semen Portland 40kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Material
                  </label>
                  <select
                    value={ruleFormData.material_type}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, material_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Pilih Jenis Material</option>
                    {materialTypes.slice(1).map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pattern Material * 
                    <span className="text-xs text-gray-500">(regex atau keyword)</span>
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.material_pattern}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, material_pattern: e.target.value }))}
                    required
                    placeholder="semen|cement|adamix"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pattern Satuan *
                    <span className="text-xs text-gray-500">(regex atau keyword)</span>
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.unit_pattern}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, unit_pattern: e.target.value }))}
                    required
                    placeholder="sak|zak"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faktor Konversi *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ruleFormData.conversion_factor}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, conversion_factor: e.target.value }))}
                    required
                    placeholder="40.0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan Dasar *
                  </label>
                  <select
                    value={ruleFormData.base_unit}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, base_unit: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Pilih Satuan Dasar</option>
                    {baseUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioritas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={ruleFormData.priority}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, priority: e.target.value }))}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Semakin kecil semakin tinggi prioritas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pattern Job Category
                    <span className="text-xs text-gray-500">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.job_category_pattern}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, job_category_pattern: e.target.value }))}
                    placeholder="struktur|beton"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Konversi *
                </label>
                <input
                  type="text"
                  value={ruleFormData.conversion_description}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, conversion_description: e.target.value }))}
                  required
                  placeholder="1 sak semen = 40 kg (data riset lokal)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={ruleFormData.notes}
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Catatan tambahan tentang aturan ini..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={createRuleMutation.isLoading || updateRuleMutation.isLoading}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {createRuleMutation.isLoading || updateRuleMutation.isLoading
                      ? 'Menyimpan...'
                      : selectedRule ? 'Update Aturan' : 'Simpan Aturan'
                    }
                  </span>
                </button>
                <button
                  type="button"
                  onClick={resetRuleForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialConversionRulesModal;
