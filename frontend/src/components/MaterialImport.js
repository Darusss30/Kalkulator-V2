import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const MaterialImport = ({ onClose, onImportSuccess }) => {
  const [step, setStep] = useState(1); // 1: paste, 2: preview, 3: import, 4: results
  const [pastedData, setPastedData] = useState('');
  const [parsedMaterials, setParsedMaterials] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Parse pasted data mutation
  const parseMutation = useMutation(
    (data) => apiService.materials.parsePastedData(data),
    {
      onSuccess: (response) => {
        const { parsed_materials, errors } = response.data;
        setParsedMaterials(parsed_materials);
        setParseErrors(errors);
        setStep(2);
        
        if (errors.length > 0) {
          toast.error(`${errors.length} baris memiliki error. Periksa data Anda.`);
        } else {
          toast.success(`${parsed_materials.length} material berhasil diparse.`);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal memparse data');
      }
    }
  );

  // Bulk import mutation
  const importMutation = useMutation(
    ({ materials, updateExisting }) => apiService.materials.bulkImport(materials, updateExisting),
    {
      onSuccess: (response) => {
        setImportResults(response.data);
        setStep(4);
        
        const { summary } = response.data;
        toast.success(
          `Import selesai! ${summary.successful_imports} berhasil, ${summary.updates} diupdate, ${summary.errors} error.`
        );
        
        if (onImportSuccess) {
          onImportSuccess(response.data);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengimport material');
      }
    }
  );

  const handleParse = () => {
    if (!pastedData.trim()) {
      toast.error('Silakan paste data terlebih dahulu');
      return;
    }
    parseMutation.mutate(pastedData);
  };

  const handleImport = () => {
    if (parsedMaterials.length === 0) {
      toast.error('Tidak ada material untuk diimport');
      return;
    }
    
    setStep(3);
    importMutation.mutate({
      materials: parsedMaterials,
      updateExisting: updateExisting
    });
  };

  const handleReset = () => {
    setStep(1);
    setPastedData('');
    setParsedMaterials([]);
    setParseErrors([]);
    setImportResults(null);
    setUpdateExisting(false);
  };

  const downloadTemplate = () => {
    const template = `NO.\tNAMA BARANG\tQTY\tSATUAN\tHARGA
1\tSemen Portland\t1\tzak\t65000
2\tPasir Beton\t1\tm3\t350000
3\tKerikil Split\t1\tm3\t400000`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_material.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Import Material</h2>
                <p className="text-blue-100">
                  {step === 1 && 'Paste data dari Excel'}
                  {step === 2 && 'Preview dan validasi data'}
                  {step === 3 && 'Mengimport material...'}
                  {step === 4 && 'Hasil import'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Step 1: Paste Data */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Format Data</h3>
                    <p className="text-blue-800 text-sm mb-3">
                      Copy data dari Excel dengan format: <strong>NO. | NAMA BARANG | QTY | SATUAN | HARGA</strong>
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Paste Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Data Excel
                </label>
                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder="Paste data dari Excel di sini...&#10;&#10;Contoh:&#10;1	Semen Portland	1	zak	65000&#10;2	Pasir Beton	1	m3	350000"
                  className="w-full h-64 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Pilih data di Excel, copy (Ctrl+C), lalu paste (Ctrl+V) di area ini
                </p>
              </div>

              {/* Parse Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleParse}
                  disabled={!pastedData.trim() || parseMutation.isLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {parseMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Memparse...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Parse Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{parsedMaterials.length}</div>
                  <div className="text-sm text-green-800">Material Valid</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{parseErrors.length}</div>
                  <div className="text-sm text-red-800">Error</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedMaterials.reduce((sum, m) => sum + m.price, 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-blue-800">Total Harga</div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Update material yang sudah ada
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Jika dicentang, material dengan nama yang sama akan diupdate. Jika tidak, akan dilewati.
                </p>
              </div>

              {/* Errors */}
              {parseErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error ({parseErrors.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {parseErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800 bg-red-100 rounded p-2">
                        <strong>Baris {error.row}:</strong> {error.error}
                        {error.line && <div className="font-mono text-xs mt-1 opacity-75">{error.line}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedMaterials.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Preview Material ({parsedMaterials.length})</h3>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Nama</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Satuan</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Harga</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedMaterials.map((material, index) => (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="px-4 py-2 font-medium">{material.name}</td>
                            <td className="px-4 py-2">{material.unit}</td>
                            <td className="px-4 py-2 text-right font-mono">
                              {material.price.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-2 text-gray-600">{material.supplier || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={handleReset}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleImport}
                  disabled={parsedMaterials.length === 0}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import {parsedMaterials.length} Material</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 3 && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mengimport Material...</h3>
              <p className="text-gray-600">Mohon tunggu, sedang memproses {parsedMaterials.length} material</p>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResults && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.summary.successful_imports}
                  </div>
                  <div className="text-sm text-green-800">Berhasil</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResults.summary.updates}
                  </div>
                  <div className="text-sm text-blue-800">Diupdate</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResults.summary.skipped}
                  </div>
                  <div className="text-sm text-yellow-800">Dilewati</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResults.summary.errors}
                  </div>
                  <div className="text-sm text-red-800">Error</div>
                </div>
              </div>

              {/* Success Results */}
              {importResults.results.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Material Berhasil Diimport ({importResults.results.success.length})
                  </h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResults.results.success.map((item, index) => (
                      <div key={index} className="text-sm text-green-800">
                        <strong>{item.name}</strong> - {item.unit} - Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Results */}
              {importResults.results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error Import ({importResults.results.errors.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {importResults.results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800 bg-red-100 rounded p-2">
                        <strong>Baris {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={handleReset}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Import Lagi</span>
                </button>
                <button
                  onClick={onClose}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Selesai</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialImport;
