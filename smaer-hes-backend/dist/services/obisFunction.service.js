"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseObisFunctions_1 = require("../utils/parseObisFunctions");
const DlmsResponse_model_1 = require("../models/DlmsResponse.model");
class ObisFunctionService {
    constructor() {
        this.db = (0, parseObisFunctions_1.loadObisFunctions)();
        this.functionMap = new Map();
        this.db.unified.forEach((func) => {
            this.functionMap.set(func.code.toUpperCase(), func);
        });
    }
    /**
     * Get a single OBIS function by code
     */
    getFunction(code) {
        const normalized = code.toUpperCase().trim();
        return this.functionMap.get(normalized) || null;
    }
    /**
     * Get all functions for a brand
     */
    getAllFunctions(brand) {
        if (brand === 'hexing') {
            return this.db.hexing;
        }
        else if (brand === 'hexcell') {
            return this.db.hexcell;
        }
        return this.db.unified;
    }
    /**
     * Get functions by group
     */
    getFunctionsByGroup(group, brand) {
        const source = brand === 'hexing' ? this.db.hexing : brand === 'hexcell' ? this.db.hexcell : this.db.unified;
        return source.filter((f) => f.group?.toLowerCase().includes(group.toLowerCase()));
    }
    /**
     * Get unique group names
     */
    getGroups(brand) {
        const source = brand === 'hexing' ? this.db.hexing : brand === 'hexcell' ? this.db.hexcell : this.db.unified;
        const groups = new Set();
        source.forEach((f) => {
            if (f.group)
                groups.add(f.group);
        });
        return Array.from(groups).sort();
    }
    /**
     * Format raw meter readings as DLMS response with units
     * readings: { "0-0:1.0.0": value, "0-1:32.7.0": 230.5, ... }
     */
    formatReadingsAsDlms(meterId, meterType, readings) {
        const groupMap = new Map();
        // Map readings to OBIS functions and group by category
        Object.entries(readings).forEach(([code, value]) => {
            const obisFunc = this.getFunction(code);
            if (!obisFunc) {
                // Still create attribute even if function not found
                const attr = (0, DlmsResponse_model_1.createDlmsAttribute)(code, code, value);
                const group = 'Unknown';
                if (!groupMap.has(group))
                    groupMap.set(group, []);
                groupMap.get(group).push(attr);
                return;
            }
            const attr = (0, DlmsResponse_model_1.createDlmsAttribute)(code, obisFunc.name, value, obisFunc.unit, obisFunc.scaler, obisFunc.dataType, obisFunc.classId, obisFunc.attributeId);
            const groupName = obisFunc.group || 'Other';
            if (!groupMap.has(groupName))
                groupMap.set(groupName, []);
            groupMap.get(groupName).push(attr);
        });
        // Sort groups and attributes
        const groups = Array.from(groupMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, attrs]) => (0, DlmsResponse_model_1.createDlmsGroup)(name, attrs));
        return (0, DlmsResponse_model_1.createDlmsResponse)(meterId, meterType, groups, true);
    }
    /**
     * Create a DLMS attribute from OBIS code and value
     */
    createAttributeFromCode(code, value) {
        const obisFunc = this.getFunction(code);
        return (0, DlmsResponse_model_1.createDlmsAttribute)(code, obisFunc?.name || code, value, obisFunc?.unit, obisFunc?.scaler, obisFunc?.dataType, obisFunc?.classId, obisFunc?.attributeId);
    }
    /**
     * Get unit for a given OBIS code
     */
    getUnit(code) {
        return this.getFunction(code)?.unit;
    }
    /**
     * Get scaler for a given OBIS code
     */
    getScaler(code) {
        return this.getFunction(code)?.scaler;
    }
    /**
     * Format a value with its unit and scaler
     */
    formatValueWithUnit(code, value) {
        const obisFunc = this.getFunction(code);
        if (!obisFunc)
            return String(value);
        const actualValue = obisFunc.scaler ? value * Math.pow(10, obisFunc.scaler) : value;
        const unit = obisFunc.unit ? ` ${obisFunc.unit}` : '';
        return `${actualValue}${unit}`;
    }
    /**
     * Export statistics about loaded OBIS functions
     */
    getStatistics() {
        return {
            hexingTotal: this.db.hexing.length,
            hexcellTotal: this.db.hexcell.length,
            unifiedTotal: this.db.unified.length,
            groups: this.getGroups(),
            hexingGroups: this.getGroups('hexing'),
            hexcellGroups: this.getGroups('hexcell'),
        };
    }
}
exports.default = new ObisFunctionService();
//# sourceMappingURL=obisFunction.service.js.map