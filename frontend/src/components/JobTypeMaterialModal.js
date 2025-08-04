import React, { useState, useEffect } from 'react';
import { X, Save, Package, Plus, Trash2, Search, Edit } from 'lucide-react';
import MaterialConversionModal from './MaterialConversionModal';
import apiService from '../services/api';

const JobTypeMaterialModal = ({
  isOpen,
  onClose,
  onSubmit,
  jobType,
  materials,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    job_type_id: '',
    material_assignments: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    if (jobType && isOpen) {
      
      setFormData({
        job_type_id: jobType.id,
        material_assignments: jobType.material_assignments || []
      });
    }
  }, [jobType, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate that we have material assignments
      if (formData.material_assignments.length === 0) {
        alert('⚠️ Minimal harus ada satu material yang ditambahkan');
        return;
      }

      // Validate each material assignment
      for (let i = 0; i < formData.material_assignments.length; i++) {
        const assignment = formData.material_assignments[i];
        if (!assignment.quantity_per_unit || parseFloat(assignment.quantity_per_unit) <= 0) {
          alert(`⚠️ Kebutuhan per unit untuk ${assignment.material_name} harus diisi dan lebih dari 0`);
          return;
        }
      }

      // Call the parent onSubmit function
      await onSubmit(formData);
      
    } catch (error) {
      console.error('Error submitting material assignments:', error);
      alert(`❌ Gagal menyimpan komposisi material: ${error.message}`);
    }
  };

  const handleClose = () => {
    setFormData({
      job_type_id: '',
      material_assignments: []
    });
    setSearchQuery('');
    setShowMaterialSelector(false);
    setShowMaterialForm(false);
    setSelectedMaterial(null);
    onClose();
  };

  // Material editing handlers
  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setShowMaterialForm(true);
  };

  const handleEditMaterial = (material) => {
    console.log('📝 Opening edit modal for material:', {
      id: material.id,
      name: material.name,
      usage_per_unit: material.usage_per_unit,
      conversion_description: material.conversion_description
    });
    
    // Make sure we're passing the most up-to-date material data
    // Check both materials array and current assignments for the latest data
    const currentMaterial = materials.find(m => m.id === material.id) || material;
    const currentAssignment = formData.material_assignments.find(a => a.material_id === material.id);
    
    // Merge data from both sources to ensure we have the most complete data
    const enrichedMaterial = {
      ...currentMaterial,
      // If assignment has usage_per_unit data, use it
      usage_per_unit: currentAssignment?.usage_per_unit || currentAssignment?.quantity_per_unit || currentMaterial.usage_per_unit || '',
      job_unit: currentAssignment?.job_unit || currentMaterial.job_unit || 'm³',
      conversion_description: currentAssignment?.conversion_description || currentMaterial.conversion_description || '',
      conversion_factor: currentAssignment?.conversion_factor || currentMaterial.conversion_factor || '',
      base_unit: currentAssignment?.base_unit || currentMaterial.base_unit || ''
    };
    
    console.log('📐 Enriched material data for edit:', {
      id: enrichedMaterial.id,
      name: enrichedMaterial.name,
      usage_per_unit: enrichedMaterial.usage_per_unit,
      source: currentAssignment?.usage_per_unit ? 'assignment' : 'material',
      assignment: currentAssignment ? {
        usage_per_unit: currentAssignment.usage_per_unit,
        quantity_per_unit: currentAssignment.quantity_per_unit
      } : null
    });
    
    setSelectedMaterial(enrichedMaterial);
    setShowMaterialForm(true);
  };

  const handleMaterialSubmit = async (materialData) => {
    try {
      let updatedMaterial;
      
      if (selectedMaterial) {
        // Update existing material using apiService
        const result = await apiService.materials.updateMaterial(selectedMaterial.id, materialData);
        updatedMaterial = result.data.material;
        
        // Update the material in the current assignments if it exists
        // CRITICAL FIX: Use submitted data instead of API response for usage_per_unit
        setFormData(prev => ({
          ...prev,
          material_assignments: prev.material_assignments.map(assignment => {
            if (assignment.material_id === selectedMaterial.id) {
              return {
                ...assignment,
                // Use API response for basic material info
                material_name: updatedMaterial.name || materialData.name,
                material_unit: updatedMaterial.unit || materialData.unit,
                material_price: updatedMaterial.price || materialData.price,
                // Use submitted data for conversion fields to ensure they're preserved
                conversion_factor: materialData.conversion_factor || updatedMaterial.conversion_factor || 1,
                base_unit: materialData.base_unit || updatedMaterial.base_unit || updatedMaterial.unit,
                conversion_description: materialData.conversion_description || updatedMaterial.conversion_description || '',
                usage_per_unit: materialData.usage_per_unit || updatedMaterial.usage_per_unit || '',
                job_unit: materialData.job_unit || updatedMaterial.job_unit || 'm³',
                // CRITICAL: Update quantity_per_unit with the submitted usage_per_unit
                quantity_per_unit: materialData.usage_per_unit || updatedMaterial.usage_per_unit || assignment.quantity_per_unit || ''
              };
            }
            return assignment;
          })
        }));
        
        // IMPORTANT: Update the materials array so when modal opens again, it has fresh data
        // This is a direct mutation but necessary for immediate UI update
        if (materials && materials.length > 0) {
          const materialIndex = materials.findIndex(m => m.id === selectedMaterial.id);
          if (materialIndex !== -1) {
            // CRITICAL FIX: Use the original submitted data instead of API response
            // because API response might not include all updated fields
            const originalSubmittedData = materialData; // This contains the actual form data
            
            // Update the material with the submitted data (not API response)
            materials[materialIndex] = { 
              ...materials[materialIndex], 
              // Use original submitted data to ensure values are preserved
              name: originalSubmittedData.name || materials[materialIndex].name,
              usage_per_unit: originalSubmittedData.usage_per_unit || materials[materialIndex].usage_per_unit,
              job_unit: originalSubmittedData.job_unit || materials[materialIndex].job_unit,
              conversion_description: originalSubmittedData.conversion_description || materials[materialIndex].conversion_description,
              conversion_factor: originalSubmittedData.conversion_factor || materials[materialIndex].conversion_factor,
              base_unit: originalSubmittedData.base_unit || materials[materialIndex].base_unit,
              price: originalSubmittedData.price || materials[materialIndex].price,
              supplier: originalSubmittedData.supplier || materials[materialIndex].supplier,
              description: originalSubmittedData.description || materials[materialIndex].description,
              // Also merge any API response data that might be important
              ...updatedMaterial
            };
            
            console.log('🔄 Updated material in materials array with submitted data:', {
              id: selectedMaterial.id,
              name: materials[materialIndex].name,
              usage_per_unit: materials[materialIndex].usage_per_unit,
              conversion_description: materials[materialIndex].conversion_description,
              originalSubmitted: {
                usage_per_unit: originalSubmittedData.usage_per_unit,
                conversion_description: originalSubmittedData.conversion_description
              },
              apiResponse: {
                usage_per_unit: updatedMaterial.usage_per_unit,
                conversion_description: updatedMaterial.conversion_description
              }
            });
          }
        }
        
        console.log('✅ Material updated and assignments refreshed with new data:', {
          name: updatedMaterial.name,
          usage_per_unit: updatedMaterial.usage_per_unit,
          conversion_description: updatedMaterial.conversion_description
        });
      } else {
        // Create new material using apiService
        const result = await apiService.materials.createMaterial(materialData);
        updatedMaterial = result.data.material;
      }

      // Close modal and reset state
      setShowMaterialForm(false);
      setSelectedMaterial(null);
      
      // Show success message
      const action = selectedMaterial ? 'diperbarui' : 'ditambahkan';
      alert(`✅ Material ${updatedMaterial.name} berhasil ${action} dan data komposisi telah diperbarui!`);
      
      // Force refresh of materials data by triggering parent component refresh
      if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/job-type')) {
        // Dispatch custom event to refresh materials
        window.dispatchEvent(new CustomEvent('refreshMaterials', { 
          detail: { updatedMaterial: updatedMaterial } 
        }));
        
        // No need for page refresh since we updated the materials array directly
        console.log('📡 Dispatched refreshMaterials event');
      }
      
      console.log('✅ Material saved successfully and assignments updated');
      
    } catch (error) {
      console.error('Error saving material:', error);
      alert(`❌ Gagal menyimpan material: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleMaterialAssignment = (material) => {
    const existingIndex = formData.material_assignments.findIndex(
      assignment => assignment.material_id === material.id
    );

    if (existingIndex >= 0) {
      // Material already exists, remove it (toggle off)
      setFormData(prev => ({
        ...prev,
        material_assignments: prev.material_assignments.filter((_, i) => i !== existingIndex)
      }));
    } else {
      // Material doesn't exist, add it (toggle on)
      // Use the usage_per_unit from the material if available
      const defaultQuantity = material.usage_per_unit || '';
      
      setFormData(prev => ({
        ...prev,
        material_assignments: [
          ...prev.material_assignments,
          {
            material_id: material.id,
            material_name: material.name,
            material_unit: material.unit,
            material_price: material.price,
            quantity_per_unit: defaultQuantity,
            is_primary: false,
            conversion_factor: material.conversion_factor || 1,
            base_unit: material.base_unit || material.unit,
            conversion_description: material.conversion_description || '',
            usage_per_unit: material.usage_per_unit || '',
            job_unit: material.job_unit || 'm³'
          }
        ]
      }));
    }
    // Don't close the selector, keep it open for multiple selections
  };

  const removeMaterialAssignment = (index) => {
    setFormData(prev => ({
      ...prev,
      material_assignments: prev.material_assignments.filter((_, i) => i !== index)
    }));
  };

  const updateMaterialAssignment = async (index, field, value) => {
    // Update local state immediately for responsive UI
    const updatedAssignments = formData.material_assignments.map((assignment, i) => 
      i === index ? { ...assignment, [field]: value } : assignment
    );

    setFormData(prev => ({
      ...prev,
      material_assignments: updatedAssignments
    }));

    // If this is a quantity_per_unit change, save to database immediately
    if (field === 'quantity_per_unit' && jobType?.id && value !== '') {
      try {
        // Save to database via job type management API
        await apiService.jobTypeManagement.updateMaterialAssignments(jobType.id, updatedAssignments);

        // Show success feedback for quantity changes
        const assignment = updatedAssignments[index];
        console.log(`✅ Kebutuhan ${assignment.material_name} berhasil disimpan: ${value} ${assignment.material_unit}/${jobType.unit}`);
      } catch (error) {
        console.error('Error saving material assignment:', error);
        // Optionally show user-friendly error message
        // toast.error(`Gagal menyimpan perubahan: ${error.message}`);
      }
    }
  };

  const calculateMaterialCost = (assignment) => {
    const quantity = parseFloat(assignment.quantity_per_unit) || 0;
    const price = parseFloat(assignment.material_price) || 0;
    return quantity * price;
  };

  const filteredMaterials = materials?.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Atur Material & Komposisi
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {jobType?.name} - {jobType?.category_name}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-primary-600 mr-2" />
                <h4 className="text-md font-semibold text-gray-900">Komposisi Material</h4>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Material & Konversi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaterialSelector(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pilih Material</span>
                </button>
              </div>
            </div>

            {formData.material_assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Belum ada material yang ditambahkan</p>
                <p className="text-sm">Klik "Tambah Material & Konversi" untuk membuat material baru atau "Pilih Material" untuk memilih dari database</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                        Material & Konversi
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">
                        📐 Kebutuhan per {jobType?.unit}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">
                        Satuan Pasar
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">
                        Satuan Dasar
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">
                        Biaya per {jobType?.unit}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.material_assignments.map((assignment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {/* Material Info & Conversion */}
                        <td className="border border-gray-300 px-3 py-3 align-top">
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm">
                              {assignment.material_name}
                            </h5>
                            <p className="text-xs text-gray-500 mt-1">
                              Rp {parseInt(assignment.material_price).toLocaleString('id-ID')}/{assignment.material_unit}
                              {assignment.conversion_factor && assignment.conversion_factor !== 1 && assignment.base_unit && assignment.base_unit !== assignment.material_unit && (
                                <span className="text-blue-600 ml-1">
                                  (Rp {Math.round(assignment.material_price / assignment.conversion_factor).toLocaleString('id-ID')}/{assignment.base_unit})
                                </span>
                              )}
                            </p>
                            {assignment.conversion_description && (
                              <div className="mt-1">
                                <p className="text-xs text-blue-600 font-medium">
                                  📐 {assignment.conversion_description}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Kebutuhan per Volume Job */}
                        <td className="border border-gray-300 px-3 py-3 text-center align-top">
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <input
                              type="number"
                              step="any"
                              value={assignment.quantity_per_unit}
                              onChange={(e) => updateMaterialAssignment(index, 'quantity_per_unit', e.target.value)}
                              onWheel={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.target.blur();
                              }}
                              onFocus={(e) => e.target.select()}
                              required
                              placeholder="0.0000"
                              className="w-full px-2 py-1 text-sm text-center border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            />
                            <div className="text-xs text-green-600 mt-1">
                              {assignment.material_unit}
                            </div>
                          </div>
                        </td>

                        {/* Satuan Pasar */}
                        <td className="border border-gray-300 px-3 py-3 text-center align-top">
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                            <div className="text-sm font-semibold text-blue-900">
                              1 {assignment.material_unit}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Satuan pembelian
                            </div>
                          </div>
                        </td>

                        {/* Satuan Dasar */}
                        <td className="border border-gray-300 px-3 py-3 text-center align-top">
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                            <div className="text-sm font-semibold text-blue-900">
                              {assignment.conversion_factor || 1} {assignment.base_unit || assignment.material_unit}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {assignment.conversion_factor && assignment.conversion_factor !== 1 
                                ? `1:${assignment.conversion_factor}`
                                : `Sama dengan pasar`
                              }
                            </div>
                          </div>
                        </td>

                        {/* Biaya per Unit */}
                        <td className="border border-gray-300 px-3 py-3 text-center align-top">
                          <div className="bg-primary-50 rounded-lg p-2 border border-primary-200">
                            <div className="text-sm font-medium text-primary-900">
                              Rp {calculateMaterialCost(assignment).toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-primary-600 mt-1">
                              per {jobType?.unit}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="border border-gray-300 px-3 py-3 text-center align-top">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                const material = materials.find(m => m.id === assignment.material_id);
                                if (material) handleEditMaterial(material);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Edit Material & Konversi"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMaterialAssignment(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Hapus Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total Cost Summary */}
            {formData.material_assignments.length > 0 && (
              <div className="border-t pt-4">
                <div className="bg-primary-50 rounded-lg p-4">
                  <h5 className="font-medium text-primary-900 mb-2">Ringkasan Biaya Material</h5>
                  <div className="space-y-2 text-sm">
                    {formData.material_assignments.map((assignment, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-primary-700">
                          {assignment.material_name} {assignment.is_primary && '(Utama)'}
                        </span>
                        <span className="font-medium text-primary-900">
                          Rp {calculateMaterialCost(assignment).toLocaleString('id-ID')}/{jobType?.unit}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-primary-200 pt-2 flex justify-between font-semibold">
                      <span className="text-primary-900">Total Material per {jobType?.unit}:</span>
                      <span className="text-primary-900">
                        Rp {formData.material_assignments.reduce((total, assignment) => 
                          total + calculateMaterialCost(assignment), 0
                        ).toLocaleString('id-ID')}
                      </span>
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
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isLoading ? 'Menyimpan...' : 'Simpan Komposisi Material'}
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

      {/* Material Selector Modal */}
      {showMaterialSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-gray-900">Pilih Material</h4>
                  <span className="text-sm text-gray-500">
                    ({formData.material_assignments.length} dipilih)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMaterialSelector(false)}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => setShowMaterialSelector(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari material..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMaterials.map((material) => {
                  const isAdded = formData.material_assignments.some(
                    assignment => assignment.material_id === material.id
                  );
                  
                  return (
                    <div
                      key={material.id}
                      onClick={() => toggleMaterialAssignment(material)}
                      className={`p-3 border rounded-lg transition-all cursor-pointer ${
                        isAdded 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {isAdded ? (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                <Plus className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className={`font-medium ${isAdded ? 'text-green-900' : 'text-gray-900'}`}>
                              {material.name}
                              {isAdded && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Ditambahkan
                                </span>
                              )}
                            </h5>
                            <p className="text-sm text-gray-600">
                              Rp {parseInt(material.price).toLocaleString('id-ID')}/{material.unit}
                              {material.conversion_factor && material.conversion_factor !== 1 && material.base_unit && material.base_unit !== material.unit && (
                                <span className="text-blue-600 ml-2">
                                  (Rp {Math.round(material.price / material.conversion_factor).toLocaleString('id-ID')}/{material.base_unit})
                                </span>
                              )}
                            </p>
                            {material.conversion_description && (
                              <div className="mt-1">
                                <p className="text-xs text-blue-600 font-medium">
                                  📐 {material.conversion_description}
                                </p>
                                {material.base_unit && material.base_unit !== material.unit && (
                                  <p className="text-xs text-green-600">
                                    Kalkulasi dalam: {material.base_unit}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {isAdded ? (
                          <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredMaterials.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada material yang ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Material Form Modal */}
      <MaterialConversionModal
        isOpen={showMaterialForm}
        onClose={() => {
          setShowMaterialForm(false);
          setSelectedMaterial(null);
        }}
        onSubmit={handleMaterialSubmit}
        material={selectedMaterial}
        isLoading={false}
      />
    </div>
  );
};

export default JobTypeMaterialModal;
