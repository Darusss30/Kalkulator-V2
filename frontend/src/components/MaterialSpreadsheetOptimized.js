import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Save, 
  Upload,
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff
} from 'lucide-react';

import apiService from '../services/api';

const MaterialSpreadsheetOptimized = ({ onClose, onImportSuccess }) => {
  const queryClient = useQueryClient();
  
  // Pagination state to avoid PHP max_input_vars limit
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Limit to 25 rows per page
  
  const [materials, setMaterials] = useState(() => {
    // Initialize with limited rows per page
    const initialRows = [];
    for (let i = 1; i <= 25; i++) {
      initialRows.push({
        id: `row-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true,
        isValid: false,
        errors: {}
      });
    }
    return initialRows;
  });
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  
  // New enhanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showValidationErrors, setShowValidationErrors] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [duplicateCheck, setDuplicateCheck] = useState(true);

  // Validation function
  const validateMaterial = (material) => {
    const errors = {};
    let isValid = true;

    if (!material.name.trim()) {
      errors.name = 'Nama material wajib diisi';
      isValid = false;
    }

    if (!material.unit.trim()) {
      errors.unit = 'Satuan wajib diisi';
      isValid = false;
    }

    if (!material.price || isNaN(parseFloat(material.price)) || parseFloat(material.price) <= 0) {
      errors.price = 'Harga harus berupa angka positif';
      isValid = false;
    }

    return { isValid, errors };
  };

  // Check for duplicates
  const checkDuplicates = (materials) => {
    const seen = new Map();
    const duplicates = new Set();

    materials.forEach((material, index) => {
      if (material.name.trim()) {
        const key = `${material.name.trim().toLowerCase()}-${material.unit.trim().toLowerCase()}`;
        if (seen.has(key)) {
          duplicates.add(index);
          duplicates.add(seen.get(key));
        } else {
          seen.set(key, index);
        }
      }
    });

    return duplicates;
  };

  // Filter and sort materials
  const getFilteredAndSortedMaterials = () => {
    let filtered = materials;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = materials.filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortField] || '';
        let bVal = b[sortField] || '';

        if (sortField === 'price') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else {
          aVal = aVal.toString().toLowerCase();
          bVal = bVal.toString().toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filtered;
  };

  // Calculate pagination
  const filteredMaterials = getFilteredAndSortedMaterials();
  const totalPages = Math.ceil(filteredMaterials.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentMaterials = filteredMaterials.slice(startIndex, endIndex);

  // Get validation stats
  const validMaterials = materials.filter(m => m.name.trim() && m.unit.trim() && m.price && !isNaN(parseFloat(m.price)));
  const duplicates = duplicateCheck ? checkDuplicates(materials) : new Set();

  // Bulk import mutation
  const bulkImportMutation = useMutation(
    (materialsData) => apiService.materials.bulkImport(materialsData, true),
    {
      onSuccess: (response) => {
        toast.success(`Import berhasil! ${response.data.summary.successful_imports} material ditambahkan`);
        if (onImportSuccess) onImportSuccess();
        queryClient.invalidateQueries(['materials']);
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal mengimport material');
      }
    }
  );

  // Add new row with validation
  const addNewRow = () => {
    const newId = `new-${Date.now()}`;
    setMaterials(prev => [...prev, {
      id: newId,
      name: '',
      unit: '',
      price: '',
      supplier: '',
      description: '',
      isNew: true,
      isValid: false,
      errors: {}
    }]);
  };

  // Add multiple rows
  const addMultipleRows = (count = 10) => {
    const newRows = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `bulk-${Date.now()}-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true,
        isValid: false,
        errors: {}
      });
    }
    setMaterials(prev => [...prev, ...newRows]);
  };

  // Sort function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Select/deselect rows
  const toggleRowSelection = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Select all visible rows
  const toggleSelectAll = () => {
    if (selectedRows.size === currentMaterials.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = currentMaterials.map((_, index) => startIndex + index);
      setSelectedRows(new Set(allIndices));
    }
  };

  // Delete selected rows
  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return;
    
    const indicesToDelete = Array.from(selectedRows).sort((a, b) => b - a);
    setMaterials(prev => {
      let updated = [...prev];
      indicesToDelete.forEach(index => {
        updated.splice(index, 1);
      });
      return updated;
    });
    setSelectedRows(new Set());
    toast.success(`${selectedRows.size} baris berhasil dihapus`);
  };

  // Duplicate selected rows
  const duplicateSelectedRows = () => {
    if (selectedRows.size === 0) return;
    
    const rowsToDuplicate = Array.from(selectedRows).map(index => materials[index]);
    const duplicatedRows = rowsToDuplicate.map((row, index) => ({
      ...row,
      id: `dup-${Date.now()}-${index}`,
      name: `${row.name} (Copy)`,
      isNew: true
    }));
    
    setMaterials(prev => [...prev, ...duplicatedRows]);
    setSelectedRows(new Set());
    toast.success(`${rowsToDuplicate.length} baris berhasil diduplikasi`);
  };

  // Change rows per page
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Navigate pages
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  // Remove row
  const removeRow = (actualIndex) => {
    if (materials.length > 1) {
      setMaterials(prev => prev.filter((_, i) => i !== actualIndex));
    }
  };

  // Handle cell click (adjust for pagination)
  const handleCellClick = (rowIndex, field) => {
    const actualIndex = startIndex + rowIndex;
    setSelectedCell({ row: actualIndex, field });
    setIsEditing(true);
    setEditValue(materials[actualIndex][field] || '');
  };

  // Handle cell edit
  const handleCellEdit = (value) => {
    setEditValue(value);
  };

  // Save cell edit with validation
  const saveCellEdit = () => {
    if (selectedCell) {
      const { row, field } = selectedCell;
      setMaterials(prev => {
        const updated = prev.map((material, index) => {
          if (index === row) {
            const updatedMaterial = { ...material, [field]: editValue };
            const validation = validateMaterial(updatedMaterial);
            return {
              ...updatedMaterial,
              isValid: validation.isValid,
              errors: validation.errors
            };
          }
          return material;
        });
        
        // Auto-expand: If editing the last row and it has content, add more rows
        if (row === prev.length - 1 && editValue.trim()) {
          for (let i = 0; i < 3; i++) { // Reduced auto-expansion
            updated.push({
              id: `auto-row-${Date.now()}-${i}`,
              name: '',
              unit: '',
              price: '',
              supplier: '',
              description: '',
              isNew: true,
              isValid: false,
              errors: {}
            });
          }
        }
        
        return updated;
      });
    }
    setIsEditing(false);
    setSelectedCell(null);
    setEditValue('');
  };

  // Cancel cell edit
  const cancelCellEdit = () => {
    setIsEditing(false);
    setSelectedCell(null);
    setEditValue('');
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveCellEdit();
    } else if (e.key === 'Escape') {
      cancelCellEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCellEdit();
      // Move to next cell (handle pagination)
      if (selectedCell) {
        const fields = ['name', 'unit', 'price', 'supplier', 'description'];
        const currentFieldIndex = fields.indexOf(selectedCell.field);
        const nextFieldIndex = (currentFieldIndex + 1) % fields.length;
        const nextRow = nextFieldIndex === 0 ? selectedCell.row + 1 : selectedCell.row;
        
        if (nextRow < materials.length) {
          // Check if next row is on current page
          const nextRowPageIndex = nextRow - startIndex;
          if (nextRowPageIndex >= 0 && nextRowPageIndex < rowsPerPage) {
            setTimeout(() => {
              handleCellClick(nextRowPageIndex, fields[nextFieldIndex]);
            }, 50);
          } else if (nextRow >= endIndex && currentPage < totalPages) {
            // Move to next page
            setCurrentPage(prev => prev + 1);
            setTimeout(() => {
              handleCellClick(0, fields[nextFieldIndex]);
            }, 100);
          }
        }
      }
    }
  };

  // Auto focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Save all materials (process in chunks to avoid PHP limits)
  const handleSave = () => {
    const validMaterials = materials.filter(material => 
      material.name.trim() && 
      material.unit.trim() && 
      material.price && 
      !isNaN(parseFloat(material.price))
    ).map(material => ({
      name: material.name.trim(),
      unit: material.unit.trim(),
      price: parseFloat(material.price),
      supplier: material.supplier.trim() || null,
      description: material.description.trim() || null
    }));

    if (validMaterials.length === 0) {
      toast.error('Tidak ada material valid untuk disimpan');
      return;
    }

    // Process in chunks of 50 to avoid PHP limits
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < validMaterials.length; i += chunkSize) {
      chunks.push(validMaterials.slice(i, i + chunkSize));
    }

    if (chunks.length === 1) {
      bulkImportMutation.mutate(validMaterials);
    } else {
      // Process multiple chunks
      toast.loading(`Memproses ${validMaterials.length} material dalam ${chunks.length} batch...`);
      processChunks(chunks, 0);
    }
  };

  // Process chunks sequentially
  const processChunks = async (chunks, index) => {
    if (index >= chunks.length) {
      toast.dismiss();
      toast.success(`Semua ${chunks.reduce((sum, chunk) => sum + chunk.length, 0)} material berhasil disimpan!`);
      if (onImportSuccess) onImportSuccess();
      queryClient.invalidateQueries(['materials']);
      return;
    }

    try {
      await apiService.materials.bulkImport(chunks[index], true);
      toast.loading(`Batch ${index + 1}/${chunks.length} selesai...`);
      setTimeout(() => processChunks(chunks, index + 1), 500);
    } catch (error) {
      toast.dismiss();
      toast.error(`Gagal pada batch ${index + 1}: ${error.message}`);
    }
  };

  // Paste from clipboard - Auto expand rows
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split('\n').filter(line => line.trim());
      const newMaterials = [];

      lines.forEach((line, index) => {
        const columns = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
        
        if (columns.length >= 3) {
          let name, unit, price, supplier, description;
          
          if (columns.length >= 5) {
            // Format: NO | NAMA | QTY | SATUAN | HARGA
            [, name, , unit, price] = columns;
          } else if (columns.length === 4) {
            // Format: NAMA | QTY | SATUAN | HARGA  
            [name, , unit, price] = columns;
          } else {
            // Format: NAMA | SATUAN | HARGA
            [name, unit, price] = columns;
          }

          if (name && unit && price) {
            const material = {
              id: `paste-${Date.now()}-${index}`,
              name: name.trim(),
              unit: unit.trim(),
              price: price.replace(/[^\d.-]/g, ''),
              supplier: supplier?.trim() || '',
              description: description?.trim() || '',
              isNew: true
            };
            
            const validation = validateMaterial(material);
            material.isValid = validation.isValid;
            material.errors = validation.errors;
            
            newMaterials.push(material);
          }
        }
      });

      if (newMaterials.length > 0) {
        // Auto expand with pasted data (limit initial expansion)
        const totalRows = [...newMaterials];
        
        // Add fewer empty rows to avoid PHP limits
        const emptyRowsToAdd = Math.min(5, rowsPerPage - (newMaterials.length % rowsPerPage));
        for (let i = 0; i < emptyRowsToAdd; i++) {
          totalRows.push({
            id: `auto-${Date.now()}-${i}`,
            name: '',
            unit: '',
            price: '',
            supplier: '',
            description: '',
            isNew: true
          });
        }
        
        setMaterials(totalRows);
        setCurrentPage(1); // Reset to first page
        toast.success(`${newMaterials.length} baris data berhasil di-paste, ${totalRows.length} total baris tersedia`);
      } else {
        toast.error('Format data tidak valid');
      }
    } catch (error) {
      toast.error('Gagal membaca clipboard');
    }
  };

  // Clear all data
  const handleClear = () => {
    const emptyRows = [];
    for (let i = 1; i <= rowsPerPage; i++) {
      emptyRows.push({
        id: `cleared-row-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true,
        isValid: false,
        errors: {}
      });
    }
    setMaterials(emptyRows);
    setSelectedCell(null);
    setIsEditing(false);
    setCurrentPage(1);
    setSelectedRows(new Set());
    setSearchQuery('');
    setSortField('');
    toast.success('Data berhasil dibersihkan');
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['No', 'Nama Material', 'Satuan', 'Harga', 'Supplier', 'Deskripsi'],
      ...validMaterials.map((material, index) => [
        index + 1,
        material.name,
        material.unit,
        material.price,
        material.supplier || '',
        material.description || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `materials_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Data berhasil diekspor ke CSV');
  };

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && validMaterials.length > 0) {
      const timer = setTimeout(() => {
        handleSave();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timer);
    }
  }, [materials, autoSave, validMaterials.length, handleSave]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Input Material Spreadsheet (Optimized)</h2>
                <p className="text-blue-100 text-sm">Input material dengan pagination - mengatasi PHP max_input_vars limit</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowValidationErrors(!showValidationErrors)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showValidationErrors 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showValidationErrors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>Error</span>
              </button>
              
              <button
                onClick={() => setDuplicateCheck(!duplicateCheck)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  duplicateCheck 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Duplikat</span>
              </button>
            </div>

            {/* Main Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={addNewRow}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baris</span>
                </button>
                
                <button
                  onClick={() => addMultipleRows(10)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>+10 Baris</span>
                </button>
                
                <button
                  onClick={handlePaste}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Paste dari Excel</span>
                </button>
                
                {selectedRows.size > 0 && (
                  <>
                    <button
                      onClick={deleteSelectedRows}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus ({selectedRows.size})</span>
                    </button>
                    
                    <button
                      onClick={duplicateSelectedRows}
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Duplikat ({selectedRows.size})</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleClear}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-600 font-medium">{validMaterials.length} valid</span>
                  {duplicates.size > 0 && (
                    <span className="text-orange-600 font-medium">{duplicates.size} duplikat</span>
                  )}
                  <span className="text-gray-600">dari {materials.length} total</span>
                </div>
                
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="rounded"
                  />
                  <span>Auto-save</span>
                </label>
                
                <button
                  onClick={handleSave}
                  disabled={bulkImportMutation.isLoading || validMaterials.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{bulkImportMutation.isLoading ? 'Menyimpan...' : 'Simpan Semua'}</span>
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Baris per halaman:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages} ({materials.length} total baris)
                </span>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm bg-white border rounded">
                    {currentPage}
                  </span>
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-center w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === currentMaterials.length && currentMaterials.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Nama Material</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  <button
                    onClick={() => handleSort('unit')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Satuan</span>
                    {sortField === 'unit' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Harga</span>
                    {sortField === 'price' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                  <button
                    onClick={() => handleSort('supplier')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Supplier</span>
                    {sortField === 'supplier' && (
                      sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Deskripsi</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentMaterials.map((material, index) => {
                const actualIndex = startIndex + index;
                const isSelected = selectedRows.has(actualIndex);
                const isDuplicate = duplicates.has(actualIndex);
                const hasErrors = showValidationErrors && material.errors && Object.keys(material.errors).length > 0;
                
                return (
                  <tr 
                    key={material.id} 
                    className={`hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50' : ''
                    } ${isDuplicate ? 'bg-orange-50' : ''} ${hasErrors ? 'bg-red-50' : ''}`}
                  >
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(actualIndex)}
                        className="rounded"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">
                      <div className="flex items-center justify-center space-x-1">
                        <span>{actualIndex + 1}</span>
                        {isDuplicate && <AlertCircle className="w-3 h-3 text-orange-500" title="Duplikat terdeteksi" />}
                        {hasErrors && <AlertCircle className="w-3 h-3 text-red-500" title="Ada error validasi" />}
                        {material.isValid && <CheckCircle className="w-3 h-3 text-green-500" title="Data valid" />}
                      </div>
                    </td>
                  
                  {/* Name Cell */}
                  <td 
                    className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedCell?.row === startIndex + index && selectedCell?.field === 'name' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(index, 'name')}
                  >
                    {isEditing && selectedCell?.row === startIndex + index && selectedCell?.field === 'name' ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => handleCellEdit(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveCellEdit}
                        className="w-full px-2 py-1 border-0 outline-none bg-transparent"
                      />
                    ) : (
                      <span className="text-sm">{material.name || 'Klik untuk edit'}</span>
                    )}
                  </td>
                  
                  {/* Unit Cell */}
                  <td 
                    className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedCell?.row === startIndex + index && selectedCell?.field === 'unit' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(index, 'unit')}
                  >
                    {isEditing && selectedCell?.row === startIndex + index && selectedCell?.field === 'unit' ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => handleCellEdit(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveCellEdit}
                        className="w-full px-2 py-1 border-0 outline-none bg-transparent"
                      />
                    ) : (
                      <span className="text-sm">{material.unit || 'Klik untuk edit'}</span>
                    )}
                  </td>
                  
                  {/* Price Cell */}
                  <td 
                    className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedCell?.row === startIndex + index && selectedCell?.field === 'price' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(index, 'price')}
                  >
                    {isEditing && selectedCell?.row === startIndex + index && selectedCell?.field === 'price' ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => handleCellEdit(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveCellEdit}
                        className="w-full px-2 py-1 border-0 outline-none bg-transparent"
                      />
                    ) : (
                      <span className="text-sm font-mono">
                        {material.price ? `Rp ${parseFloat(material.price).toLocaleString('id-ID')}` : 'Klik untuk edit'}
                      </span>
                    )}
                  </td>
                  
                  {/* Supplier Cell */}
                  <td 
                    className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedCell?.row === startIndex + index && selectedCell?.field === 'supplier' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(index, 'supplier')}
                  >
                    {isEditing && selectedCell?.row === startIndex + index && selectedCell?.field === 'supplier' ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => handleCellEdit(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveCellEdit}
                        className="w-full px-2 py-1 border-0 outline-none bg-transparent"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{material.supplier || 'Opsional'}</span>
                    )}
                  </td>
                  
                  {/* Description Cell */}
                  <td 
                    className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedCell?.row === startIndex + index && selectedCell?.field === 'description' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(index, 'description')}
                  >
                    {isEditing && selectedCell?.row === startIndex + index && selectedCell?.field === 'description' ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => handleCellEdit(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={saveCellEdit}
                        className="w-full px-2 py-1 border-0 outline-none bg-transparent"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{material.description || 'Opsional'}</span>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      onClick={() => removeRow(actualIndex)}
                      disabled={materials.length === 1}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Fitur Spreadsheet Material (Enhanced):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-gray-700 mb-1">📝 Input & Edit:</p>
                <ul className="space-y-1">
                  <li>• <strong>Klik sel</strong> untuk mengedit data</li>
                  <li>• <strong>Enter</strong> untuk menyimpan, <strong>Esc</strong> untuk batal</li>
                  <li>• <strong>Tab</strong> untuk pindah ke sel berikutnya</li>
                  <li>• <strong>Paste dari Excel</strong> untuk import data dari clipboard</li>
                  <li>• <strong>Validasi real-time</strong> dengan indikator visual</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-1">🔍 Pencarian & Filter:</p>
                <ul className="space-y-1">
                  <li>• <strong>Search box</strong> untuk mencari material</li>
                  <li>• <strong>Sort kolom</strong> dengan klik header tabel</li>
                  <li>• <strong>Toggle error/duplikat</strong> untuk fokus pada masalah</li>
                  <li>• <strong>Pagination</strong> untuk mengelola data besar</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-1">✅ Seleksi & Aksi:</p>
                <ul className="space-y-1">
                  <li>• <strong>Checkbox</strong> untuk seleksi multiple</li>
                  <li>• <strong>Hapus/Duplikat</strong> baris yang dipilih</li>
                  <li>• <strong>Export CSV</strong> untuk backup data</li>
                  <li>• <strong>Auto-save</strong> setiap 30 detik (opsional)</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-1">⚡ Optimasi:</p>
                <ul className="space-y-1">
                  <li>• <strong>Max {rowsPerPage} baris/halaman</strong> untuk performa</li>
                  <li>• <strong>Batch processing</strong> untuk import besar</li>
                  <li>• <strong>Deteksi duplikat</strong> otomatis</li>
                  <li>• Format: NO | NAMA | QTY | SATUAN | HARGA</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-700 font-medium text-xs">
                💡 <strong>Tips:</strong> Gunakan fitur search dan sort untuk mengelola data lebih efisien. 
                Aktifkan auto-save untuk mencegah kehilangan data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialSpreadsheetOptimized;
