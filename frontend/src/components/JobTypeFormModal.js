import React from 'react';
import { X, Save } from 'lucide-react';

const JobTypeFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  categories,
  selectedJobType,
  isLoading
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      unit: '',
      description: '',
      base_productivity: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedJobType ? 'Edit Job Type' : 'Tambah Job Type'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Pilih Kategori</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Job Type *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Contoh: Kolom Struktur K-300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                required
                placeholder="Contoh: m3, m2, m, unit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produktivitas (per hari)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.base_productivity}
                onChange={(e) => setFormData(prev => ({ ...prev, base_productivity: e.target.value }))}
                onWheel={(e) => e.preventDefault()}
                placeholder="Contoh: 3.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Berapa {formData.unit || 'satuan'} yang bisa diselesaikan per hari oleh tim standar
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Deskripsi singkat tentang jenis pekerjaan ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
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
                    : selectedJobType ? 'Update' : 'Simpan'
                  }
                </span>
              </button>
              <button
                type="button"
                onClick={resetForm}
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

export default JobTypeFormModal;
