import React, { useState, useEffect } from 'react';
import { X, Save, Package, Plus, Trash2, Search } from 'lucide-react';

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

  useEffect(() => {
    if (jobType && isOpen) {
      
      setFormData({
        job_type_id: jobType.id,
        material_assignments: jobType.material_assignments || []
      });
    }
  }, [jobType, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      job_type_id: '',
      material_assignments: []
    });
    setSearchQuery('');
    setShowMaterialSelector(false);
    onClose();
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
      setFormData(prev => ({
        ...prev,
        material_assignments: [
          ...prev.material_assignments,
          {
            material_id: material.id,
            material_name: material.name,
            material_unit: material.unit,
            material_price: material.price,
            quantity_per_unit: '',
            is_primary: false,
            conversion_factor: material.conversion_factor || 1,
            base_unit: material.base_unit || material.unit,
            conversion_description: material.conversion_description || ''
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

  const updateMaterialAssignment = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      material_assignments: prev.material_assignments.map((assignment, i) => 
        i === index ? { ...assignment, [field]: value } : assignment
      )
    }));
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
              <button
                type="button"
                onClick={() => setShowMaterialSelector(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Material</span>
              </button>
            </div>

            {formData.material_assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Belum ada material yang ditambahkan</p>
                <p className="text-sm">Klik "Tambah Material" untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.material_assignments.map((assignment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {assignment.material_name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Harga: Rp {parseInt(assignment.material_price).toLocaleString('id-ID')}/{assignment.material_unit}
                          {assignment.conversion_factor && assignment.conversion_factor !== 1 && assignment.base_unit && assignment.base_unit !== assignment.material_unit && (
                            <span className="text-blue-600 ml-2">
                              (Rp {Math.round(assignment.material_price / assignment.conversion_factor).toLocaleString('id-ID')}/{assignment.base_unit})
                            </span>
                          )}
                        </p>
                        {assignment.conversion_description && (
                          <div className="mt-1">
                            <p className="text-xs text-blue-600 font-medium">
                              📐 Konversi: {assignment.conversion_description}
                            </p>
                            {assignment.base_unit && assignment.base_unit !== assignment.material_unit && (
                              <p className="text-xs text-green-600">
                                Satuan kalkulasi: {assignment.base_unit}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={assignment.is_primary}
                            onChange={(e) => updateMaterialAssignment(index, 'is_primary', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Material Utama</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeMaterialAssignment(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kebutuhan per {jobType?.unit || 'unit'} *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={assignment.quantity_per_unit}
                          onChange={(e) => updateMaterialAssignment(index, 'quantity_per_unit', e.target.value)}
                          onWheel={(e) => e.preventDefault()}
                          required
                          placeholder="0.0000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {assignment.material_unit} per {jobType?.unit}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kebutuhan Dasar
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <span className="text-sm font-medium">
                            {(parseFloat(assignment.quantity_per_unit) || 0).toFixed(4)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            {assignment.material_unit}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Tanpa faktor pemborosan
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Biaya per {jobType?.unit}
                        </label>
                        <div className="px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                          <span className="text-sm font-medium text-primary-900">
                            Rp {calculateMaterialCost(assignment).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Harga × kebutuhan dasar
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 <strong>Catatan:</strong> Faktor pemborosan akan dihitung otomatis oleh kalkulator berdasarkan jenis material dan kondisi proyek. 
                        Biaya di atas adalah kebutuhan dasar tanpa pemborosan.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700">
                        🎯 <strong>Material Utama:</strong> Material yang dicentang sebagai "Material Utama" akan otomatis dimuat di kalkulator. 
                        Material lainnya dapat ditambahkan secara manual sesuai kebutuhan.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        ⚙️ <strong>Opsi Kalkulator:</strong> User dapat memilih "Gunakan material default" untuk menggunakan material sistem + material utama ini, 
                        atau menonaktifkannya untuk hanya menggunakan material yang dipilih manual.
                      </p>
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
    </div>
  );
};

export default JobTypeMaterialModal;
