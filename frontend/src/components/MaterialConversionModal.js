import React, { useState, useEffect } from 'react';
import { X, Save, Lightbulb, Calculator, Settings } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../services/api';

const MaterialConversionModal = ({
  isOpen,
  onClose,
  onSubmit,
  material,
  isLoading
}) => {
  // Fetch existing units from database
  const { data: materialsData, isLoading: isLoadingUnits } = useQuery(
    ['materials-units'],
    () => api.get('/materials', { params: { limit: 500 } }),
    {
      enabled: isOpen,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch conversion rules from database
  const { data: conversionRulesData, isLoading: isLoadingRules } = useQuery(
    ['conversion-rules'],
    () => api.get('/material-conversion-rules?active_only=true'),
    {
      enabled: isOpen,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.warn('Failed to fetch conversion rules from database:', error);
      }
    }
  );

  // Extract unique units
  const existingUnits = React.useMemo(() => {
    if (!materialsData?.data?.materials) return [];
    const units = materialsData.data.materials
      .map(m => m.unit?.trim())
      .filter(Boolean);
    return [...new Set(units)].sort();
  }, [materialsData]);

  // Extract conversion rules - ONLY from database, no static data
  const conversionRules = React.useMemo(() => {
    if (!conversionRulesData?.data?.rules) return [];
    return conversionRulesData.data.rules.sort((a, b) => a.priority - b.priority);
  }, [conversionRulesData]);

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    conversion_factor: '',
    base_unit: '',
    conversion_description: '',
    supplier: '',
    description: '',
    usage_per_unit: '',
    job_unit: 'm³'
  });

  const [suggestion, setSuggestion] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showRulesManager, setShowRulesManager] = useState(false);
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    material_pattern: '',
    unit_pattern: '',
    conversion_factor: '',
    base_unit: '',
    conversion_description: '',
    priority: '10',
    notes: ''
  });

  // Auto-detect material type and suggest conversion using database rules
  const detectAndSuggest = async () => {
    const materialName = formData.name.toLowerCase();
    const unit = formData.unit.toLowerCase();
    
    if (!materialName || !unit || conversionRules.length === 0) return;

    // Check each conversion rule from database
    for (const rule of conversionRules) {
      const nameMatch = materialName.includes(rule.material_pattern.toLowerCase());
      const unitMatch = unit.includes(rule.unit_pattern.toLowerCase());
      
      if (nameMatch && unitMatch) {
        let suggestionData = {
          conversion_factor: parseFloat(rule.conversion_factor),
          base_unit: rule.base_unit,
          conversion_description: rule.conversion_description,
          rule_name: rule.rule_name,
          material_type: rule.material_type
        };

        // Add extra info from conversion_data if available
        if (rule.conversion_data) {
          try {
            const data = typeof rule.conversion_data === 'string' 
              ? JSON.parse(rule.conversion_data) 
              : rule.conversion_data;
            
            if (data.research_data) {
              suggestionData.extra_info = 'Berdasarkan data riset lokal';
              
              // Add specific usage info
              if (data.usage_per_m3) {
                const grades = Object.keys(data.usage_per_m3);
                suggestionData.extra_info += ` - Tersedia untuk ${grades.join(', ')}`;
              }
              
              if (data.specific_usage?.granite_per_m2) {
                suggestionData.extra_info += ` - Kebutuhan: ${data.specific_usage.granite_per_m2} m³/m² granite`;
              }
              
              if (data.sizes) {
                const sizes = Object.keys(data.sizes);
                suggestionData.extra_info += ` - Ukuran tersedia: ${sizes.join(', ')}`;
              }
            }
          } catch (e) {
            console.warn('Error parsing conversion_data:', e);
          }
        }

        setSuggestion({
          type: rule.material_type || 'general',
          rule_id: rule.id,
          ...suggestionData
        });
        setShowSuggestion(true);
        return;
      }
    }
    
    // No match found
    setSuggestion(null);
    setShowSuggestion(false);
  };

  // Apply suggestion
  const applySuggestion = () => {
    if (suggestion) {
      setFormData(prev => ({
        ...prev,
        conversion_factor: suggestion.conversion_factor.toString(),
        base_unit: suggestion.base_unit,
        conversion_description: suggestion.conversion_description
      }));
      setShowSuggestion(false);
    }
  };

  // Handle adding new conversion rule
  const handleAddRule = async (e) => {
    e.preventDefault();
    setIsAddingRule(true);

    try {
      const response = await api.post('/material-conversion-rules', {
        rule_name: newRule.rule_name,
        material_pattern: newRule.material_pattern,
        unit_pattern: newRule.unit_pattern,
        conversion_factor: parseFloat(newRule.conversion_factor),
        base_unit: newRule.base_unit,
        conversion_description: newRule.conversion_description,
        priority: parseInt(newRule.priority) || 10,
        notes: newRule.notes || null
      });

      if (response.data.success) {
        // Reset form
        setNewRule({
          rule_name: '',
          material_pattern: '',
          unit_pattern: '',
          conversion_factor: '',
          base_unit: '',
          conversion_description: '',
          priority: '10',
          notes: ''
        });
        setShowAddRuleForm(false);
        
        // Refresh conversion rules
        // Force refetch by invalidating the query
        window.location.reload(); // Simple refresh for now
        
        alert('✅ Aturan konversi berhasil ditambahkan!');
      }
    } catch (error) {
      console.error('Error adding conversion rule:', error);
      alert('❌ Gagal menambah aturan konversi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsAddingRule(false);
    }
  };

  // Auto-detect when name or unit changes
  useEffect(() => {
    const timer = setTimeout(() => {
      detectAndSuggest();
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timer);
  }, [formData.name, formData.unit, conversionRules]);

  // Initialize form data
  useEffect(() => {
    if (material) {
      console.log('🔄 Initializing MaterialConversionModal with material data:', {
        id: material.id,
        name: material.name,
        usage_per_unit: material.usage_per_unit,
        conversion_description: material.conversion_description,
        fullMaterial: material
      });
      
      setFormData({
        name: material.name || '',
        unit: material.unit || '',
        price: material.price || '',
        conversion_factor: material.conversion_factor || '',
        base_unit: material.base_unit || '',
        conversion_description: material.conversion_description || '',
        supplier: material.supplier || '',
        description: material.description || '',
        // CRITICAL FIX: Ensure usage_per_unit is properly loaded
        usage_per_unit: material.usage_per_unit || material.quantity_per_unit || '',
        job_unit: material.job_unit || 'm³'
      });
      
      console.log('📐 Form data initialized with usage_per_unit:', {
        usage_per_unit: material.usage_per_unit || material.quantity_per_unit || '',
        source: material.usage_per_unit ? 'usage_per_unit' : material.quantity_per_unit ? 'quantity_per_unit' : 'empty'
      });
    } else {
      console.log('🔄 Initializing MaterialConversionModal for new material');
      setFormData({
        name: '',
        unit: '',
        price: '',
        conversion_factor: '',
        base_unit: '',
        conversion_description: '',
        supplier: '',
        description: '',
        usage_per_unit: '',
        job_unit: 'm³'
      });
    }
    setSuggestion(null);
    setShowSuggestion(false);
  }, [material, isOpen]); // Added isOpen dependency to re-initialize when modal opens

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name || !formData.unit || !formData.price) {
        alert('⚠️ Nama material, satuan, dan harga harus diisi');
        return;
      }

      if (parseFloat(formData.price) <= 0) {
        alert('⚠️ Harga harus lebih dari 0');
        return;
      }

      // Validate conversion data if provided
      if (formData.conversion_factor && parseFloat(formData.conversion_factor) <= 0) {
        alert('⚠️ Faktor konversi harus lebih dari 0');
        return;
      }

      // Ensure usage_per_unit is included in the submission data
      const submissionData = {
        ...formData,
        // Make sure usage_per_unit is properly included
        usage_per_unit: formData.usage_per_unit || '',
        job_unit: formData.job_unit || 'm³',
        // Ensure conversion fields are properly formatted
        conversion_factor: formData.conversion_factor ? parseFloat(formData.conversion_factor) : null,
        base_unit: formData.base_unit || formData.unit,
        conversion_description: formData.conversion_description || ''
      };

      console.log('📐 Submitting material data:', {
        id: material?.id,
        name: submissionData.name,
        usage_per_unit: submissionData.usage_per_unit,
        conversion_description: submissionData.conversion_description,
        isUpdate: !!material
      });

      // Call the parent onSubmit function
      await onSubmit(submissionData);
      
      console.log('✅ Material submission completed successfully');
      
    } catch (error) {
      console.error('❌ Error submitting material data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`❌ Gagal menyimpan material: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      unit: '',
      price: '',
      conversion_factor: '',
      base_unit: '',
      conversion_description: '',
      supplier: '',
      description: '',
      usage_per_unit: '',
      job_unit: 'm³'
    });
    setSuggestion(null);
    setShowSuggestion(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {material ? 'Edit Material & Konversi' : 'Tambah Material & Konversi'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Masukkan nama material dan satuan, sistem akan memberikan saran konversi dari database
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowRulesManager(true)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                title="Kelola Aturan Konversi"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
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
                  placeholder="Contoh: Semen Portland, Granit Apolion Black"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Material
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat material"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Multi-Unit Conversion System */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-md font-semibold text-gray-900">Konversi Multi-Satuan</h4>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h5 className="text-sm font-medium text-blue-900 mb-3">
                  📊 Sistem Konversi Multi-Satuan
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-medium text-blue-900 mb-1">1. Satuan Pasar</div>
                    <div className="text-blue-700">Unit pembelian di pasar</div>
                    <div className="text-xs text-blue-600 mt-1">Contoh: sak, truk, dus</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-medium text-blue-900 mb-1">2. Satuan Dasar</div>
                    <div className="text-blue-700">Unit untuk kalkulasi</div>
                    <div className="text-xs text-blue-600 mt-1">Contoh: kg, m³, keping</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-medium text-blue-900 mb-1">3. Kebutuhan Volume</div>
                    <div className="text-blue-700">Kebutuhan per satuan pekerjaan</div>
                    <div className="text-xs text-blue-600 mt-1">Contoh: 0.0250 sak/m³</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Satuan Pasar */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-orange-900 mb-3">
                    🛒 Satuan Pasar (Market Unit)
                  </h5>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satuan Kemasan *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      required
                      disabled={isLoadingUnits}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">
                        {isLoadingUnits ? 'Memuat satuan...' : 'Pilih Satuan'}
                      </option>
                      {existingUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="font-medium mb-1">Satuan dari Database:</div>
                      <div>• Sistem akan memuat satuan yang tersedia</div>
                      <div>• Pilih sesuai kemasan material Anda</div>
                    </div>
                  </div>
                </div>

                {/* Satuan Dasar */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-green-900 mb-3">
                    ⚖️ Satuan Dasar (Base Unit)
                  </h5>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satuan Dasar Kalkulasi *
                    </label>
                    <input
                      type="text"
                      value={formData.base_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_unit: e.target.value }))}
                      placeholder="kg, m³, keping, liter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Faktor Konversi *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.conversion_factor}
                        onChange={(e) => setFormData(prev => ({ ...prev, conversion_factor: e.target.value }))}
                        onWheel={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.target.blur();
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="1.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        1 {formData.unit} = {formData.conversion_factor || '?'} {formData.base_unit}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="font-medium mb-1">Konversi Dinamis:</div>
                      <div>• Data akan diambil dari database rules</div>
                      <div>• Sistem akan auto-suggest berdasarkan material</div>
                    </div>
                  </div>
                </div>

                {/* Kebutuhan Volume */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-purple-900 mb-3">
                    📐 Kebutuhan per Volume Job
                  </h5>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satuan Pekerjaan
                    </label>
                    <select
                      value={formData.job_unit || 'm³'}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="m³">m³ (Volume)</option>
                      <option value="m²">m² (Area)</option>
                      <option value="m">m (Length)</option>
                    </select>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kebutuhan per Satuan
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.usage_per_unit || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, usage_per_unit: e.target.value }))}
                        onWheel={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.target.blur();
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.0250"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.usage_per_unit && formData.unit && formData.job_unit ? 
                          `${formData.usage_per_unit} ${formData.unit}/${formData.job_unit}` : 
                          'Kebutuhan per satuan pekerjaan'
                        }
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="font-medium mb-1">Contoh Format:</div>
                      <div>• [Jumlah] [Satuan Pasar]/[Satuan Job]</div>
                      <div>• Data akan diambil dari database conversion rules</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Description */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Konversi Lengkap
                </label>
                <input
                  type="text"
                  value={formData.conversion_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, conversion_description: e.target.value }))}
                  placeholder="Contoh: 1 sak = 40 kg, untuk Beton K225 butuh 0.0250 sak/m³"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dynamic Material Information from Database */}
            {formData.name && suggestion && suggestion.conversion_data && (
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  📋 Informasi Material dari Database
                </h4>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">
                    🔍 Data Riset: {suggestion.rule_name}
                  </h5>
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-2">Informasi Konversi:</div>
                    <div>• {suggestion.conversion_description}</div>
                    
                    {suggestion.conversion_data?.usage_per_m3_concrete && (
                      <div className="mt-3">
                        <div className="font-medium mb-1">Kebutuhan per m³ Beton:</div>
                        {Object.entries(suggestion.conversion_data.usage_per_m3_concrete).map(([grade, usage]) => (
                          <div key={grade}>• {grade}: {usage} {formData.unit}/m³</div>
                        ))}
                      </div>
                    )}
                    
                    {suggestion.conversion_data?.specific_usage && (
                      <div className="mt-3">
                        <div className="font-medium mb-1">Kebutuhan Spesifik:</div>
                        {Object.entries(suggestion.conversion_data.specific_usage).map(([key, value]) => (
                          <div key={key}>• {key.replace('_', ' ')}: {value} {formData.base_unit}</div>
                        ))}
                      </div>
                    )}
                    
                    {suggestion.conversion_data?.sizes && (
                      <div className="mt-3">
                        <div className="font-medium mb-1">Ukuran Tersedia:</div>
                        {Object.entries(suggestion.conversion_data.sizes).map(([size, data]) => (
                          <div key={size}>• {size}: {data.pieces} keping, {data.area} m², faktor: {data.factor}</div>
                        ))}
                      </div>
                    )}
                    
                    {suggestion.conversion_data?.research_data && (
                      <div className="mt-3 text-xs text-blue-600">
                        ✅ Data berdasarkan riset lokal
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Auto Suggestion */}
            {showSuggestion && suggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      💡 Saran Konversi dari Database
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Aturan:</strong> {suggestion.rule_name}</p>
                      <p><strong>Konversi:</strong> {suggestion.conversion_description}</p>
                      {suggestion.extra_info && (
                        <p><strong>Info:</strong> {suggestion.extra_info}</p>
                      )}
                      <p className="text-xs text-blue-600">
                        Data dari database conversion rules (ID: {suggestion.rule_id})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Gunakan Saran Ini
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state for rules */}
            {isLoadingRules && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Memuat aturan konversi dari database...</p>
                </div>
              </div>
            )}

            {/* No rules available */}
            {!isLoadingRules && conversionRules.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      💡 Sistem Siap - Tambah Aturan Konversi Manual
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Sistem sudah siap menerima aturan konversi dari database. Anda dapat:
                    </p>
                    <ul className="text-sm text-blue-800 mb-3 space-y-1">
                      <li>• Klik tombol Settings untuk menambah aturan konversi baru</li>
                      <li>• Input manual data riset Anda (semen 40kg, granit dinamis, dll)</li>
                      <li>• Sistem akan otomatis mendeteksi berdasarkan aturan yang Anda buat</li>
                    </ul>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowRulesManager(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + Tambah Aturan Konversi
                      </button>
                      <span className="text-xs text-blue-600">atau input manual di form di bawah</span>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Submit Buttons */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

          {/* Conversion Rules Manager Modal */}
          {showRulesManager && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Kelola Aturan Konversi Material
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Tambah, edit, atau hapus aturan konversi material dari database
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRulesManager(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Rules List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium text-gray-900">
                        Aturan Konversi Aktif ({conversionRules.length})
                      </h4>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => setShowAddRuleForm(true)}
                      >
                        + Tambah Aturan Baru
                      </button>
                    </div>

                    {/* Add New Rule Form */}
                    {showAddRuleForm && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h5 className="font-medium text-gray-900 mb-4">Tambah Aturan Konversi Baru</h5>
                        <form onSubmit={handleAddRule} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Aturan *
                              </label>
                              <input
                                type="text"
                                value={newRule.rule_name}
                                onChange={(e) => setNewRule(prev => ({ ...prev, rule_name: e.target.value }))}
                                placeholder="Contoh: Semen Portland 40kg"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pattern Material *
                              </label>
                              <input
                                type="text"
                                value={newRule.material_pattern}
                                onChange={(e) => setNewRule(prev => ({ ...prev, material_pattern: e.target.value }))}
                                placeholder="semen|cement|adamix"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pattern Satuan *
                              </label>
                              <input
                                type="text"
                                value={newRule.unit_pattern}
                                onChange={(e) => setNewRule(prev => ({ ...prev, unit_pattern: e.target.value }))}
                                placeholder="sak|zak"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Faktor Konversi *
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={newRule.conversion_factor}
                                onChange={(e) => setNewRule(prev => ({ ...prev, conversion_factor: e.target.value }))}
                                placeholder="40"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Satuan Dasar Pekerjaan *
                              </label>
                              <input
                                type="text"
                                value={newRule.base_unit}
                                onChange={(e) => setNewRule(prev => ({ ...prev, base_unit: e.target.value }))}
                                placeholder="m2, m3, kg, liter"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Satuan untuk kalkulasi pekerjaan
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                              </label>
                              <input
                                type="number"
                                value={newRule.priority}
                                onChange={(e) => setNewRule(prev => ({ ...prev, priority: e.target.value }))}
                                placeholder="10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Deskripsi Konversi *
                            </label>
                            <input
                              type="text"
                              value={newRule.conversion_description}
                              onChange={(e) => setNewRule(prev => ({ ...prev, conversion_description: e.target.value }))}
                              placeholder="1 sak semen = 40 kg (data riset lokal)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Catatan
                            </label>
                            <textarea
                              value={newRule.notes}
                              onChange={(e) => setNewRule(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Berdasarkan riset lokal..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              type="submit"
                              disabled={isAddingRule}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                              {isAddingRule ? 'Menyimpan...' : 'Simpan Aturan'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddRuleForm(false);
                                setNewRule({
                                  rule_name: '',
                                  material_pattern: '',
                                  unit_pattern: '',
                                  conversion_factor: '',
                                  base_unit: '',
                                  conversion_description: '',
                                  priority: '10',
                                  notes: ''
                                });
                              }}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {isLoadingRules ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Memuat aturan konversi...</p>
                      </div>
                    ) : conversionRules.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Belum ada aturan konversi di database</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Jalankan script SQL untuk menambah data default
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {conversionRules.map((rule) => (
                          <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{rule.rule_name}</h5>
                                <p className="text-sm text-gray-600 mt-1">
                                  {rule.conversion_description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>Pattern: {rule.material_pattern} + {rule.unit_pattern}</span>
                                  <span>Factor: {rule.conversion_factor}</span>
                                  <span>Base: {rule.base_unit}</span>
                                  <span>Priority: {rule.priority}</span>
                                </div>
                                {rule.notes && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    📝 {rule.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                  onClick={() => {
                                    // TODO: Implement edit rule
                                    alert(`Edit rule: ${rule.rule_name}`);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                                  onClick={() => {
                                    // TODO: Implement delete rule
                                    if (window.confirm(`Hapus aturan "${rule.rule_name}"?`)) {
                                      alert('Fitur hapus akan segera tersedia');
                                    }
                                  }}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          💡 Tip: Aturan dengan priority lebih kecil akan diprioritaskan
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowRulesManager(false)}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialConversionModal;
