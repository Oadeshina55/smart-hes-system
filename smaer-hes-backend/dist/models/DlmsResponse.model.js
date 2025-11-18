"use strict";
/**
 * DLMS/COSEM Response Models
 * Standard DLMS (Device Language Message Specification) response format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyScaler = applyScaler;
exports.formatValueWithUnit = formatValueWithUnit;
exports.createDlmsAttribute = createDlmsAttribute;
exports.createDlmsGroup = createDlmsGroup;
exports.createDlmsResponse = createDlmsResponse;
exports.formatReadingsAsDlms = formatReadingsAsDlms;
/**
 * Build actual value from raw value and scaler
 * actualValue = rawValue * 10^scaler
 */
function applyScaler(rawValue, scaler) {
    if (scaler === undefined || scaler === 0)
        return rawValue;
    return rawValue * Math.pow(10, scaler);
}
/**
 * Format value with unit for display
 */
function formatValueWithUnit(value, unit, scaler) {
    const actualValue = applyScaler(value, scaler);
    if (!unit)
        return actualValue.toString();
    return `${actualValue} ${unit}`;
}
/**
 * Create a DLMS attribute from a reading
 */
function createDlmsAttribute(obisCode, name, value, unit, scaler, dataType, classId, attributeId) {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    return {
        obisCode,
        name,
        value,
        unit,
        scaler,
        actualValue: !isNaN(numValue) ? applyScaler(numValue, scaler) : undefined,
        dataType,
        classId,
        attributeId,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Create a DLMS group
 */
function createDlmsGroup(groupName, attributes) {
    return {
        groupName,
        attributes,
        readTime: new Date().toISOString(),
        quality: 100, // Assume valid for now
    };
}
/**
 * Create a DLMS response
 */
function createDlmsResponse(meterId, meterType, groups, readSuccess = true, errorMessage) {
    return {
        meterId,
        meterType,
        timestamp: new Date().toISOString(),
        protocol: 'DLMS/COSEM',
        groups,
        totalAttributes: groups.reduce((sum, g) => sum + g.attributes.length, 0),
        readSuccess,
        errorMessage,
    };
}
/**
 * Convert flat reading object to DLMS groups using OBIS function metadata
 * @param readings - Key-value pairs of OBIS code -> value
 * @param obisFunctions - OBIS function definitions with groups and units
 */
function formatReadingsAsDlms(meterId, meterType, readings, obisFunctions) {
    const groupMap = new Map();
    // Iterate through readings and map to DLMS attributes
    Object.entries(readings).forEach(([code, value]) => {
        const obisFunc = obisFunctions.get(code);
        const attr = createDlmsAttribute(code, obisFunc?.name || code, value, obisFunc?.unit, obisFunc?.scaler, obisFunc?.dataType, obisFunc?.classId, obisFunc?.attributeId || 2);
        const groupName = obisFunc?.group || 'Other';
        if (!groupMap.has(groupName)) {
            groupMap.set(groupName, []);
        }
        groupMap.get(groupName).push(attr);
    });
    // Convert grouped attributes to DLMS groups
    const groups = [];
    groupMap.forEach((attributes, groupName) => {
        groups.push(createDlmsGroup(groupName, attributes));
    });
    return createDlmsResponse(meterId, meterType, groups);
}
//# sourceMappingURL=DlmsResponse.model.js.map