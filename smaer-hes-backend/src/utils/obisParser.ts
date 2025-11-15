import fs from 'fs';
import path from 'path';

export interface ObisItem {
  code: string;
  name?: string;
  description?: string;
  dataType?: string;
  unit?: string;
  classId?: string;
  attributeId?: string;
  raw?: string;
}

export interface ObisGroup {
  name: string;
  items: ObisItem[];
}

// Look for OBIS files in uploads/ or uploads/obis/
const OBIS_FILES: Record<string, string> = {
  hexing: 'Hexing OBIS Function.txt',
  hexcell: 'Hexcell AMI System Unified OBIS List.txt',
};

function findFileForBrand(brand: string) {
  const uploads = path.resolve(process.cwd(), 'uploads');
  const candidates = [path.join(uploads, OBIS_FILES[brand]), path.join(uploads, 'obis', OBIS_FILES[brand])];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Generic parser that builds groups when lines like "1 Product Information" appear
export function parseObisForBrand(brand: string): ObisGroup[] {
  const file = findFileForBrand(brand.toLowerCase());
  if (!file) return [];

  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/);

  const groups: ObisGroup[] = [];
  let currentGroup: ObisGroup | null = null;

  const codeRegex = /\{?([0-9A-Fa-f]{2,}\w*FF)\}?|([0-9A-Fa-f]{10,16}FF)/;

  for (let raw of lines) {
    if (!raw) continue;
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

      const item: ObisItem = {
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

export function parseObisFileContents(contents: string): ObisGroup[] {
  // helper to parse arbitrary contents (useful for uploaded OBIS)
  const tmp = '/tmp/obis_tmp.txt';
  fs.writeFileSync(tmp, contents, 'utf8');
  try {
    return parseObisForBrand('hexing').concat(parseObisForBrand('hexcell'));
  } finally {
    try { fs.unlinkSync(tmp); } catch (e) {}
  }
}

export default { parseObisForBrand };
