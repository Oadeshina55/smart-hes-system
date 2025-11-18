"use strict";
/**
 * OBIS Chinese to English Translation Utility
 * Translates Chinese descriptions in OBIS function data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateChinese = translateChinese;
exports.translateObisDescription = translateObisDescription;
exports.containsChinese = containsChinese;
exports.translateObisFunction = translateObisFunction;
const translations = {
    // Power Grid Quality
    '电网质量': 'Power Grid Quality',
    '时间相关': 'Time Related',
    // Power Failure Related
    '任意相短时间掉电次数': 'Number of short power failures in any phase',
    '任意相长时间掉电次数': 'Number of long power failures in any phase',
    '长时间掉电时间门限': 'Long power failure time threshold',
    '短时间掉电时间门限': 'Short power failure time threshold',
    '任意相长时间掉电持续时间': 'Duration of long power failure in any phase',
    '任意相掉电（长+短）事件持续时间': 'Duration of power failure (long+short) in any phase',
    '(所有相)长掉电总累计时间': 'Total duration of long power failures (all phases)',
    // Voltage Related
    '电压': 'Voltage',
    '电压质量': 'Voltage Quality',
    '电压偏差': 'Voltage Deviation',
    '过电压': 'Over Voltage',
    '欠电压': 'Under Voltage',
    '电压不平衡': 'Voltage Imbalance',
    '电压波动': 'Voltage Fluctuation',
    // Current Related
    '电流': 'Current',
    '电流不平衡': 'Current Imbalance',
    '过电流': 'Over Current',
    // Power Related
    '功率': 'Power',
    '有功功率': 'Active Power',
    '无功功率': 'Reactive Power',
    '视在功率': 'Apparent Power',
    '功率因数': 'Power Factor',
    // Energy Related
    '电能': 'Energy',
    '有功电能': 'Active Energy',
    '无功电能': 'Reactive Energy',
    '正向有功电能': 'Forward Active Energy',
    '反向有功电能': 'Reverse Active Energy',
    // Time Related
    '时间': 'Time',
    '日期': 'Date',
    '时钟': 'Clock',
    // Meter Related
    '电表': 'Meter',
    '表号': 'Meter Number',
    '表计': 'Meter',
    // Tariff Related
    '费率': 'Tariff',
    '尖': 'Peak',
    '峰': 'Peak',
    '平': 'Normal',
    '谷': 'Off-Peak',
    // Event Related
    '事件': 'Event',
    '报警': 'Alarm',
    '故障': 'Fault',
    // Status Related
    '状态': 'Status',
    '运行': 'Running',
    '停止': 'Stopped',
    // Communication Related
    '通信': 'Communication',
    '连接': 'Connection',
    '断开': 'Disconnected',
    // Relay Related
    '继电器': 'Relay',
    '开关': 'Switch',
    '跳闸': 'Trip',
    '合闸': 'Close',
    // Tampering Related
    '防窃电': 'Anti-Tampering',
    '开盖': 'Cover Open',
    '磁干扰': 'Magnetic Interference',
    '反向': 'Reverse',
    '失流': 'Current Loss',
    '失压': 'Voltage Loss',
    // Measurement Related
    '测量': 'Measurement',
    '瞬时': 'Instantaneous',
    '累计': 'Cumulative',
    '平均': 'Average',
    '最大': 'Maximum',
    '最小': 'Minimum',
    // Phase Related
    '相': 'Phase',
    'A相': 'Phase A',
    'B相': 'Phase B',
    'C相': 'Phase C',
    '三相': 'Three Phase',
    '单相': 'Single Phase',
    // Common Terms
    '总': 'Total',
    '当前': 'Current',
    '历史': 'Historical',
    '记录': 'Record',
    '数据': 'Data',
    '参数': 'Parameter',
    '配置': 'Configuration',
    '设置': 'Setting',
};
/**
 * Translate Chinese text to English
 */
function translateChinese(text) {
    if (!text)
        return text;
    let translated = text;
    // Replace each Chinese phrase with English
    for (const [chinese, english] of Object.entries(translations)) {
        translated = translated.replace(new RegExp(chinese, 'g'), english);
    }
    return translated;
}
/**
 * Translate OBIS function descriptions
 */
function translateObisDescription(description) {
    if (!description)
        return description;
    // Split by tab and translate each part
    const parts = description.split('\t');
    const translatedParts = parts.map(part => translateChinese(part));
    return translatedParts.join('\t');
}
/**
 * Check if text contains Chinese characters
 */
function containsChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}
/**
 * Translate entire OBIS function object
 */
function translateObisFunction(func) {
    return {
        ...func,
        name: translateChinese(func.name),
        description: translateObisDescription(func.description),
        group: translateChinese(func.group),
    };
}
exports.default = {
    translateChinese,
    translateObisDescription,
    containsChinese,
    translateObisFunction,
};
//# sourceMappingURL=translateObis.js.map