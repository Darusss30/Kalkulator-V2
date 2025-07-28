import React, { useState, useEffect } from 'react';
import { X, Save, Users, Plus, Trash2 } from 'lucide-react';

const JobTypeLaborModal = ({
  isOpen,
  onClose,
  onSubmit,
  jobType,
  laborRates,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    job_type_id: '',
    labor_assignments: []
  });
  
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (jobType && isOpen) {
      setFormData({
        job_type_id: jobType.id,
        labor_assignments: jobType.labor_assignments || [
          {
            worker_type: 'tukang',
            daily_rate: '',
            skill_level: 'standard',
            quantity: 1,
            productivity_factor: 1.0
          }
        ]
      });
    }
  }, [jobType, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data before submission
    const errors = validateFormData();
    if (errors.length > 0) {
      // Show validation errors
      setValidationErrors(errors);
      errors.forEach(error => {
      });
      return;
    }
    
    // Clear validation errors if validation passes
    setValidationErrors([]);
    
    // Convert data types and clean up before sending
    const cleanedData = {
      job_type_id: parseInt(formData.job_type_id),
      labor_assignments: formData.labor_assignments.map(assignment => ({
        worker_type: assignment.worker_type,
        skill_level: assignment.skill_level || 'standard',
        daily_rate: parseFloat(assignment.daily_rate) || 0,
        quantity: parseInt(assignment.quantity) || 1,
        productivity_factor: parseFloat(assignment.productivity_factor) || 1.0
      }))
    };
    
    onSubmit(cleanedData);
  };

  const validateFormData = () => {
    const errors = [];
    
    if (!formData.job_type_id) {
      errors.push('Job type ID is required');
    }
    
    if (!formData.labor_assignments || formData.labor_assignments.length === 0) {
      errors.push('At least one labor assignment is required');
    }
    
    formData.labor_assignments.forEach((assignment, index) => {
      if (!assignment.worker_type) {
        errors.push(`Worker type is required for assignment ${index + 1}`);
      }
      
      if (!assignment.daily_rate || parseFloat(assignment.daily_rate) <= 0) {
        errors.push(`Valid daily rate is required for assignment ${index + 1}`);
      }
      
      if (!assignment.quantity || parseInt(assignment.quantity) <= 0) {
        errors.push(`Valid quantity is required for assignment ${index + 1}`);
      }
      
      if (!assignment.productivity_factor || parseFloat(assignment.productivity_factor) <= 0) {
        errors.push(`Valid productivity factor is required for assignment ${index + 1}`);
      }
    });
    
    // Check for duplicate worker types with same skill level
    const combinations = formData.labor_assignments.map(a => `${a.worker_type}-${a.skill_level}`);
    const duplicates = combinations.filter((item, index) => combinations.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push('Duplicate worker type and skill level combinations are not allowed');
    }
    
    return errors;
  };

  const handleClose = () => {
    setFormData({
      job_type_id: '',
      labor_assignments: []
    });
    setValidationErrors([]);
    onClose();
  };

  const addLaborAssignment = () => {
    setFormData(prev => ({
      ...prev,
      labor_assignments: [
        ...prev.labor_assignments,
        {
          worker_type: 'pekerja',
          daily_rate: '',
          skill_level: 'standard',
          quantity: 1,
          productivity_factor: 1.0
        }
      ]
    }));
  };

  const removeLaborAssignment = (index) => {
    setFormData(prev => ({
      ...prev,
      labor_assignments: prev.labor_assignments.filter((_, i) => i !== index)
    }));
  };

  const updateLaborAssignment = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      labor_assignments: prev.labor_assignments.map((assignment, i) => {
        if (i === index) {
          let updatedValue = value;
          
          // Handle numeric fields
          if (field === 'daily_rate') {
            updatedValue = value.replace(/[^0-9]/g, ''); // Only allow numbers
          } else if (field === 'quantity') {
            updatedValue = Math.max(1, parseInt(value) || 1);
          } else if (field === 'productivity_factor') {
            updatedValue = Math.max(0.1, Math.min(2.0, parseFloat(value) || 1.0));
          }
          
          return { ...assignment, [field]: updatedValue };
        }
        return assignment;
      })
    }));
  };

  const workerTypes = [
    { value: 'tukang', label: 'Tukang' },
    { value: 'pekerja', label: 'Pekerja' },
    { value: 'mandor', label: 'Mandor' },
    { value: 'operator', label: 'Operator' },
    { value: 'helper', label: 'Helper' }
  ];

  const skillLevels = [
    { value: 'standard', label: 'Standard' },
    { value: 'expert', label: 'Ahli' },
    { value: 'senior', label: 'Senior' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Atur Upah Pekerja
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
            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-red-600 text-sm font-bold">!</span>
                  </div>
                  <h5 className="text-red-800 font-medium">Kesalahan Validasi</h5>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-primary-600 mr-2" />
                <h4 className="text-md font-semibold text-gray-900">Komposisi Tim Kerja</h4>
              </div>
              <button
                type="button"
                onClick={addLaborAssignment}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pekerja</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.labor_assignments.map((assignment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-900">
                      Pekerja #{index + 1}
                    </h5>
                    {formData.labor_assignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLaborAssignment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Pekerja *
                      </label>
                      <select
                        value={assignment.worker_type}
                        onChange={(e) => updateLaborAssignment(index, 'worker_type', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {workerTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Level Keahlian
                      </label>
                      <select
                        value={assignment.skill_level}
                        onChange={(e) => updateLaborAssignment(index, 'skill_level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {skillLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upah per Hari *
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={assignment.daily_rate}
                        onChange={(e) => updateLaborAssignment(index, 'daily_rate', e.target.value)}
                        onWheel={(e) => e.preventDefault()}
                        required
                        placeholder="150000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah Orang
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={assignment.quantity}
                        onChange={(e) => updateLaborAssignment(index, 'quantity', parseInt(e.target.value))}
                        onWheel={(e) => e.preventDefault()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Faktor Produktivitas
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="2.0"
                        value={assignment.productivity_factor}
                        onChange={(e) => updateLaborAssignment(index, 'productivity_factor', parseFloat(e.target.value))}
                        onWheel={(e) => e.preventDefault()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        1.0 = normal, {'>'}1.0 = lebih produktif
                      </p>
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Biaya per hari: {assignment.quantity} × Rp {parseInt(assignment.daily_rate || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="font-medium text-gray-900">
                        Rp {(assignment.quantity * (parseInt(assignment.daily_rate) || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Cost Summary */}
            <div className="border-t pt-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <h5 className="font-medium text-primary-900 mb-2">Ringkasan Biaya Tenaga Kerja</h5>
                <div className="space-y-2 text-sm">
                  {formData.labor_assignments.map((assignment, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-primary-700">
                        {assignment.quantity} {workerTypes.find(t => t.value === assignment.worker_type)?.label} ({assignment.skill_level})
                      </span>
                      <span className="font-medium text-primary-900">
                        Rp {(assignment.quantity * (parseInt(assignment.daily_rate) || 0)).toLocaleString('id-ID')}/hari
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-primary-200 pt-2 flex justify-between font-semibold">
                    <span className="text-primary-900">Total per Hari:</span>
                    <span className="text-primary-900">
                      Rp {formData.labor_assignments.reduce((total, assignment) => 
                        total + (assignment.quantity * (parseInt(assignment.daily_rate) || 0)), 0
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
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
                  {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan Upah'}
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

export default JobTypeLaborModal;
