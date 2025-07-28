import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, 
  Package, 
  Save,
  Plus,
  X,
  Search,
  CheckCircle,
  Building,
  Ruler,
  Settings,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const BeamCalculator = ({ jobType, onCalculationComplete }) => {
  const [formData, setFormData] = useState({
    beam_length: '',
    beam_width: '',
    beam_height: '',
    beam_cover: '25',
    concrete_quality: 'K225',
    main_reinforcement: 'D12',
    stirrup_reinforcement: 'D8',
    stirrup_spacing: '150',
    productivity: '3',
    profit_percentage: '20',
    waste_factor: '5',
    // Beton workers
    beton_worker_ratio: '1:2',
    beton_num_tukang: '1',
    beton_num_pekerja: '2',
    // Bekisting workers
    bekisting_worker_ratio: '2:1',
    bekisting_num_tukang: '2',
    bekisting_num_pekerja: '1',
    // Besi workers
    besi_worker_ratio: '1:1',
    besi_num_tukang: '2',
    besi_num_pekerja: '1',
    project_name: ''
  });

  const [materials, setMaterials] = useState([]);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Fixed rates as specified
  const TUKANG_RATE = 150000;
  const PEKERJA_RATE = 135000;

  // Reinforcement options
  const reinforcementOptions = [
    { value: 'D8', label: 'D8 (8mm)', diameter: 8, weight: 0.395 }, // kg/m
    { value: 'D10', label: 'D10 (10mm)', diameter: 10, weight: 0.617 }, // kg/m
    { value: 'D12', label: 'D12 (12mm)', diameter: 12, weight: 0.888 },
    { value: 'D16', label: 'D16 (16mm)', diameter: 16, weight: 1.578 },
    { value: 'D19', label: 'D19 (19mm)', diameter: 19, weight: 2.226 },
    { value: 'D22', label: 'D22 (22mm)', diameter: 22, weight: 2.984 },
    { value: 'D25', label: 'D25 (25mm)', diameter: 25, weight: 3.853 }
  ];

  // Concrete quality options with proper mix design ratios
  const concreteQualityOptions = [
    { 
      value: 'K175', 
      label: 'K-175 (fc\' = 14.5 MPa)', 
      cementRatio: 6.5,
      sandRatio: 0.45,      // m³ pasir per m³ beton
      gravelRatio: 0.65,    // m³ kerikil per m³ beton
      waterCementRatio: 0.65 // rasio air semen
    },
    { 
      value: 'K200', 
      label: 'K-200 (fc\' = 16.6 MPa)', 
      cementRatio: 7,
      sandRatio: 0.47,
      gravelRatio: 0.67,
      waterCementRatio: 0.60
    },
    { 
      value: 'K225', 
      label: 'K-225 (fc\' = 18.7 MPa)', 
      cementRatio: 7.5,
      sandRatio: 0.48,
      gravelRatio: 0.68,
      waterCementRatio: 0.58
    },
    { 
      value: 'K250', 
      label: 'K-250 (fc\' = 20.8 MPa)', 
      cementRatio: 8,
      sandRatio: 0.50,
      gravelRatio: 0.70,
      waterCementRatio: 0.55
    },
    { 
      value: 'K300', 
      label: 'K-300 (fc\' = 25 MPa)', 
      cementRatio: 8.5,
      sandRatio: 0.52,
      gravelRatio: 0.72,
      waterCementRatio: 0.50
    },
    { 
      value: 'K350', 
      label: 'K-350 (fc\' = 29.2 MPa)', 
      cementRatio: 9,
      sandRatio: 0.54,
      gravelRatio: 0.74,
      waterCementRatio: 0.45
    }
  ];

  // Load available materials with dual unit system
  useEffect(() => {
    setAvailableMaterials([
      { 
        id: 1, 
        name: 'Semen Portland', 
        marketUnit: 'sak', 
        siUnit: 'kg',
        marketPrice: 65000, 
        siPrice: 1625, // 65000/40kg
        conversionFactor: 40, // 1 sak = 40 kg
        supplier: 'Toko Bangunan A' 
      },
      { 
        id: 2, 
        name: 'Pasir Halus', 
        marketUnit: 'm³', 
        siUnit: 'kg',
        marketPrice: 350000, 
        siPrice: 233.33, // assuming 1500 kg/m³
        conversionFactor: 1500, // 1 m³ = 1500 kg
        supplier: 'Supplier Pasir B' 
      },
      { 
        id: 3, 
        name: 'Kerikil', 
        marketUnit: 'm³', 
        siUnit: 'kg',
        marketPrice: 400000, 
        siPrice: 250, // assuming 1600 kg/m³
        conversionFactor: 1600, // 1 m³ = 1600 kg
        supplier: 'Supplier Batu C' 
      },
      { 
        id: 4, 
        name: 'Besi Beton D8', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 75000, 
        siPrice: 15822.78, // 75000/(12m * 0.395kg/m)
        conversionFactor: 4.74, // 12m * 0.395kg/m = 4.74 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 5, 
        name: 'Besi Beton D10', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 85000, 
        siPrice: 11458.33, // 85000/(12m * 0.617kg/m)
        conversionFactor: 7.404, // 12m * 0.617kg/m = 7.404 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 6, 
        name: 'Besi Beton D12', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 95000, 
        siPrice: 8918.92, // 95000/(12m * 0.888kg/m)
        conversionFactor: 10.656, // 12m * 0.888kg/m = 10.656 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 7, 
        name: 'Besi Beton D16', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 125000, 
        siPrice: 6607.72, // 125000/(12m * 1.578kg/m)
        conversionFactor: 18.936, // 12m * 1.578kg/m = 18.936 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 8, 
        name: 'Besi Beton D19', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 155000, 
        siPrice: 5804.32, // 155000/(12m * 2.226kg/m)
        conversionFactor: 26.712, // 12m * 2.226kg/m = 26.712 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 9, 
        name: 'Besi Beton D22', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 185000, 
        siPrice: 5166.89, // 185000/(12m * 2.984kg/m)
        conversionFactor: 35.808, // 12m * 2.984kg/m = 35.808 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 10, 
        name: 'Besi Beton D25', 
        marketUnit: 'batang', 
        siUnit: 'kg',
        marketPrice: 225000, 
        siPrice: 4867.26, // 225000/(12m * 3.853kg/m)
        conversionFactor: 46.236, // 12m * 3.853kg/m = 46.236 kg per batang
        supplier: 'Toko Besi D' 
      },
      { 
        id: 11, 
        name: 'Kawat Bendrat', 
        marketUnit: 'bendel', 
        siUnit: 'kg',
        marketPrice: 125000, // 5kg x 25000 per kg
        siPrice: 25000, // per kg
        conversionFactor: 5, // 1 bendel = 5 kg
        supplier: 'Toko Bangunan A' 
      },
      { 
        id: 12, 
        name: 'Kayu Bekisting 3x5', 
        marketUnit: 'bendel', 
        siUnit: 'lembar',
        marketPrice: 850000, // 10 lembar x 85000 per m²
        siPrice: 85000, // per lembar
        conversionFactor: 10, // 1 bendel = 10 lembar
        supplier: 'Supplier Kayu E' 
      },
      { 
        id: 13, 
        name: 'Kayu Bekisting 4x6', 
        marketUnit: 'bendel', 
        siUnit: 'lembar',
        marketPrice: 510000, // 6 lembar x 85000 per m²
        siPrice: 85000, // per lembar
        conversionFactor: 6, // 1 bendel = 6 lembar
        supplier: 'Supplier Kayu E' 
      },
      { 
        id: 14, 
        name: 'Paku', 
        marketUnit: 'kg', 
        siUnit: 'kg',
        marketPrice: 18000, 
        siPrice: 18000,
        conversionFactor: 1, // 1 kg = 1 kg
        supplier: 'Toko Bangunan A' 
      }
    ]);
  }, []);

  // Set productivity from jobType when component mounts or jobType changes
  useEffect(() => {
    if (jobType && jobType.base_productivity) {
      setFormData(prev => ({
        ...prev,
        productivity: jobType.base_productivity.toString()
      }));
    }
  }, [jobType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInputFocus = (e) => {
    // Auto-select all text when input is focused
    e.target.select();
  };

  // Calculate beam volume and reinforcement quantities
  const calculateBeamQuantities = useCallback(() => {
    const length = parseFloat(formData.beam_length) || 0;
    const width = parseFloat(formData.beam_width) || 0;
    const height = parseFloat(formData.beam_height) || 0;
    const cover = parseFloat(formData.beam_cover) || 25; // mm
    const stirrupSpacing = parseFloat(formData.stirrup_spacing) || 150; // mm

    if (length === 0 || width === 0 || height === 0) {
      return {
        concreteVolume: 0,
        mainReinforcementLength: 0,
        stirrupLength: 0,
        formworkArea: 0
      };
    }

    // Calculate concrete volume (m³)
    const concreteVolume = length * width * height;

    // Calculate main reinforcement
    // Assume 4 main bars (2 top, 2 bottom) for simplicity
    const mainReinforcementLength = length * 4; // 4 bars × beam length

    // Calculate stirrup reinforcement
    // Stirrup perimeter = 2 × (width - 2×cover) + 2 × (height - 2×cover)
    const effectiveWidth = width - (2 * cover / 1000); // convert mm to m
    const effectiveHeight = height - (2 * cover / 1000);
    const stirrupPerimeter = 2 * (effectiveWidth + effectiveHeight);
    
    // Number of stirrups = beam length / spacing + 1
    const numberOfStirrups = Math.ceil((length * 1000) / stirrupSpacing) + 1;
    const stirrupLength = stirrupPerimeter * numberOfStirrups;

    // Calculate formwork area (m²)
    // Bottom + 2 sides + 2 ends
    const formworkArea = (length * width) + // bottom
                        (2 * length * height) + // sides
                        (2 * width * height); // ends

    return {
      concreteVolume,
      mainReinforcementLength,
      stirrupLength,
      formworkArea,
      numberOfStirrups
    };
  }, [formData.beam_length, formData.beam_width, formData.beam_height, formData.beam_cover, formData.stirrup_spacing]);

  const addMaterial = (material) => {
    const isAlreadyAdded = materials.some(m => m.id === material.id);
    if (!isAlreadyAdded) {
      setMaterials(prev => [...prev, { ...material, quantity: 1 }]);
    }
    setShowMaterialSelector(false);
    setMaterialSearch('');
  };

  const removeMaterial = (materialId) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const updateMaterialQuantity = (materialId, quantity) => {
    setMaterials(prev => prev.map(m => 
      m.id === materialId ? { ...m, quantity: parseFloat(quantity) || 0 } : m
    ));
  };


  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.beam_length || parseFloat(formData.beam_length) <= 0) {
      newErrors.beam_length = 'Panjang balok harus diisi dan lebih dari 0';
    }

    if (!formData.beam_width || parseFloat(formData.beam_width) <= 0) {
      newErrors.beam_width = 'Lebar balok harus diisi dan lebih dari 0';
    }

    if (!formData.beam_height || parseFloat(formData.beam_height) <= 0) {
      newErrors.beam_height = 'Tinggi balok harus diisi dan lebih dari 0';
    }


    const cover = parseFloat(formData.beam_cover);
    if (isNaN(cover) || cover < 15 || cover > 50) {
      newErrors.beam_cover = 'Selimut balok harus antara 15-50 mm';
    }

    if (!formData.productivity || parseFloat(formData.productivity) <= 0) {
      newErrors.productivity = 'Produktivitas harus diisi dan lebih dari 0';
    }

    const profitPercentage = parseFloat(formData.profit_percentage);
    if (isNaN(profitPercentage) || profitPercentage < 0) {
      newErrors.profit_percentage = 'Keuntungan minimal 0%';
    }

    const wasteFactor = parseFloat(formData.waste_factor);
    if (isNaN(wasteFactor) || wasteFactor < 0) {
      newErrors.waste_factor = 'Faktor pemborosan minimal 0%';
    }

    // Validate Beton workers
    const betonTukang = parseInt(formData.beton_num_tukang) || 0;
    const betonPekerja = parseInt(formData.beton_num_pekerja) || 0;
    if (betonTukang < 0 || betonPekerja < 0) {
      newErrors.beton_workers = 'Jumlah pekerja beton tidak boleh negatif';
    }
    if (betonTukang === 0 && betonPekerja === 0) {
      newErrors.beton_workers = 'Minimal harus ada 1 tukang atau 1 pekerja untuk beton';
    }

    // Validate Bekisting workers
    const bekistingTukang = parseInt(formData.bekisting_num_tukang) || 0;
    const bekistingPekerja = parseInt(formData.bekisting_num_pekerja) || 0;
    if (bekistingTukang < 0 || bekistingPekerja < 0) {
      newErrors.bekisting_workers = 'Jumlah pekerja bekisting tidak boleh negatif';
    }
    if (bekistingTukang === 0 && bekistingPekerja === 0) {
      newErrors.bekisting_workers = 'Minimal harus ada 1 tukang atau 1 pekerja untuk bekisting';
    }

    // Validate Besi workers
    const besiTukang = parseInt(formData.besi_num_tukang) || 0;
    const besiPekerja = parseInt(formData.besi_num_pekerja) || 0;
    if (besiTukang < 0 || besiPekerja < 0) {
      newErrors.besi_workers = 'Jumlah pekerja besi tidak boleh negatif';
    }
    if (besiTukang === 0 && besiPekerja === 0) {
      newErrors.besi_workers = 'Minimal harus ada 1 tukang atau 1 pekerja untuk besi';
    }

    const stirrupSpacing = parseFloat(formData.stirrup_spacing);
    if (isNaN(stirrupSpacing) || stirrupSpacing < 50 || stirrupSpacing > 300) {
      newErrors.stirrup_spacing = 'Jarak sengkang harus antara 50-300 mm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCosts = () => {
    if (!validateForm()) return;

    setIsCalculating(true);

    try {
      const quantities = calculateBeamQuantities();
      const profitPercentage = (parseFloat(formData.profit_percentage) || 0) / 100;
      const wasteFactor = (parseFloat(formData.waste_factor) || 0) / 100;
      // Helper function to calculate teams for each sub-pekerjaan
      const calculateTeams = (tukangCount, pekerjaCount, ratio) => {
        const [tukangRatio, pekerjaRatio] = ratio.split(':').map(Number);
        
        let numberOfTeams = 0;
        if (tukangRatio === 0 && pekerjaRatio > 0) {
          numberOfTeams = Math.floor(pekerjaCount / pekerjaRatio);
        } else if (pekerjaRatio === 0 && tukangRatio > 0) {
          numberOfTeams = Math.floor(tukangCount / tukangRatio);
        } else if (tukangRatio > 0 && pekerjaRatio > 0) {
          const maxTeamsFromTukang = Math.floor(tukangCount / tukangRatio);
          const maxTeamsFromPekerja = Math.floor(pekerjaCount / pekerjaRatio);
          numberOfTeams = Math.min(maxTeamsFromTukang, maxTeamsFromPekerja);
        }
        
        return numberOfTeams;
      };

      // Calculate sub-pekerjaan (sub-works)
      const subPekerjaan = [];

      // 1. BETON (Concrete)
      const betonTukang = parseInt(formData.beton_num_tukang) || 0;
      const betonPekerja = parseInt(formData.beton_num_pekerja) || 0;
      const betonWorkerRatio = formData.beton_worker_ratio || '1:2';
      const betonDailyLaborCost = (betonTukang * TUKANG_RATE) + (betonPekerja * PEKERJA_RATE);
      const betonTeams = calculateTeams(betonTukang, betonPekerja, betonWorkerRatio);
      
      const betonProductivity = parseFloat(formData.productivity) || 0.5; // m³/hari
      const adjustedBetonProductivity = betonTeams > 0 ? betonProductivity * betonTeams : betonProductivity;
      const betonDays = adjustedBetonProductivity > 0 ? quantities.concreteVolume / adjustedBetonProductivity : 0;
      const betonLaborCost = betonDailyLaborCost * betonDays;

      // Beton materials (cement, sand, gravel)
      let betonMaterialCost = 0;
      const betonMaterials = [];
      
      // Get concrete quality specifications
      const selectedConcreteQuality = concreteQualityOptions.find(q => q.value === formData.concrete_quality);
      const cementRatio = selectedConcreteQuality ? selectedConcreteQuality.cementRatio : 7;
      const sandRatio = selectedConcreteQuality ? selectedConcreteQuality.sandRatio : 0.50;
      const gravelRatio = selectedConcreteQuality ? selectedConcreteQuality.gravelRatio : 0.70;
      
      // Semen: berdasarkan kualitas beton (40kg per sak)
      const semenQuantity = quantities.concreteVolume * cementRatio * (1 + wasteFactor);
      const semenQuantityKg = semenQuantity * 40; // 40kg per sak
      const semenCost = semenQuantity * 65000; // Rp 65,000 per sak
      betonMaterialCost += semenCost;
      betonMaterials.push({
        name: 'Semen Portland',
        quantity: semenQuantity,
        unit: 'sak',
        siQuantity: semenQuantityKg,
        siUnit: 'kg',
        price: 65000,
        cost: semenCost
      });

      // Pasir: berdasarkan rasio kualitas beton (1500 kg/m³)
      const pasirQuantity = quantities.concreteVolume * sandRatio * (1 + wasteFactor);
      const pasirQuantityKg = pasirQuantity * 1500; // 1500 kg per m³
      const pasirCost = pasirQuantity * 350000; // Rp 350,000 per m³
      betonMaterialCost += pasirCost;
      betonMaterials.push({
        name: 'Pasir Halus',
        quantity: pasirQuantity,
        unit: 'm³',
        siQuantity: pasirQuantityKg,
        siUnit: 'kg',
        price: 350000,
        cost: pasirCost
      });

      // Kerikil: berdasarkan rasio kualitas beton (1600 kg/m³)
      const kerikilQuantity = quantities.concreteVolume * gravelRatio * (1 + wasteFactor);
      const kerikilQuantityKg = kerikilQuantity * 1600; // 1600 kg per m³
      const kerikilCost = kerikilQuantity * 400000; // Rp 400,000 per m³
      betonMaterialCost += kerikilCost;
      betonMaterials.push({
        name: 'Kerikil',
        quantity: kerikilQuantity,
        unit: 'm³',
        siQuantity: kerikilQuantityKg,
        siUnit: 'kg',
        price: 400000,
        cost: kerikilCost
      });

      const betonHPP = betonLaborCost + betonMaterialCost;
      const betonRAB = betonHPP * (1 + profitPercentage);

      subPekerjaan.push({
        name: 'Beton',
        volume: quantities.concreteVolume,
        unit: 'm³',
        materials: betonMaterials,
        laborCost: betonLaborCost,
        materialCost: betonMaterialCost,
        hpp: betonHPP,
        rab: betonRAB,
        days: betonDays
      });

      // 2. BEKISTING (Formwork)
      const bekistingTukang = parseInt(formData.bekisting_num_tukang) || 0;
      const bekistingPekerja = parseInt(formData.bekisting_num_pekerja) || 0;
      const bekistingWorkerRatio = formData.bekisting_worker_ratio || '2:1';
      const bekistingDailyLaborCost = (bekistingTukang * TUKANG_RATE) + (bekistingPekerja * PEKERJA_RATE);
      const bekistingTeams = calculateTeams(bekistingTukang, bekistingPekerja, bekistingWorkerRatio);
      
      const bekistingProductivity = 10; // m²/hari
      const adjustedBekistingProductivity = bekistingTeams > 0 ? bekistingProductivity * bekistingTeams : bekistingProductivity;
      const bekistingDays = adjustedBekistingProductivity > 0 ? quantities.formworkArea / adjustedBekistingProductivity : 0;
      const bekistingLaborCost = bekistingDailyLaborCost * bekistingDays;

      // Bekisting materials
      let bekistingMaterialCost = 0;
      const bekistingMaterials = [];

      // Kayu bekisting 3x5: 1 lembar per m² formwork (1 bendel = 10 lembar)
      const kayuQuantityLembar = quantities.formworkArea * 1 * (1 + wasteFactor);
      const kayuQuantityBendel = Math.ceil(kayuQuantityLembar / 10); // Round up to nearest bendel
      const kayuCost = kayuQuantityBendel * 850000; // Rp 850,000 per bendel (10 lembar)
      bekistingMaterialCost += kayuCost;
      bekistingMaterials.push({
        name: 'Kayu Bekisting 3x5',
        quantity: kayuQuantityBendel,
        unit: 'bendel',
        siQuantity: kayuQuantityLembar,
        siUnit: 'lembar',
        price: 850000,
        cost: kayuCost
      });

      // Paku: 0.5 kg per m²
      const pakuQuantity = quantities.formworkArea * 0.5 * (1 + wasteFactor);
      const pakuCost = pakuQuantity * 18000; // Rp 18,000 per kg
      bekistingMaterialCost += pakuCost;
      bekistingMaterials.push({
        name: 'Paku',
        quantity: pakuQuantity,
        unit: 'kg',
        siQuantity: pakuQuantity, // Same unit
        siUnit: 'kg',
        price: 18000,
        cost: pakuCost
      });

      const bekistingHPP = bekistingLaborCost + bekistingMaterialCost;
      const bekistingRAB = bekistingHPP * (1 + profitPercentage);

      subPekerjaan.push({
        name: 'Bekisting',
        volume: quantities.formworkArea,
        unit: 'm²',
        materials: bekistingMaterials,
        laborCost: bekistingLaborCost,
        materialCost: bekistingMaterialCost,
        hpp: bekistingHPP,
        rab: bekistingRAB,
        days: bekistingDays
      });

      // 3. BESI (Reinforcement)
      const besiTukang = parseInt(formData.besi_num_tukang) || 0;
      const besiPekerja = parseInt(formData.besi_num_pekerja) || 0;
      const besiWorkerRatio = formData.besi_worker_ratio || '1:1';
      const besiDailyLaborCost = (besiTukang * TUKANG_RATE) + (besiPekerja * PEKERJA_RATE);
      const besiTeams = calculateTeams(besiTukang, besiPekerja, besiWorkerRatio);
      
      const besiProductivity = 200; // kg/hari
      
      // Calculate total reinforcement weight
      const mainReinforcement = reinforcementOptions.find(r => r.value === formData.main_reinforcement);
      const stirrupReinforcement = reinforcementOptions.find(r => r.value === formData.stirrup_reinforcement);
      
      const mainWeight = quantities.mainReinforcementLength * (mainReinforcement?.weight || 1.578); // kg
      const stirrupWeight = quantities.stirrupLength * (stirrupReinforcement?.weight || 0.617); // kg
      const totalReinforcementWeight = mainWeight + stirrupWeight;

      const adjustedBesiProductivity = besiTeams > 0 ? besiProductivity * besiTeams : besiProductivity;
      const besiDays = adjustedBesiProductivity > 0 ? totalReinforcementWeight / adjustedBesiProductivity : 0;
      const besiLaborCost = besiDailyLaborCost * besiDays;

      // Besi materials
      let besiMaterialCost = 0;
      const besiMaterials = [];

      // Main reinforcement bars (12m per bar)
      const mainBars = Math.ceil(quantities.mainReinforcementLength / 12);
      const mainBarPrice = getReinforcementPrice(formData.main_reinforcement);
      const mainBarCost = mainBars * mainBarPrice * (1 + wasteFactor);
      const mainBarWeightKg = mainBars * (mainReinforcement?.weight || 1.578) * 12; // weight per meter * 12m per bar
      besiMaterialCost += mainBarCost;
      besiMaterials.push({
        name: `Besi Beton ${formData.main_reinforcement}`,
        quantity: mainBars,
        unit: 'batang',
        siQuantity: mainBarWeightKg,
        siUnit: 'kg',
        price: mainBarPrice,
        cost: mainBarCost
      });

      // Stirrup reinforcement bars
      const stirrupBars = Math.ceil(quantities.stirrupLength / 12);
      const stirrupBarPrice = getReinforcementPrice(formData.stirrup_reinforcement);
      const stirrupBarCost = stirrupBars * stirrupBarPrice * (1 + wasteFactor);
      const stirrupBarWeightKg = stirrupBars * (stirrupReinforcement?.weight || 0.617) * 12; // weight per meter * 12m per bar
      besiMaterialCost += stirrupBarCost;
      besiMaterials.push({
        name: `Besi Beton ${formData.stirrup_reinforcement}`,
        quantity: stirrupBars,
        unit: 'batang',
        siQuantity: stirrupBarWeightKg,
        siUnit: 'kg',
        price: stirrupBarPrice,
        cost: stirrupBarCost
      });

      // Kawat bendrat: 1 kg per m³ concrete (1 bendel = 5 kg)
      const kawatQuantityKg = quantities.concreteVolume * 1 * (1 + wasteFactor);
      const kawatQuantityBendel = Math.ceil(kawatQuantityKg / 5); // Round up to nearest bendel
      const kawatCost = kawatQuantityBendel * 125000; // Rp 125,000 per bendel
      besiMaterialCost += kawatCost;
      besiMaterials.push({
        name: 'Kawat Bendrat',
        quantity: kawatQuantityBendel,
        unit: 'bendel',
        siQuantity: kawatQuantityKg,
        siUnit: 'kg',
        price: 125000,
        cost: kawatCost
      });

      const besiHPP = besiLaborCost + besiMaterialCost;
      const besiRAB = besiHPP * (1 + profitPercentage);

      subPekerjaan.push({
        name: 'Besi',
        volume: totalReinforcementWeight,
        unit: 'kg',
        materials: besiMaterials,
        laborCost: besiLaborCost,
        materialCost: besiMaterialCost,
        hpp: besiHPP,
        rab: besiRAB,
        days: besiDays
      });

      // Calculate totals
      const totalLaborCost = subPekerjaan.reduce((sum, sub) => sum + sub.laborCost, 0);
      const totalMaterialCost = subPekerjaan.reduce((sum, sub) => sum + sub.materialCost, 0);
      const totalHPP = subPekerjaan.reduce((sum, sub) => sum + sub.hpp, 0);
      const totalRAB = subPekerjaan.reduce((sum, sub) => sum + sub.rab, 0);
      const totalKeuntungan = totalRAB - totalHPP;
      const totalDays = Math.max(...subPekerjaan.map(sub => sub.days));

      const result = {
        beamDimensions: {
          length: parseFloat(formData.beam_length),
          width: parseFloat(formData.beam_width),
          height: parseFloat(formData.beam_height),
          cover: parseFloat(formData.beam_cover)
        },
        reinforcement: {
          main: formData.main_reinforcement,
          stirrup: formData.stirrup_reinforcement,
          mainLength: quantities.mainReinforcementLength,
          stirrupLength: quantities.stirrupLength,
          stirrupSpacing: parseFloat(formData.stirrup_spacing),
          numberOfStirrups: quantities.numberOfStirrups,
          mainWeight,
          stirrupWeight,
          totalWeight: totalReinforcementWeight
        },
        quantities,
        subPekerjaan,
        totals: {
          laborCost: totalLaborCost,
          materialCost: totalMaterialCost,
          hpp: totalHPP,
          rab: totalRAB,
          keuntungan: totalKeuntungan,
          days: totalDays
        },
        workers: {
          beton: {
            tukang: betonTukang,
            pekerja: betonPekerja,
            ratio: betonWorkerRatio,
            dailyCost: betonDailyLaborCost,
            teams: betonTeams
          },
          bekisting: {
            tukang: bekistingTukang,
            pekerja: bekistingPekerja,
            ratio: bekistingWorkerRatio,
            dailyCost: bekistingDailyLaborCost,
            teams: bekistingTeams
          },
          besi: {
            tukang: besiTukang,
            pekerja: besiPekerja,
            ratio: besiWorkerRatio,
            dailyCost: besiDailyLaborCost,
            teams: besiTeams
          }
        },
        tukang: {
          count: betonTukang + bekistingTukang + besiTukang,
          rate: TUKANG_RATE
        },
        pekerja: {
          count: betonPekerja + bekistingPekerja + besiPekerja,
          rate: PEKERJA_RATE
        },
        profitPercentage: parseFloat(formData.profit_percentage),
        wasteFactor: parseFloat(formData.waste_factor),
        projectName: formData.project_name,
        workerRatio: `Beton(${betonWorkerRatio}), Bekisting(${bekistingWorkerRatio}), Besi(${besiWorkerRatio})`
      };

      setCalculation(result);
      
      // Call the completion callback if provided
      if (onCalculationComplete) {
        onCalculationComplete(result);
      }
      
      // Show success message
      toast.success('Kalkulasi balok berhasil dihitung!');
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghitung');
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Helper function to get reinforcement price
  const getReinforcementPrice = (reinforcementType) => {
    const prices = {
      'D8': 75000,
      'D10': 85000,
      'D12': 95000,
      'D16': 125000,
      'D19': 155000,
      'D22': 185000,
      'D25': 225000
    };
    return prices[reinforcementType] || 125000;
  };

  const handleSave = () => {
    if (!calculation) {
      toast.error('Tidak ada kalkulasi untuk disimpan');
      return;
    }

    // Save to localStorage as fallback
    const savedCalculations = JSON.parse(localStorage.getItem('beam_calculations') || '[]');
    const newCalculation = {
      ...calculation,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      jobType: jobType?.name || 'Kalkulator Struktur'
    };
    savedCalculations.unshift(newCalculation);
    localStorage.setItem('beam_calculations', JSON.stringify(savedCalculations.slice(0, 50)));
    toast.success('Kalkulasi balok berhasil disimpan!');
  };

  const handleExportPDF = async () => {
    if (!calculation) {
      toast.error('Tidak ada kalkulasi untuk diekspor');
      return;
    }

    try {
      // Try original beam-specific report generator first
      const { ConstructionReportGenerator } = await import('../../utils/reportGenerator');
      const reportGenerator = new ConstructionReportGenerator(calculation);
      const pdfDoc = reportGenerator.generateDetailedReport();
      const filename = `laporan-balok-${formData.project_name || 'struktur'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdfDoc.save(filename);
      toast.success('Laporan PDF berhasil diunduh!');
    } catch (error) {
      console.error('Beam PDF export error, trying generic generator:', error);
      
      try {
        // Fallback to generic report generator
        const { GenericReportGenerator } = await import('../../utils/genericReportGenerator');
      const reportGenerator = new GenericReportGenerator(calculation, 'beam', jobType);
        const filename = `laporan-balok-${formData.project_name || 'struktur'}-${new Date().toISOString().split('T')[0]}.pdf`;
        reportGenerator.save(filename);
        toast.success('Laporan PDF berhasil diunduh!');
      } catch (fallbackError) {
        console.error('Generic PDF export error:', fallbackError);
        toast.error('Gagal mengekspor PDF. Pastikan semua dependensi tersedia.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num, decimals = 2) => {
    return parseFloat(num).toFixed(decimals);
  };

  const filteredMaterials = availableMaterials.filter(material =>
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) &&
    !materials.some(m => m.id === material.id)
  );

  const quantities = calculateBeamQuantities();

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Building className="w-6 h-6 text-primary-600 mr-3" />
            Kalkulator Struktur
          </h2>
          <p className="text-gray-600 mt-1">
            Hitung biaya konstruksi balok beton bertulang dengan konfigurasi tulangan dan campuran beton
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Proyek
            </label>
            <input
              type="text"
              name="project_name"
              value={formData.project_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Masukkan nama proyek"
            />
          </div>

          {/* Beam Dimensions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
              <Ruler className="w-4 h-4 mr-2" />
              Dimensi Balok
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panjang Balok (m) *
                </label>
                <input
                  type="number"
                  name="beam_length"
                  value={formData.beam_length}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  step="0.01"
                  min="0.01"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.beam_length ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: 6.00"
                />
                {errors.beam_length && <p className="text-red-500 text-sm mt-1">{errors.beam_length}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lebar Balok (m) *
                </label>
                <input
                  type="number"
                  name="beam_width"
                  value={formData.beam_width}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  step="0.01"
                  min="0.01"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.beam_width ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: 0.30"
                />
                {errors.beam_width && <p className="text-red-500 text-sm mt-1">{errors.beam_width}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tinggi Balok (m) *
                </label>
                <input
                  type="number"
                  name="beam_height"
                  value={formData.beam_height}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  step="0.01"
                  min="0.01"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.beam_height ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: 0.50"
                />
                {errors.beam_height && <p className="text-red-500 text-sm mt-1">{errors.beam_height}</p>}
              </div>
            </div>

            {/* Volume Preview */}
            {quantities.concreteVolume > 0 && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600">
                  <strong>Volume Beton:</strong> {formatNumber(quantities.concreteVolume)} m³
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Luas Bekisting:</strong> {formatNumber(quantities.formworkArea)} m²
                </p>
              </div>
            )}
          </div>

          {/* Reinforcement Configuration */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Konfigurasi Tulangan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kualitas Beton *
                </label>
                <select
                  name="concrete_quality"
                  value={formData.concrete_quality}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {concreteQualityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selimut Balok (mm) *
                </label>
                <input
                  type="number"
                  name="beam_cover"
                  value={formData.beam_cover}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  step="1"
                  min="15"
                  max="50"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.beam_cover ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="25"
                />
                {errors.beam_cover && <p className="text-red-500 text-sm mt-1">{errors.beam_cover}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tulangan Utama *
                </label>
                <select
                  name="main_reinforcement"
                  value={formData.main_reinforcement}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {reinforcementOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tulangan Sengkang *
                </label>
                <select
                  name="stirrup_reinforcement"
                  value={formData.stirrup_reinforcement}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {reinforcementOptions.filter(opt => opt.diameter <= 12).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jarak Sengkang (mm) *
                </label>
                <input
                  type="number"
                  name="stirrup_spacing"
                  value={formData.stirrup_spacing}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onWheel={(e) => {
                    e.target.blur();
                  }}
                  step="10"
                  min="50"
                  max="300"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.stirrup_spacing ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="150"
                />
                {errors.stirrup_spacing && <p className="text-red-500 text-sm mt-1">{errors.stirrup_spacing}</p>}
              </div>
            </div>

            {/* Reinforcement Preview */}
            {quantities.mainReinforcementLength > 0 && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600">
                  <strong>Tulangan Utama:</strong> {formatNumber(quantities.mainReinforcementLength)} m ({formData.main_reinforcement})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Tulangan Sengkang:</strong> {formatNumber(quantities.stirrupLength)} m ({formData.stirrup_reinforcement})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Jumlah Sengkang:</strong> {quantities.numberOfStirrups} buah
                </p>
              </div>
            )}
          </div>

          {/* Productivity and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produktivitas (m³/hari) *
              </label>
              <input
                type="number"
                name="productivity"
                value={formData.productivity}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.target.blur();
                }}
                step="0.01"
                min="0.01"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.productivity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Produktivitas per hari"
              />
              {errors.productivity && <p className="text-red-500 text-sm mt-1">{errors.productivity}</p>}
              {jobType?.base_productivity && (
                <p className="text-xs text-gray-500 mt-1">
                  Nilai default dari job type: {jobType.name} ({jobType.base_productivity} {jobType.unit}/hari)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keuntungan (%) *
              </label>
              <input
                type="number"
                name="profit_percentage"
                value={formData.profit_percentage}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onWheel={(e) => {
                  e.target.blur();
                }}
                step="0.1"
                min="0"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.profit_percentage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Persentase profit"
              />
              {errors.profit_percentage && <p className="text-red-500 text-sm mt-1">{errors.profit_percentage}</p>}
              <p className="text-xs text-gray-500 mt-1">Minimal 0%, default 20%</p>
            </div>
          </div>

          {/* Waste Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faktor Pemborosan (%) *
            </label>
            <input
              type="number"
              name="waste_factor"
              value={formData.waste_factor}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onWheel={(e) => {
                e.target.blur();
              }}
              step="0.1"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.waste_factor ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="5"
            />
            {errors.waste_factor && <p className="text-red-500 text-sm mt-1">{errors.waste_factor}</p>}
            <p className="text-xs text-gray-500 mt-1">Minimal 0%, default 5%</p>
          </div>

          {/* Workers Configuration for Each Sub-Pekerjaan */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Tenaga Kerja per Sub Pekerjaan</h3>
            
            {/* Beton Workers */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">👷 Tenaga Kerja Beton</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rasio (Tukang:Pekerja) *
                  </label>
                  <select
                    name="beton_worker_ratio"
                    value={formData.beton_worker_ratio}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="1:0">1:0 (1 Tukang : 0 Pekerja)</option>
                    <option value="0:1">0:1 (0 Tukang : 1 Pekerja)</option>
                    <option value="1:1">1:1 (1 Tukang : 1 Pekerja)</option>
                    <option value="2:1">2:1 (2 Tukang : 1 Pekerja)</option>
                    <option value="1:2">1:2 (1 Tukang : 2 Pekerja)</option>
                    <option value="1:3">1:3 (1 Tukang : 3 Pekerja)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Tukang *
                  </label>
                  <input
                    type="number"
                    name="beton_num_tukang"
                    value={formData.beton_num_tukang}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.beton_workers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Pekerja *
                  </label>
                  <input
                    type="number"
                    name="beton_num_pekerja"
                    value={formData.beton_num_pekerja}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.beton_workers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2"
                  />
                </div>
              </div>
              {errors.beton_workers && <p className="text-red-500 text-sm mt-2">{errors.beton_workers}</p>}
            </div>

            {/* Bekisting Workers */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3">🔨 Tenaga Kerja Bekisting</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rasio (Tukang:Pekerja) *
                  </label>
                  <select
                    name="bekisting_worker_ratio"
                    value={formData.bekisting_worker_ratio}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="1:0">1:0 (1 Tukang : 0 Pekerja)</option>
                    <option value="0:1">0:1 (0 Tukang : 1 Pekerja)</option>
                    <option value="1:1">1:1 (1 Tukang : 1 Pekerja)</option>
                    <option value="2:1">2:1 (2 Tukang : 1 Pekerja)</option>
                    <option value="1:2">1:2 (1 Tukang : 2 Pekerja)</option>
                    <option value="1:3">1:3 (1 Tukang : 3 Pekerja)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Tukang *
                  </label>
                  <input
                    type="number"
                    name="bekisting_num_tukang"
                    value={formData.bekisting_num_tukang}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.bekisting_workers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Pekerja *
                  </label>
                  <input
                    type="number"
                    name="bekisting_num_pekerja"
                    value={formData.bekisting_num_pekerja}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.bekisting_workers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                </div>
              </div>
              {errors.bekisting_workers && <p className="text-red-500 text-sm mt-2">{errors.bekisting_workers}</p>}
            </div>

            {/* Besi Workers */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">⚙️ Tenaga Kerja Besi</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rasio (Tukang:Pekerja) *
                  </label>
                  <select
                    name="besi_worker_ratio"
                    value={formData.besi_worker_ratio}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="1:0">1:0 (1 Tukang : 0 Pekerja)</option>
                    <option value="0:1">0:1 (0 Tukang : 1 Pekerja)</option>
                    <option value="1:1">1:1 (1 Tukang : 1 Pekerja)</option>
                    <option value="2:1">2:1 (2 Tukang : 1 Pekerja)</option>
                    <option value="1:2">1:2 (1 Tukang : 2 Pekerja)</option>
                    <option value="1:3">1:3 (1 Tukang : 3 Pekerja)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Tukang *
                  </label>
                  <input
                    type="number"
                    name="besi_num_tukang"
                    value={formData.besi_num_tukang}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.besi_workers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Pekerja *
                  </label>
                  <input
                    type="number"
                    name="besi_num_pekerja"
                    value={formData.besi_num_pekerja}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.besi_workers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                </div>
              </div>
              {errors.besi_workers && <p className="text-red-500 text-sm mt-2">{errors.besi_workers}</p>}
            </div>
          </div>

          {/* Materials Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Material (Opsional)
            </label>
            
            {/* Selected Materials */}
            {materials.length > 0 && (
              <div className="mb-4 space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{material.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(material.marketPrice)}/{material.marketUnit} ({formatCurrency(material.siPrice)}/{material.siUnit})
                        {material.supplier && ` • ${material.supplier}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => updateMaterialQuantity(material.id, e.target.value)}
                        onFocus={handleInputFocus}
                        onWheel={(e) => {
                          e.target.blur();
                        }}
                        step="0.01"
                        min="0"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Qty"
                      />
                      <span className="text-sm text-gray-600">{material.marketUnit}/m³</span>
                      <button
                        type="button"
                        onClick={() => removeMaterial(material.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Material Button */}
            <button
              type="button"
              onClick={() => setShowMaterialSelector(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-gray-600 hover:text-primary-600"
            >
              <Plus className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">Tambah Material</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={calculateCosts}
                disabled={isCalculating}
                className={`flex-1 btn-primary flex items-center justify-center space-x-2 ${
                  isCalculating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Calculator className="w-5 h-5" />
                <span>{isCalculating ? 'Menghitung...' : 'Hitung'}</span>
              </button>

              {calculation && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Simpan</span>
                </button>
              )}
            </div>

            {calculation && (
              <button
                type="button"
                onClick={handleExportPDF}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      {calculation && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              Hasil Kalkulasi Struktur
            </h3>
            {calculation.projectName && (
              <p className="text-gray-600 mt-2">Proyek: {calculation.projectName}</p>
            )}
            <div className="mt-2 text-sm text-gray-600">
              <p>Dimensi: {calculation.beamDimensions.length}m × {calculation.beamDimensions.width}m × {calculation.beamDimensions.height}m</p>
              <p>Tulangan: {calculation.reinforcement.main} (utama), {calculation.reinforcement.stirrup} (sengkang)</p>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 table-fixed">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-32">Sub Pekerjaan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Volume</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-16">Satuan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-32">Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Hari Kerja</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP Bahan</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP Tukang</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">HPP</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">RAB</th>
                    <th className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs w-24">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.subPekerjaan.map((sub, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-2 text-xs w-32">
                        <div className="font-medium text-gray-900">{sub.name}</div>
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                        {formatNumber(sub.volume)}
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                        {sub.unit}
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-xs w-32">
                        <div className="space-y-1">
                          {sub.materials.map((material, matIndex) => (
                            <div key={matIndex} className="text-xs">
                              <div className="font-medium truncate" title={material.name}>{material.name}</div>
                              <div className="text-gray-600">
                                {formatNumber(material.quantity)} {material.unit}
                                {material.siQuantity && (
                                  <span className="text-gray-500"> ({formatNumber(material.siQuantity)} {material.siUnit})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center text-xs w-24">
                        {formatNumber(sub.days, 1)} hari
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center font-medium text-blue-600 text-xs w-24">
                        {formatCurrency(sub.materialCost)}
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center font-medium text-blue-600 text-xs w-24">
                        {formatCurrency(sub.laborCost)}
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-700 text-xs w-24">
                        {formatCurrency(sub.hpp)}
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center font-bold text-green-700 text-xs w-24">
                        {formatCurrency(sub.rab)}
                      </td>
                      <td className="border border-gray-300 px-1 py-2 text-center font-bold text-orange-700 text-xs w-24">
                        {formatCurrency(sub.rab - sub.hpp)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                    <td className="border border-gray-300 px-2 py-2 text-xs w-32">
                      <div className="font-bold text-gray-900">TOTAL</div>
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      -
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-16">
                      -
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-32">
                      -
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center text-xs w-24">
                      {formatNumber(calculation.totals.days, 1)} hari
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-700 bg-blue-100 text-xs w-24">
                      {formatCurrency(calculation.totals.materialCost)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-700 bg-blue-100 text-xs w-24">
                      {formatCurrency(calculation.totals.laborCost)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-800 bg-blue-200 text-xs w-24">
                      {formatCurrency(calculation.totals.hpp)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-green-800 bg-green-200 text-xs w-24">
                      {formatCurrency(calculation.totals.rab)}
                    </td>
                    <td className="border border-gray-300 px-1 py-2 text-center font-bold text-orange-800 bg-orange-200 text-xs w-24">
                      {formatCurrency(calculation.totals.keuntungan)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detail Information */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Beam Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Detail Balok</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Panjang:</span>
                    <span className="font-medium">{calculation.beamDimensions.length} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lebar:</span>
                    <span className="font-medium">{calculation.beamDimensions.width} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tinggi:</span>
                    <span className="font-medium">{calculation.beamDimensions.height} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selimut:</span>
                    <span className="font-medium">{calculation.beamDimensions.cover} mm</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Volume Beton:</span>
                    <span className="font-bold text-blue-600">{formatNumber(calculation.quantities.concreteVolume)} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Luas Bekisting:</span>
                    <span className="font-bold text-blue-600">{formatNumber(calculation.quantities.formworkArea)} m²</span>
                  </div>
                </div>
              </div>

              {/* Reinforcement Details */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">Detail Tulangan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tulangan Utama:</span>
                    <span className="font-medium">{calculation.reinforcement.main}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Panjang Utama:</span>
                    <span className="font-medium">{formatNumber(calculation.reinforcement.mainLength)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tulangan Sengkang:</span>
                    <span className="font-medium">{calculation.reinforcement.stirrup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Panjang Sengkang:</span>
                    <span className="font-medium">{formatNumber(calculation.reinforcement.stirrupLength)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jarak Sengkang:</span>
                    <span className="font-medium">{calculation.reinforcement.stirrupSpacing} mm</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Jumlah Sengkang:</span>
                    <span className="font-bold text-green-600">{calculation.reinforcement.numberOfStirrups} buah</span>
                  </div>
                </div>
              </div>

              {/* Labor Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Detail Tenaga Kerja</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Upah Tukang/hari:</span>
                    <span className="font-medium">{formatCurrency(TUKANG_RATE)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upah Pekerja/hari:</span>
                    <span className="font-medium">{formatCurrency(PEKERJA_RATE)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Tukang:</span>
                    <span className="font-medium">{calculation.tukang.count} orang</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Pekerja:</span>
                    <span className="font-medium">{calculation.pekerja.count} orang</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rasio Pekerja:</span>
                    <span className="font-medium">{calculation.workerRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Upah/hari:</span>
                    <span className="font-medium">{formatCurrency((calculation.tukang.count * TUKANG_RATE) + (calculation.pekerja.count * PEKERJA_RATE))}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Hari Kerja:</span>
                    <span className="font-bold text-gray-600">{formatNumber(calculation.totals.days, 1)} hari</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Pekerjaan Details */}
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Detail Sub Pekerjaan</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calculation.subPekerjaan.map((sub, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    sub.name === 'Beton' ? 'bg-blue-50 border-blue-200' :
                    sub.name === 'Bekisting' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <h5 className={`font-semibold mb-3 ${
                      sub.name === 'Beton' ? 'text-blue-900' :
                      sub.name === 'Bekisting' ? 'text-yellow-900' :
                      'text-green-900'
                    }`}>{sub.name}</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span className="font-medium">{formatNumber(sub.volume)} {sub.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hari Kerja:</span>
                        <span className="font-medium">{formatNumber(sub.days, 1)} hari</span>
                      </div>
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>HPP Bahan:</span>
                          <span className="font-medium">{formatCurrency(sub.materialCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HPP Tukang:</span>
                          <span className="font-medium">{formatCurrency(sub.laborCost)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total HPP:</span>
                          <span className="text-blue-600">{formatCurrency(sub.hpp)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total RAB:</span>
                          <span className="text-green-600">{formatCurrency(sub.rab)}</span>
                        </div>
                      </div>
                      <div className="border-t pt-2">
                        <h6 className="font-medium mb-1">Material:</h6>
                        {sub.materials.map((material, matIndex) => (
                          <div key={matIndex} className="text-xs text-gray-600">
                            • {material.name}: {formatNumber(material.quantity)} {material.unit}
                            {material.siQuantity && material.siUnit !== material.unit && (
                              <span className="text-gray-500"> ({formatNumber(material.siQuantity)} {material.siUnit})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Total HPP</h4>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.totals.hpp)}</p>
                <p className="text-sm text-blue-700 mt-1">Harga Pokok Produksi</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Total RAB</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculation.totals.rab)}</p>
                <p className="text-sm text-green-700 mt-1">Rencana Anggaran Biaya</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Keuntungan ({calculation.profitPercentage}%)</h4>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculation.totals.keuntungan)}</p>
                <p className="text-sm text-orange-700 mt-1">Margin Keuntungan</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Material Selector Modal */}
      {showMaterialSelector && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          style={{ 
            overflow: 'hidden',
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '16px'
          }}
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowMaterialSelector(false);
              setMaterialSearch('');
            }
          }}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pilih Material</h3>
                <button
                  onClick={() => {
                    setShowMaterialSelector(false);
                    setMaterialSearch('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari material..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {filteredMaterials.length > 0 ? (
                <div className="space-y-2">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => addMaterial(material)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{material.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(material.marketPrice)}/{material.marketUnit} ({formatCurrency(material.siPrice)}/{material.siUnit})
                            {material.supplier && ` • ${material.supplier}`}
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {materialSearch ? 'Tidak ada material yang ditemukan' : 'Mulai mengetik untuk mencari material'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeamCalculator;
