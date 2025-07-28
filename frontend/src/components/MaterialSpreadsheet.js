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
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

import apiService from '../services/api';

const MaterialSpreadsheet = ({ onClose, onImportSuccess }) => {
  const queryClient = useQueryClient();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50); // Limit to 50 rows per page to avoid max_input_vars
  
  const [materials, setMaterials] = useState(() => {
    // Initialize with 5 empty rows to reduce clutter
    const initialRows = [];
    for (let i = 1; i <= 5; i++) {
      initialRows.push({
        id: `row-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true
      });
    }
    return initialRows;
  });
  const [selectedCell, setSelectedCell] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

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

  // Calculate pagination
  const totalPages = Math.ceil(materials.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageMaterials = materials.slice(startIndex, endIndex);
  
  // Add new row
  const addNewRow = () => {
    const newId = `new-${Date.now()}`;
    setMaterials(prev => [...prev, {
      id: newId,
      name: '',
      unit: '',
      price: '',
      supplier: '',
      description: '',
      isNew: true
    }]);
    
    // Navigate to the page containing the new row
    const newRowIndex = materials.length;
    const newRowPage = Math.ceil((newRowIndex + 1) / rowsPerPage);
    if (newRowPage > currentPage) {
      setCurrentPage(newRowPage);
    }
  };

  // Add multiple rows at once
  const addMultipleRows = (count = 10) => {
    const newRows = [];
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `bulk-new-${Date.now()}-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true
      });
    }
    setMaterials(prev => [...prev, ...newRows]);
    
    // Navigate to the page containing the new rows
    const newRowIndex = materials.length;
    const newRowPage = Math.ceil((newRowIndex + 1) / rowsPerPage);
    if (newRowPage > currentPage) {
      setCurrentPage(newRowPage);
    }
  };

  // Remove row
  const removeRow = (index) => {
    if (materials.length > 1) {
      setMaterials(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle cell click (adjust for pagination)
  const handleCellClick = (pageRowIndex, field) => {
    const actualRowIndex = startIndex + pageRowIndex;
    setSelectedCell({ row: actualRowIndex, field, pageRow: pageRowIndex });
    setIsEditing(true);
    setEditValue(materials[actualRowIndex][field] || '');
  };

  // Handle cell edit
  const handleCellEdit = (value) => {
    setEditValue(value);
  };

  // Save cell edit
  const saveCellEdit = () => {
    if (selectedCell) {
      const { row, field } = selectedCell;
      setMaterials(prev => {
        const updated = prev.map((material, index) => 
          index === row 
            ? { ...material, [field]: editValue }
            : material
        );
        
        // Auto-expand: Only add rows if we're editing the last meaningful row
        const meaningfulRows = prev.filter(m => m.name.trim() || m.unit.trim() || m.price);
        const isLastMeaningfulRow = row === meaningfulRows.length - 1 && editValue.trim();
        
        if (isLastMeaningfulRow && meaningfulRows.length === prev.length) {
          // Only add 3 new rows instead of 5 to reduce clutter
          for (let i = 0; i < 3; i++) {
            updated.push({
              id: `auto-row-${Date.now()}-${i}`,
              name: '',
              unit: '',
              price: '',
              supplier: '',
              description: '',
              isNew: true
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

  // Handle key press (updated for pagination)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveCellEdit();
    } else if (e.key === 'Escape') {
      cancelCellEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCellEdit();
      // Move to next cell
      if (selectedCell) {
        const fields = ['name', 'unit', 'price', 'supplier', 'description'];
        const currentFieldIndex = fields.indexOf(selectedCell.field);
        const nextFieldIndex = (currentFieldIndex + 1) % fields.length;
        const nextRow = nextFieldIndex === 0 ? selectedCell.row + 1 : selectedCell.row;
        
        if (nextRow < materials.length) {
          // Check if next row is on current page
          const nextPageRowIndex = nextRow - startIndex;
          if (nextPageRowIndex >= 0 && nextPageRowIndex < rowsPerPage) {
            setTimeout(() => {
              handleCellClick(nextPageRowIndex, fields[nextFieldIndex]);
            }, 50);
          } else {
            // Navigate to next page if needed
            const nextRowPage = Math.ceil((nextRow + 1) / rowsPerPage);
            setCurrentPage(nextRowPage);
            setTimeout(() => {
              const newPageRowIndex = nextRow - ((nextRowPage - 1) * rowsPerPage);
              handleCellClick(newPageRowIndex, fields[nextFieldIndex]);
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

  // Save all materials (process in chunks to avoid server limits)
  const handleSave = async () => {
    const validMaterials = materials.filter(material => 
      material.name.trim() && 
      material.unit.trim() && 
      material.price && 
      !isNaN(parseFloat(material.price)) &&
      material.name !== 'Klik untuk edit'
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

    // Check for local duplicates (same name + unit combination)
    const nameUnitCombinations = new Map();
    const localDuplicates = [];
    
    validMaterials.forEach((material, index) => {
      const key = `${material.name}|${material.unit}`;
      if (nameUnitCombinations.has(key)) {
        localDuplicates.push({
          index: index + 1,
          name: material.name,
          unit: material.unit,
          firstOccurrence: nameUnitCombinations.get(key) + 1
        });
      } else {
        nameUnitCombinations.set(key, index);
      }
    });

    if (localDuplicates.length > 0) {
      const duplicateMessage = localDuplicates.map(dup => 
        `Baris ${dup.index}: "${dup.name}" (${dup.unit}) - duplikat dengan baris ${dup.firstOccurrence}`
      ).join('\n');
      
      toast.error(`Material duplikat ditemukan:\n${duplicateMessage}`, {
        duration: 8000
      });
      return;
    }

    // Process in chunks of 100 to avoid server limits
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < validMaterials.length; i += chunkSize) {
      chunks.push(validMaterials.slice(i, i + chunkSize));
    }

    if (chunks.length === 1) {
      // Single chunk, use existing mutation
      bulkImportMutation.mutate(validMaterials);
    } else {
      // Multiple chunks, process sequentially
      toast.loading(`Memproses ${validMaterials.length} material dalam ${chunks.length} batch...`);
      
      try {
        let totalSuccess = 0;
        for (let i = 0; i < chunks.length; i++) {
          const response = await apiService.materials.bulkImport(chunks[i], true);
          totalSuccess += response.data.summary.successful_imports;
          toast.loading(`Batch ${i + 1}/${chunks.length} selesai...`);
        }
        
        toast.dismiss();
        toast.success(`Berhasil menyimpan ${totalSuccess} material!`);
        if (onImportSuccess) onImportSuccess();
        queryClient.invalidateQueries(['materials']);
      } catch (error) {
        toast.dismiss();
        toast.error(error.message || 'Gagal menyimpan material');
      }
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
            newMaterials.push({
              id: `paste-${Date.now()}-${index}`,
              name: name.trim(),
              unit: unit.trim(),
              price: price.replace(/[^\d.-]/g, ''),
              supplier: supplier?.trim() || '',
              description: description?.trim() || '',
              isNew: true
            });
          }
        }
      });

      if (newMaterials.length > 0) {
        // Replace with pasted data and add minimal empty rows
        const expandedMaterials = [...newMaterials];
        
        // Add only 3 empty rows for additional input
        for (let i = 0; i < 3; i++) {
          expandedMaterials.push({
            id: `empty-${Date.now()}-${i}`,
            name: '',
            unit: '',
            price: '',
            supplier: '',
            description: '',
            isNew: true
          });
        }
        
        setMaterials(expandedMaterials);
        setCurrentPage(1); // Reset to first page
        toast.success(`${newMaterials.length} baris data berhasil di-paste`);
      } else {
        toast.error('Format data tidak valid');
      }
    } catch (error) {
      toast.error('Gagal membaca clipboard');
    }
  };

  // Handle paste event directly on table
  const handleTablePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    if (pastedData) {
      const lines = pastedData.trim().split('\n').filter(line => line.trim());
      const newRows = [];
      
      lines.forEach((line, index) => {
        const columns = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
        
        if (columns.length >= 3) {
          let name, unit, price, supplier, description;
          
          // Flexible parsing
          if (columns.length >= 5) {
            [, name, , unit, price] = columns;
          } else if (columns.length === 4) {
            [name, , unit, price] = columns;
          } else {
            [name, unit, price] = columns;
          }

          if (name && unit && price) {
            newRows.push({
              id: `paste-direct-${Date.now()}-${index}`,
              name: name.trim(),
              unit: unit.trim(),
              price: price.replace(/[^\d.-]/g, ''),
              supplier: supplier?.trim() || '',
              description: description?.trim() || '',
              isNew: true
            });
          }
        }
      });

      if (newRows.length > 0) {
        // Replace with pasted data and add minimal empty rows
        const totalRows = [...newRows];
        
        // Add only 2 empty rows for additional input
        for (let i = 0; i < 2; i++) {
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
        toast.success(`${newRows.length} baris data di-paste otomatis`);
      }
    }
  };

  // Clear all data
  const handleClear = () => {
    const emptyRows = [];
    for (let i = 1; i <= 5; i++) {
      emptyRows.push({
        id: `cleared-row-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true
      });
    }
    setMaterials(emptyRows);
    setSelectedCell(null);
    setIsEditing(false);
    setCurrentPage(1); // Reset to first page
    toast.success('Data berhasil dibersihkan');
  };

  // Clean up template rows - remove empty template rows that are not needed
  const handleCleanupTemplate = () => {
    const actualData = materials.filter(m => 
      m.name.trim() && 
      m.unit.trim() && 
      m.price && 
      !isNaN(parseFloat(m.price)) &&
      m.name !== 'Klik untuk edit'
    );
    
    // Add only 3 empty rows for additional input
    const cleanedMaterials = [...actualData];
    for (let i = 0; i < 3; i++) {
      cleanedMaterials.push({
        id: `clean-${Date.now()}-${i}`,
        name: '',
        unit: '',
        price: '',
        supplier: '',
        description: '',
        isNew: true
      });
    }
    
    setMaterials(cleanedMaterials);
    setCurrentPage(1);
    toast.success(`Template dibersihkan! ${actualData.length} data aktual dipertahankan`);
  };

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
                <h2 className="text-xl font-bold">Input Material Spreadsheet</h2>
                <p className="text-blue-100 text-sm">Input material seperti di Excel - klik sel untuk edit</p>
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
              
              <button
                onClick={handleClear}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear</span>
              </button>
              
              <button
                onClick={handleCleanupTemplate}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Bersihkan Template</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {materials.filter(m => m.name.trim() && m.unit.trim() && m.price && !isNaN(parseFloat(m.price)) && m.name !== 'Klik untuk edit').length} material valid
              </span>
              
              <div className="text-sm text-gray-500">
                Halaman {currentPage} dari {totalPages} ({materials.filter(m => m.name.trim() && m.unit.trim() && m.price && !isNaN(parseFloat(m.price)) && m.name !== 'Klik untuk edit').length} baris data aktual)
              </div>
              
              <button
                onClick={handleSave}
                disabled={bulkImportMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{bulkImportMutation.isLoading ? 'Menyimpan...' : 'Simpan Semua'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Pertama
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Menampilkan baris {startIndex + 1} - {Math.min(endIndex, materials.length)} dari {materials.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Terakhir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spreadsheet */}
        <div className="overflow-auto max-h-[60vh]" onPaste={handleTablePaste}>
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Nama Material</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Satuan</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Harga</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Supplier</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Deskripsi</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentPageMaterials.map((material, pageIndex) => {
                const actualIndex = startIndex + pageIndex;
                return (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">
                    {actualIndex + 1}
                  </td>
                  
                  {/* Name Cell */}
                  <td 
                    className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedCell?.row === actualIndex && selectedCell?.field === 'name' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(pageIndex, 'name')}
                  >
                    {isEditing && selectedCell?.row === actualIndex && selectedCell?.field === 'name' ? (
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
                      selectedCell?.row === actualIndex && selectedCell?.field === 'unit' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(pageIndex, 'unit')}
                  >
                    {isEditing && selectedCell?.row === actualIndex && selectedCell?.field === 'unit' ? (
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
                      selectedCell?.row === actualIndex && selectedCell?.field === 'price' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(pageIndex, 'price')}
                  >
                    {isEditing && selectedCell?.row === actualIndex && selectedCell?.field === 'price' ? (
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
                      selectedCell?.row === actualIndex && selectedCell?.field === 'supplier' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(pageIndex, 'supplier')}
                  >
                    {isEditing && selectedCell?.row === actualIndex && selectedCell?.field === 'supplier' ? (
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
                      selectedCell?.row === actualIndex && selectedCell?.field === 'description' ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleCellClick(pageIndex, 'description')}
                  >
                    {isEditing && selectedCell?.row === actualIndex && selectedCell?.field === 'description' ? (
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
              )})}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Cara Penggunaan:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Klik sel</strong> untuk mengedit data</li>
              <li>• <strong>Material dengan nama sama tapi satuan berbeda</strong> diperbolehkan</li>
              <li>• <strong>Kombinasi nama + satuan</strong> harus unik</li>
              <li>• <strong>Tab</strong> untuk pindah ke sel berikutnya</li>
              <li>• <strong>Enter</strong> untuk simpan, <strong>Escape</strong> untuk batal</li>
              <li>• <strong>Bersihkan Template</strong> untuk menghapus baris kosong yang tidak perlu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialSpreadsheet;
