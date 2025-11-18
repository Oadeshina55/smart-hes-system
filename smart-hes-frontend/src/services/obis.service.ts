import axios from 'axios';

export interface ObisFunction {
  code: string;
  name: string;
  description: string;
  unit?: string;
  brand: 'hexing' | 'hexcell';
  group: string;
  attributeId?: number;
  classId?: number;
}

export interface ObisGroup {
  name: string;
  functions: ObisFunction[];
}

export interface ParameterCategory {
  category: string;
  subcategories: {
    name: string;
    parameters: ObisFunction[];
  }[];
}

class ObisService {
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all OBIS functions for a specific brand
   */
  async getAllFunctions(brand?: 'hexing' | 'hexcell'): Promise<ObisFunction[]> {
    const cacheKey = `functions_${brand || 'all'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`/api/obis/functions`, {
        params: brand ? { brand } : {},
      });

      const functions = response.data.data.functions;
      this.cache.set(cacheKey, { data: functions, timestamp: Date.now() });
      return functions;
    } catch (error) {
      console.error('Failed to fetch OBIS functions:', error);
      return [];
    }
  }

  /**
   * Get all available groups
   */
  async getGroups(brand?: 'hexing' | 'hexcell'): Promise<string[]> {
    const cacheKey = `groups_${brand || 'all'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`/api/obis/groups`, {
        params: brand ? { brand } : {},
      });

      const groups = response.data.data.groups;
      this.cache.set(cacheKey, { data: groups, timestamp: Date.now() });
      return groups;
    } catch (error) {
      console.error('Failed to fetch OBIS groups:', error);
      return [];
    }
  }

  /**
   * Get functions by group
   */
  async getFunctionsByGroup(groupName: string, brand?: 'hexing' | 'hexcell'): Promise<ObisFunction[]> {
    const cacheKey = `group_${groupName}_${brand || 'all'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`/api/obis/groups/${encodeURIComponent(groupName)}`, {
        params: brand ? { brand } : {},
      });

      const functions = response.data.data.functions;
      this.cache.set(cacheKey, { data: functions, timestamp: Date.now() });
      return functions;
    } catch (error) {
      console.error(`Failed to fetch functions for group ${groupName}:`, error);
      return [];
    }
  }

  /**
   * Get a specific OBIS function by code
   */
  async getFunction(code: string): Promise<ObisFunction | null> {
    const cacheKey = `function_${code}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`/api/obis/functions/${encodeURIComponent(code)}`);
      const func = response.data.data;
      this.cache.set(cacheKey, { data: func, timestamp: Date.now() });
      return func;
    } catch (error) {
      console.error(`Failed to fetch function for code ${code}:`, error);
      return null;
    }
  }

  /**
   * Parse OBIS functions into organized categories
   * This creates a hierarchical structure for display
   */
  async getCategorizedParameters(brand?: 'hexing' | 'hexcell'): Promise<ParameterCategory[]> {
    const functions = await this.getAllFunctions(brand);

    // Define major categories based on OBIS code patterns and descriptions
    const categories: ParameterCategory[] = [
      { category: 'Voltage', subcategories: [] },
      { category: 'Current', subcategories: [] },
      { category: 'Power', subcategories: [] },
      { category: 'Energy', subcategories: [] },
      { category: 'Power Quality', subcategories: [] },
      { category: 'Clock & Time', subcategories: [] },
      { category: 'Meter Information', subcategories: [] },
      { category: 'Demand', subcategories: [] },
      { category: 'Relay Control', subcategories: [] },
      { category: 'Events & Alarms', subcategories: [] },
      { category: 'Load Profile', subcategories: [] },
      { category: 'Tariff & Billing', subcategories: [] },
      { category: 'Communication', subcategories: [] },
      { category: 'Security & Authentication', subcategories: [] },
    ];

    // Categorize each function
    functions.forEach((func) => {
      this.categorizeFunction(func, categories);
    });

    // Remove empty categories
    return categories.filter(cat => cat.subcategories.length > 0);
  }

  /**
   * Categorize a single function into the appropriate category
   */
  private categorizeFunction(func: ObisFunction, categories: ParameterCategory[]) {
    const code = func.code;
    const desc = func.description.toLowerCase();
    const name = func.name.toLowerCase();

    // Voltage parameters (32, 52, 72 are voltage codes for L1, L2, L3)
    if (code.includes(':32.7.') || code.includes(':52.7.') || code.includes(':72.7.') ||
        desc.includes('voltage') || desc.includes('电压')) {
      const voltageCategory = categories.find(c => c.category === 'Voltage');
      if (voltageCategory) {
        this.addToSubcategory(voltageCategory, 'Voltage Parameters', func);
      }
    }
    // Current parameters (31, 51, 71 are current codes for L1, L2, L3)
    else if (code.includes(':31.7.') || code.includes(':51.7.') || code.includes(':71.7.') ||
             code.includes(':91.7.') || desc.includes('current') || desc.includes('电流')) {
      const currentCategory = categories.find(c => c.category === 'Current');
      if (currentCategory) {
        this.addToSubcategory(currentCategory, 'Current Parameters', func);
      }
    }
    // Power parameters (active, reactive, apparent)
    else if (code.includes(':1.7.') || code.includes(':2.7.') || code.includes(':3.7.') ||
             code.includes(':4.7.') || code.includes(':9.7.') || code.includes(':13.7.') ||
             desc.includes('power') || desc.includes('功率')) {
      const powerCategory = categories.find(c => c.category === 'Power');
      if (powerCategory) {
        if (desc.includes('reactive') || desc.includes('无功')) {
          this.addToSubcategory(powerCategory, 'Reactive Power', func);
        } else if (desc.includes('apparent') || desc.includes('视在')) {
          this.addToSubcategory(powerCategory, 'Apparent Power', func);
        } else {
          this.addToSubcategory(powerCategory, 'Active Power', func);
        }
      }
    }
    // Energy parameters (imports/exports, TOU)
    else if (code.includes(':1.8.') || code.includes(':2.8.') || code.includes(':3.8.') ||
             code.includes(':4.8.') || code.includes(':9.8.') || code.includes(':10.8.') ||
             desc.includes('energy') || desc.includes('电能') || desc.includes('电量')) {
      const energyCategory = categories.find(c => c.category === 'Energy');
      if (energyCategory) {
        if (desc.includes('import') || desc.includes('正向')) {
          this.addToSubcategory(energyCategory, 'Energy Import', func);
        } else if (desc.includes('export') || desc.includes('反向')) {
          this.addToSubcategory(energyCategory, 'Energy Export', func);
        } else if (desc.includes('reactive') || desc.includes('无功')) {
          this.addToSubcategory(energyCategory, 'Reactive Energy', func);
        } else if (desc.includes('tou') || code.match(/:1\.8\.[1-4]\./)) {
          this.addToSubcategory(energyCategory, 'TOU Energy', func);
        } else {
          this.addToSubcategory(energyCategory, 'Total Energy', func);
        }
      }
    }
    // Power Quality (voltage sags, swells, harmonics, frequency)
    else if (desc.includes('power grid quality') || desc.includes('power quality') ||
             desc.includes('sag') || desc.includes('swell') || desc.includes('harmonic') ||
             desc.includes('frequency') || desc.includes('失压') || desc.includes('欠压') ||
             desc.includes('过压') || code.includes(':14.7.')) {
      const pqCategory = categories.find(c => c.category === 'Power Quality');
      if (pqCategory) {
        if (desc.includes('frequency') || code.includes(':14.7.')) {
          this.addToSubcategory(pqCategory, 'Frequency', func);
        } else if (desc.includes('sag') || desc.includes('欠压')) {
          this.addToSubcategory(pqCategory, 'Voltage Sag', func);
        } else if (desc.includes('swell') || desc.includes('过压')) {
          this.addToSubcategory(pqCategory, 'Voltage Swell', func);
        } else if (desc.includes('harmonic')) {
          this.addToSubcategory(pqCategory, 'Harmonics', func);
        } else {
          this.addToSubcategory(pqCategory, 'General', func);
        }
      }
    }
    // Clock & Time
    else if (code.includes(':1.0.0.') || code.includes('clock') ||
             desc.includes('time') || desc.includes('date') || desc.includes('时钟')) {
      const clockCategory = categories.find(c => c.category === 'Clock & Time');
      if (clockCategory) {
        this.addToSubcategory(clockCategory, 'Clock Parameters', func);
      }
    }
    // Meter Information (serial number, firmware, etc.)
    else if (code.includes(':96.1.') || code.includes(':0.2.0.') || code.includes(':0.0.0.') ||
             desc.includes('serial') || desc.includes('firmware') || desc.includes('version') ||
             desc.includes('manufacturer')) {
      const infoCategory = categories.find(c => c.category === 'Meter Information');
      if (infoCategory) {
        this.addToSubcategory(infoCategory, 'Device Information', func);
      }
    }
    // Demand parameters
    else if (code.includes(':1.6.') || code.includes(':1.4.') ||
             desc.includes('demand') || desc.includes('需量')) {
      const demandCategory = categories.find(c => c.category === 'Demand');
      if (demandCategory) {
        if (desc.includes('maximum') || desc.includes('max')) {
          this.addToSubcategory(demandCategory, 'Maximum Demand', func);
        } else {
          this.addToSubcategory(demandCategory, 'Current Demand', func);
        }
      }
    }
    // Relay Control
    else if (code.includes(':96.3.') || desc.includes('relay') ||
             desc.includes('disconnect') || desc.includes('继电器')) {
      const relayCategory = categories.find(c => c.category === 'Relay Control');
      if (relayCategory) {
        this.addToSubcategory(relayCategory, 'Relay Status & Control', func);
      }
    }
    // Events & Alarms
    else if (code.includes(':96.7.') || code.includes(':99.98.') ||
             desc.includes('event') || desc.includes('alarm') || desc.includes('failure') ||
             desc.includes('事件') || desc.includes('告警')) {
      const eventCategory = categories.find(c => c.category === 'Events & Alarms');
      if (eventCategory) {
        if (desc.includes('power failure') || desc.includes('掉电')) {
          this.addToSubcategory(eventCategory, 'Power Failure Events', func);
        } else if (desc.includes('tamper') || desc.includes('窃电')) {
          this.addToSubcategory(eventCategory, 'Tamper Events', func);
        } else {
          this.addToSubcategory(eventCategory, 'General Events', func);
        }
      }
    }
    // Load Profile
    else if (code.includes(':98.1.') || code.includes(':99.1.') ||
             desc.includes('load profile') || desc.includes('profile') ||
             desc.includes('负荷曲线')) {
      const loadCategory = categories.find(c => c.category === 'Load Profile');
      if (loadCategory) {
        this.addToSubcategory(loadCategory, 'Load Profile Data', func);
      }
    }
    // Tariff & Billing
    else if (code.includes(':0.4.') || code.includes(':0.9.') ||
             desc.includes('tariff') || desc.includes('billing') ||
             desc.includes('费率') || desc.includes('计费')) {
      const tariffCategory = categories.find(c => c.category === 'Tariff & Billing');
      if (tariffCategory) {
        this.addToSubcategory(tariffCategory, 'Tariff Configuration', func);
      }
    }
    // Communication parameters
    else if (desc.includes('communication') || desc.includes('通信')) {
      const commCategory = categories.find(c => c.category === 'Communication');
      if (commCategory) {
        this.addToSubcategory(commCategory, 'Communication Parameters', func);
      }
    }
    // Security & Authentication
    else if (desc.includes('security') || desc.includes('authentication') ||
             desc.includes('password') || desc.includes('密码') || desc.includes('认证')) {
      const secCategory = categories.find(c => c.category === 'Security & Authentication');
      if (secCategory) {
        this.addToSubcategory(secCategory, 'Security Parameters', func);
      }
    }
  }

  /**
   * Add a function to a subcategory, creating the subcategory if it doesn't exist
   */
  private addToSubcategory(category: ParameterCategory, subcategoryName: string, func: ObisFunction) {
    let subcategory = category.subcategories.find(s => s.name === subcategoryName);

    if (!subcategory) {
      subcategory = { name: subcategoryName, parameters: [] };
      category.subcategories.push(subcategory);
    }

    subcategory.parameters.push(func);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const obisService = new ObisService();
