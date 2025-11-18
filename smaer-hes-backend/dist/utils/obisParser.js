"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseObisForBrand = parseObisForBrand;
exports.parseObisFileContents = parseObisFileContents;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Look for OBIS files in uploads/ or uploads/obis/
const OBIS_FILES = {
    hexing: 'Hexing OBIS Function.txt',
    hexcell: 'Hexcell AMI System Unified OBIS List.txt',
};
function findFileForBrand(brand) {
    const uploads = path_1.default.resolve(process.cwd(), 'uploads');
    const candidates = [path_1.default.join(uploads, OBIS_FILES[brand]), path_1.default.join(uploads, 'obis', OBIS_FILES[brand])];
    for (const c of candidates) {
        if (fs_1.default.existsSync(c))
            return c;
    }
    return null;
}
// Generic parser that builds groups when lines like "1 Product Information" appear
function parseObisForBrand(brand) {
    const file = findFileForBrand(brand.toLowerCase());
    if (!file)
        return [];
    const txt = fs_1.default.readFileSync(file, 'utf8');
    const lines = txt.split(/\r?\n/);
    const groups = [];
    let currentGroup = null;
    const codeRegex = /\{?([0-9A-Fa-f]{2,}\w*FF)\}?|([0-9A-Fa-f]{10,16}FF)/;
    for (let raw of lines) {
        if (!raw)
            continue;
        raw = raw.trim();
        // detect section headers like "1 Product Information" or "2 Clock"
        const sectionMatch = raw.match(/^\s*(\d{1,2})\s+([A-Za-z].*)$/);
        if (sectionMatch) {
            currentGroup = { name: sectionMatch[2].trim(), items: [] };
            groups.push(currentGroup);
            continue;
        }
        // try to find OBIS code
        const m = raw.match(codeRegex);
        if (m) {
            const code = (m[1] || m[2] || '').replace(/[{}]/g, '').trim();
            // try to extract name/description from the rest of the line
            const parts = raw.split(/\t+|\s{2,}|\|/).map(p => p.trim()).filter(Boolean);
            // find part that contains the code and remove it
            const filtered = parts.filter(p => !p.includes(code));
            // take first textual part as name/description
            const name = filtered.length ? filtered[0] : undefined;
            const description = filtered.length > 1 ? filtered.slice(1).join(' - ') : undefined;
            const item = {
                code,
                name,
                description,
                raw,
            };
            // push to current group or to a default group
            if (!currentGroup) {
                currentGroup = { name: 'General', items: [] };
                groups.push(currentGroup);
            }
            currentGroup.items.push(item);
        }
    }
    return groups;
}
function parseObisFileContents(contents) {
    // helper to parse arbitrary contents (useful for uploaded OBIS)
    const tmp = '/tmp/obis_tmp.txt';
    fs_1.default.writeFileSync(tmp, contents, 'utf8');
    try {
        return parseObisForBrand('hexing').concat(parseObisForBrand('hexcell'));
    }
    finally {
        try {
            fs_1.default.unlinkSync(tmp);
        }
        catch (e) { }
    }
}
exports.default = { parseObisForBrand };
//# sourceMappingURL=obisParser.js.map