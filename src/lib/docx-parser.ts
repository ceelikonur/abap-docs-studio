// ─── DOCX Parser ─────────────────────────────────────────────────────
// Uses mammoth.js to extract text content from .docx files in the browser.
// Returns markdown-formatted text.

import mammoth from "mammoth";

export async function parseDocxToMarkdown(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToMarkdown({ arrayBuffer });

    // Clean up the mammoth output
    let md = result.value;

    // Remove anchor tags that mammoth generates
    md = md.replace(/<a id="[^"]*"><\/a>/g, "");

    // Clean up excessive whitespace
    md = md.replace(/\n{4,}/g, "\n\n\n");

    // Clean up escaped characters that mammoth adds
    md = md.replace(/\\\./g, ".");
    md = md.replace(/\\\*/g, "*");
    md = md.replace(/\\\_/g, "_");
    md = md.replace(/\\\-/g, "-");

    return md.trim();
}

export async function parseDocxToHtml(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToHtml({ arrayBuffer });

    return result.value;
}

/**
 * Check if a file is a DOCX document
 */
export function isDocxFile(fileName: string): boolean {
    return /\.docx?$/i.test(fileName);
}
