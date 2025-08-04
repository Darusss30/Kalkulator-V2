/**
 * Dynamic Material Converter
 * Sistem konversi material yang dinamis berdasarkan database rules
 * Menggantikan sistem statis dengan sistem yang dapat dikonfigurasi
 */

import { api } from '../services/api';

class DynamicMaterialConverter {
  constructor() {
    this.cachedRules = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get conversion rules from database with caching
   */
  async getConversionRules() {
    const now = Date.now();
    
    // Return cached rules if still valid
    if (this.cachedRules && this.cacheExpiry && now < this.cacheExpiry) {
      return this.cachedRules;
    }

    try {
      const response = await api.get('/material-conversion-rules', {
        params: {
          active_only: true,
          limit: 100
        }
      });

      this.cachedRules = response.data.rules || [];
      this.cacheExpiry = now + this.cacheTimeout;
      
      return this.cachedRules;
    } catch (error) {
      console.error('Error fetching conversion rules:', error);
      
      // Return cached rules if available, otherwise empty array
      return this.cachedRules || [];
    }
  }

  /**
   * Get conversion suggestions from API
   */
  async getConversionSuggestions(materialName, unit, jobTypeName = null) {
    try {
      const response = await api.post('/material-conversion-rules/suggest', {
        material_name: materialName,
        unit: unit,
        job_type_name: jobTypeName
      });

      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error getting conversion suggestions:', error);
      return [];
    }
  }

  /**
   * Generate conversion suggestions based on database rules
   */
  async generateDynamicConversion(materialName, unit, jobTypeName = null) {
    if (!materialName || !unit) {
      return null;
    }

    // Get suggestions from API
    const suggestions = await this.getConversionSuggestions(materialName, unit, jobTypeName);
    
    if (suggestions.length === 0) {
      return null;
    }

    // Return the highest priority suggestion
    const bestSuggestion = suggestions[0];
    
    return {
      conversion_factor: bestSuggestion.conversion_factor,
      base_unit: bestSuggestion.base_unit,
      conversion_description: bestSuggestion.conversion_description,
      material_type: bestSuggestion.material_type,
      rule_name: bestSuggestion.rule_name,
      conversion_data: bestSuggestion.conversion_data,
      is_dynamic: true, // Flag to indicate this is from dynamic system
      source: 'database_rule'
    };
  }

  /**
   * Get job-specific conversion with enhanced logic
   */
  async generateJobSpecificConversion(jobTypeName, materialName, unit) {
    if (!jobTypeName || !materialName || !unit) {
      return null;
    }

    // Get suggestions with job type context
    const suggestions = await this.getConversionSuggestions(materialName, unit, jobTypeName);
    
    if (suggestions.length === 0) {
      // Fallback to general conversion
      return await this.generateDynamicConversion(materialName, unit);
    }

    const bestSuggestion = suggestions[0];
    
    // Enhanced conversion with job-specific data
    const conversion = {
      conversion_factor: bestSuggestion.conversion_factor,
      base_unit: bestSuggestion.base_unit,
      conversion_description: bestSuggestion.conversion_description,
      material_type: bestSuggestion.material_type,
      rule_name: bestSuggestion.rule_name,
      conversion_data: bestSuggestion.conversion_data,
      is_dynamic: true,
      source: 'database_rule',
      job_specific_data: {
        category: this.detectJobCategory(jobTypeName),
        grade: this.detectConcreteGrade(jobTypeName),
        job_type: jobTypeName
      }
    };

    // Add specific usage data if available in conversion_data
    if (bestSuggestion.conversion_data) {
      const data = bestSuggestion.conversion_data;
      
      // Add concrete grade specific usage
      if (data.usage_per_m3_concrete && conversion.job_specific_data.grade) {
        const grade = conversion.job_specific_data.grade;
        if (data.usage_per_m3_concrete[grade]) {
          conversion.job_specific_data.requirement = {
            quantity: data.usage_per_m3_concrete[grade],
            unit: `${bestSuggestion.base_unit}/m³`,
            grade: grade
          };
        }
      }

      // Add specific usage for granite work
      if (data.specific_usage && data.specific_usage.granite_per_m2) {
        conversion.job_specific_data.requirement = {
          quantity: data.specific_usage.granite_per_m2,
          unit: `${bestSuggestion.base_unit}/m²`,
          work_type: 'granite'
        };
      }
    }

    return conversion;
  }

  /**
   * Detect job category from job type name
   */
  detectJobCategory(jobTypeName) {
    const jobName = jobTypeName.toLowerCase();
    
    if (jobName.includes('beton') || jobName.includes('struktur') || jobName.includes('balok') || 
        jobName.includes('kolom') || jobName.includes('footplate')) {
      return 'struktur_beton';
    } else if (jobName.includes('lantai') || jobName.includes('granit') || jobName.includes('keramik')) {
      return 'pekerjaan_lantai';
    } else if (jobName.includes('dinding') || jobName.includes('bata') || jobName.includes('tembok')) {
      return 'pekerjaan_dinding';
    } else if (jobName.includes('plester') || jobName.includes('acian') || jobName.includes('finishing')) {
      return 'finishing';
    }
    
    return 'umum';
  }

  /**
   * Detect concrete grade from job type name
   */
  detectConcreteGrade(jobTypeName) {
    const gradeMatch = jobTypeName.match(/k[-\s]?(\d+)/i);
    return gradeMatch ? `K-${gradeMatch[1]}` : null;
  }

  /**
   * Get material requirements for specific job type (dynamic version)
   */
  async getJobTypeMaterialRequirements(jobTypeName, jobTypeUnit) {
    const requirements = [];
    
    try {
      // Get all active rules
      const rules = await this.getConversionRules();
      
      // Filter rules that might be relevant for this job type
      const relevantRules = rules.filter(rule => {
        if (!rule.job_category_pattern) return false;
        
        const jobName = jobTypeName.toLowerCase();
        const pattern = new RegExp(rule.job_category_pattern, 'i');
        return pattern.test(jobName);
      });

      // Generate requirements from relevant rules
      for (const rule of relevantRules) {
        if (rule.conversion_data && rule.conversion_data.usage_per_m3_concrete) {
          const grade = this.detectConcreteGrade(jobTypeName) || 'K-250';
          const usage = rule.conversion_data.usage_per_m3_concrete[grade];
          
          if (usage) {
            requirements.push({
              material_type: rule.rule_name,
              unit: this.getUnitFromPattern(rule.unit_pattern),
              quantity_per_unit: usage,
              description: `Kebutuhan untuk ${grade}`,
              conversion_info: rule.conversion_description,
              rule_id: rule.id
            });
          }
        }
      }

      return requirements;
    } catch (error) {
      console.error('Error getting job type material requirements:', error);
      return [];
    }
  }

  /**
   * Extract unit from pattern (simple heuristic)
   */
  getUnitFromPattern(unitPattern) {
    // Extract first unit from pattern like "sak|zak" -> "sak"
    const units = unitPattern.split('|');
    return units[0] || unitPattern;
  }

  /**
   * Calculate material cost with dynamic conversion
   */
  async calculateDynamicMaterialCost(material, quantity, jobType) {
    const conversion = await this.generateJobSpecificConversion(
      jobType.name, 
      material.name, 
      material.unit
    );
    
    if (!conversion) {
      // Fallback to standard calculation
      return {
        quantity: quantity,
        unit: material.unit,
        unitPrice: material.price,
        totalCost: quantity * material.price,
        conversion: null,
        source: 'standard'
      };
    }

    // Calculate with dynamic conversion
    const baseQuantity = quantity * (conversion.conversion_factor || 1);
    const baseUnitPrice = material.price / (conversion.conversion_factor || 1);
    
    return {
      quantity: quantity,
      unit: material.unit,
      baseQuantity: baseQuantity,
      baseUnit: conversion.base_unit,
      unitPrice: material.price,
      baseUnitPrice: baseUnitPrice,
      totalCost: quantity * material.price,
      conversion: conversion,
      jobSpecificData: conversion.job_specific_data,
      source: 'dynamic_rule'
    };
  }

  /**
   * Clear cache (useful for testing or when rules are updated)
   */
  clearCache() {
    this.cachedRules = null;
    this.cacheExpiry = null;
  }

  /**
   * Get conversion presets
   */
  async getConversionPresets(category = null) {
    try {
      const response = await api.get('/material-conversion-rules/presets', {
        params: category ? { category } : {}
      });

      return response.data.presets || [];
    } catch (error) {
      console.error('Error fetching conversion presets:', error);
      return [];
    }
  }

  /**
   * Use a preset (increment usage count)
   */
  async usePreset(presetId) {
    try {
      await api.post(`/material-conversion-rules/presets/${presetId}/use`);
    } catch (error) {
      console.error('Error updating preset usage:', error);
    }
  }
}

// Create singleton instance
const dynamicMaterialConverter = new DynamicMaterialConverter();

export default dynamicMaterialConverter;

// Export individual functions for backward compatibility
export const {
  generateDynamicConversion,
  generateJobSpecificConversion,
  getJobTypeMaterialRequirements,
  calculateDynamicMaterialCost,
  getConversionPresets,
  usePreset,
  clearCache
} = dynamicMaterialConverter;
