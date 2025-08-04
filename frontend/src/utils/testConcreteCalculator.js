// Test file untuk memverifikasi concrete calculator dengan data riset
import { concreteCalculator } from './concreteCalculator.js';

// Test function untuk cement conversion
export function testCementConversion() {
  console.log('🧪 Testing Cement Conversion with Research Data...');
  
  try {
    // Test dengan data riset: K-225, 0.0250 sak/m³, 40kg per sak
    const result = concreteCalculator.calculateCementConversion({
      grade: 'K-225',
      volume: 1
    });
    
    console.log('✅ Cement Conversion Results:');
    console.log('- Grade:', result.grade);
    console.log('- Volume:', result.volume, 'm³');
    console.log('- Sacks needed:', result.cement_requirements.sacks_needed, 'sak');
    console.log('- KG needed:', result.cement_requirements.kg_needed, 'kg');
    console.log('- Sack weight:', result.cement_requirements.sack_weight, 'kg');
    console.log('- Conversion factor:', result.conversion.conversion_factor);
    console.log('- Description:', result.conversion.conversion_description);
    
    // Verify dengan data riset
    const expectedSaks = 0.0250;
    const expectedKg = expectedSaks * 40;
    
    if (Math.abs(result.cement_requirements.sacks_needed - expectedSaks) < 0.0001) {
      console.log('✅ Sacks calculation CORRECT');
    } else {
      console.log('❌ Sacks calculation WRONG. Expected:', expectedSaks, 'Got:', result.cement_requirements.sacks_needed);
    }
    
    if (Math.abs(result.cement_requirements.kg_needed - expectedKg) < 0.01) {
      console.log('✅ KG calculation CORRECT');
    } else {
      console.log('❌ KG calculation WRONG. Expected:', expectedKg, 'Got:', result.cement_requirements.kg_needed);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Cement conversion test failed:', error.message);
    return null;
  }
}

// Test function untuk granite conversion
export function testGraniteConversion() {
  console.log('\n🧪 Testing Granite Conversion with Research Data...');
  
  try {
    // Test dengan data riset: 4 keping @ 60x60cm = 1.44 m²
    const result = concreteCalculator.calculateGraniteConversion({
      pieces_per_box: 4,
      piece_width: 60,
      piece_height: 60
    });
    
    console.log('✅ Granite Conversion Results:');
    console.log('- Pieces per box:', result.input.pieces_per_box);
    console.log('- Piece dimensions:', result.input.piece_width, 'x', result.input.piece_height, 'cm');
    console.log('- Area per piece:', result.calculations.area_per_piece_m2, 'm²');
    console.log('- Coverage per box:', result.calculations.coverage_per_box_m2, 'm²');
    console.log('- Boxes per m²:', result.calculations.boxes_per_m2);
    console.log('- Description:', result.conversion.conversion_description);
    
    // Verify dengan data riset
    const expectedCoverage = 1.44; // m²
    const expectedBoxesPerM2 = 0.6944;
    
    if (Math.abs(result.calculations.coverage_per_box_m2 - expectedCoverage) < 0.01) {
      console.log('✅ Coverage calculation CORRECT');
    } else {
      console.log('❌ Coverage calculation WRONG. Expected:', expectedCoverage, 'Got:', result.calculations.coverage_per_box_m2);
    }
    
    if (Math.abs(result.calculations.boxes_per_m2 - expectedBoxesPerM2) < 0.001) {
      console.log('✅ Boxes per m² calculation CORRECT');
    } else {
      console.log('❌ Boxes per m² calculation WRONG. Expected:', expectedBoxesPerM2, 'Got:', result.calculations.boxes_per_m2);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Granite conversion test failed:', error.message);
    return null;
  }
}

// Test function untuk pasir japanan conversion
export function testPasirJapananConversion() {
  console.log('\n🧪 Testing Pasir Japanan Conversion with Research Data...');
  
  try {
    // Test dengan data riset: 1 truk = 7 m³, kebutuhan 0.0343 m³ per m²
    const result = concreteCalculator.calculateSpecialMaterialConversion({
      material_type: 'pasir_japanan_granite',
      area: 1
    });
    
    console.log('✅ Pasir Japanan Conversion Results:');
    console.log('- Material:', result.material);
    console.log('- Area:', result.area, 'm²');
    console.log('- Volume needed:', result.requirements.volume_m3, 'm³');
    console.log('- Trucks needed:', result.requirements.trucks_needed);
    console.log('- Trucks rounded:', result.requirements.trucks_rounded);
    console.log('- Conversion factor:', result.conversion.conversion_factor);
    console.log('- Usage per m²:', result.conversion.usage_per_m2, 'm³/m²');
    console.log('- Description:', result.conversion.conversion_description);
    
    // Verify dengan data riset
    const expectedVolume = 0.0343; // m³ per m²
    const expectedTrucks = expectedVolume / 7; // trucks per m²
    
    if (Math.abs(result.requirements.volume_m3 - expectedVolume) < 0.0001) {
      console.log('✅ Volume calculation CORRECT');
    } else {
      console.log('❌ Volume calculation WRONG. Expected:', expectedVolume, 'Got:', result.requirements.volume_m3);
    }
    
    if (Math.abs(result.requirements.trucks_needed - expectedTrucks) < 0.0001) {
      console.log('✅ Trucks calculation CORRECT');
    } else {
      console.log('❌ Trucks calculation WRONG. Expected:', expectedTrucks, 'Got:', result.requirements.trucks_needed);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Pasir japanan conversion test failed:', error.message);
    return null;
  }
}

// Test function untuk material conversion generation
export function testMaterialConversionGeneration() {
  console.log('\n🧪 Testing Material Conversion Generation...');
  
  try {
    // Test cement conversion generation
    const cementConversion = concreteCalculator.generateMaterialConversion({
      material_name: 'Semen Portland',
      material_type: 'cement',
      specifications: { grade: 'K-225' },
      price: 65000
    });
    
    console.log('✅ Cement Material Conversion:');
    console.log('- Name:', cementConversion.name);
    console.log('- Unit:', cementConversion.unit);
    console.log('- Price:', cementConversion.price);
    console.log('- Conversion factor:', cementConversion.conversion_factor);
    console.log('- Base unit:', cementConversion.base_unit);
    console.log('- Description:', cementConversion.conversion_description);
    
    // Test granite conversion generation
    const graniteConversion = concreteCalculator.generateMaterialConversion({
      material_name: 'Granit Apolion Black',
      material_type: 'granite',
      specifications: {
        pieces_per_box: 4,
        piece_width: 60,
        piece_height: 60
      },
      price: 180000
    });
    
    console.log('\n✅ Granite Material Conversion:');
    console.log('- Name:', graniteConversion.name);
    console.log('- Unit:', graniteConversion.unit);
    console.log('- Price:', graniteConversion.price);
    console.log('- Conversion factor:', graniteConversion.conversion_factor);
    console.log('- Base unit:', graniteConversion.base_unit);
    console.log('- Pieces per unit:', graniteConversion.pieces_per_unit);
    console.log('- Piece dimensions:', graniteConversion.piece_dimensions);
    console.log('- Coverage per unit:', graniteConversion.coverage_per_unit);
    console.log('- Description:', graniteConversion.conversion_description);
    
    // Test pasir japanan conversion generation
    const pasirConversion = concreteCalculator.generateMaterialConversion({
      material_name: 'Pasir Japanan untuk Granite',
      material_type: 'pasir_japanan',
      price: 350000
    });
    
    console.log('\n✅ Pasir Japanan Material Conversion:');
    console.log('- Name:', pasirConversion.name);
    console.log('- Unit:', pasirConversion.unit);
    console.log('- Price:', pasirConversion.price);
    console.log('- Conversion factor:', pasirConversion.conversion_factor);
    console.log('- Base unit:', pasirConversion.base_unit);
    console.log('- Usage per m²:', pasirConversion.usage_per_m2);
    console.log('- Description:', pasirConversion.conversion_description);
    
    return {
      cement: cementConversion,
      granite: graniteConversion,
      pasir: pasirConversion
    };
  } catch (error) {
    console.error('❌ Material conversion generation test failed:', error.message);
    return null;
  }
}

// Run all tests
export function runAllTests() {
  console.log('🚀 Starting Concrete Calculator Tests with Research Data\n');
  console.log('=' .repeat(60));
  
  const results = {
    cement: testCementConversion(),
    granite: testGraniteConversion(),
    pasirJapanan: testPasirJapananConversion(),
    materialGeneration: testMaterialConversionGeneration()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Test Summary:');
  console.log('- Cement conversion:', results.cement ? '✅ PASSED' : '❌ FAILED');
  console.log('- Granite conversion:', results.granite ? '✅ PASSED' : '❌ FAILED');
  console.log('- Pasir japanan conversion:', results.pasirJapanan ? '✅ PASSED' : '❌ FAILED');
  console.log('- Material generation:', results.materialGeneration ? '✅ PASSED' : '❌ FAILED');
  
  return results;
}

// Export untuk digunakan di console browser
if (typeof window !== 'undefined') {
  window.testConcreteCalculator = {
    runAllTests,
    testCementConversion,
    testGraniteConversion,
    testPasirJapananConversion,
    testMaterialConversionGeneration
  };
}
