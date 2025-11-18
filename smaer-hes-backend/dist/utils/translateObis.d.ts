/**
 * OBIS Chinese to English Translation Utility
 * Translates Chinese descriptions in OBIS function data
 */
/**
 * Translate Chinese text to English
 */
export declare function translateChinese(text: string): string;
/**
 * Translate OBIS function descriptions
 */
export declare function translateObisDescription(description: string): string;
/**
 * Check if text contains Chinese characters
 */
export declare function containsChinese(text: string): boolean;
/**
 * Translate entire OBIS function object
 */
export declare function translateObisFunction(func: any): any;
declare const _default: {
    translateChinese: typeof translateChinese;
    translateObisDescription: typeof translateObisDescription;
    containsChinese: typeof containsChinese;
    translateObisFunction: typeof translateObisFunction;
};
export default _default;
//# sourceMappingURL=translateObis.d.ts.map