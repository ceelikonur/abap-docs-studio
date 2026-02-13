declare module 'mammoth' {
    export interface ConversionResult {
        value: string;
        messages: any[];
    }

    export interface ConversionOptions {
        path?: string;
        buffer?: Buffer;
        arrayBuffer?: ArrayBuffer;
    }

    export function convertToMarkdown(options: ConversionOptions): Promise<ConversionResult>;
    export function convertToHtml(options: ConversionOptions): Promise<ConversionResult>;
}
