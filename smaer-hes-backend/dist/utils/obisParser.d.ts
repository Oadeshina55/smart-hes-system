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
export declare function parseObisForBrand(brand: string): ObisGroup[];
export declare function parseObisFileContents(contents: string): ObisGroup[];
declare const _default: {
    parseObisForBrand: typeof parseObisForBrand;
};
export default _default;
//# sourceMappingURL=obisParser.d.ts.map