import React from 'react';
import { X } from 'lucide-react';

const CategoryFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isLoading, 
  isEditing = false 
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Kategori' : 'Tambah Kategori'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kategori *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Pekerjaan Struktur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi singkat tentang kategori pekerjaan ini..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <select
              id="icon"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Pilih Icon</option>
              <option value="preparation">🔧 Persiapan (Wrench)</option>
              <option value="foundation">🛡️ Pondasi (Shield)</option>
              <option value="structure">🏢 Struktur (Building)</option>
              <option value="masonry">🔨 Pasangan (Hammer)</option>
              <option value="roof">🏠 Atap (Home)</option>
              <option value="ceiling">📋 Plafon (Layers)</option>
              <option value="door-window">⚙️ Pintu & Jendela (Settings)</option>
              <option value="painting">🎨 Pengecatan (PaintBucket)</option>
              <option value="electrical">⚡ Listrik (Zap)</option>
              <option value="plumbing">💧 Plumbing (Droplets)</option>
              <option value="excavation">⛏️ Galian (Pickaxe)</option>
              <option value="concrete">🧱 Beton (Brick)</option>
              <option value="steel">🔩 Baja (Bolt)</option>
              <option value="wood">🪵 Kayu (Wood)</option>
              <option value="tile">🔲 Keramik (Square)</option>
              <option value="glass">🪟 Kaca (Window)</option>
              <option value="insulation">🧊 Isolasi (Snowflake)</option>
              <option value="ventilation">🌪️ Ventilasi (Wind)</option>
              <option value="security">🔒 Keamanan (Lock)</option>
              <option value="landscape">🌳 Lansekap (Tree)</option>
              <option value="road">🛣️ Jalan (Road)</option>
              <option value="drainage">🚰 Drainase (Pipe)</option>
              <option value="fire-safety">🧯 Proteksi Kebakaran (Fire Extinguisher)</option>
              <option value="hvac">❄️ HVAC (Cooling)</option>
              <option value="solar">☀️ Solar (Sun)</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
