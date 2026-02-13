// ─── ABAP Content Parser ─────────────────────────────────────────────
// Parses ABAP file contents to extract function modules, forms, classes, etc.

export interface ParsedFunction {
    name: string;
    startLine: number;
    endLine: number;
}

export interface ParsedForm {
    name: string;
    startLine: number;
    endLine: number;
}

export interface ParsedModule {
    name: string;
    type: "INPUT" | "OUTPUT";
    startLine: number;
    endLine: number;
}

export interface ParsedContent {
    reportName?: string;
    functions: ParsedFunction[];
    forms: ParsedForm[];
    modules: ParsedModule[];
    className?: string;
    interfaceName?: string;
    includes: string[]; // INCLUDE statements
    tables: string[]; // TABLES declarations
}

export function parseAbapContent(content: string): ParsedContent {
    const lines = content.split("\n");
    const result: ParsedContent = {
        functions: [],
        forms: [],
        modules: [],
        includes: [],
        tables: [],
    };

    let currentFunction: { name: string; startLine: number } | null = null;
    let currentForm: { name: string; startLine: number } | null = null;
    let currentModule: { name: string; type: "INPUT" | "OUTPUT"; startLine: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toUpperCase();
        const originalLine = lines[i].trim();

        // REPORT / PROGRAM
        const reportMatch = originalLine.match(/^\s*(?:REPORT|PROGRAM)\s+(\S+?)[\s.]/i);
        if (reportMatch) {
            result.reportName = reportMatch[1];
        }

        // CLASS DEFINITION / IMPLEMENTATION
        const classMatch = originalLine.match(/^\s*CLASS\s+(\S+)\s+(DEFINITION|IMPLEMENTATION)/i);
        if (classMatch) {
            result.className = classMatch[1];
        }

        // INTERFACE
        const ifMatch = originalLine.match(/^\s*INTERFACE\s+(\S+)/i);
        if (ifMatch) {
            result.interfaceName = ifMatch[1];
        }

        // FUNCTION <name>.
        const funcMatch = originalLine.match(/^\s*FUNCTION\s+(\S+?)[\s.]/i);
        if (funcMatch && !line.startsWith("*") && !line.startsWith('"')) {
            currentFunction = { name: funcMatch[1], startLine: i + 1 };
        }

        // ENDFUNCTION.
        if (/^\s*ENDFUNCTION\s*\./i.test(originalLine) && currentFunction) {
            result.functions.push({
                name: currentFunction.name,
                startLine: currentFunction.startLine,
                endLine: i + 1,
            });
            currentFunction = null;
        }

        // FORM <name>.
        const formMatch = originalLine.match(/^\s*FORM\s+(\S+)/i);
        if (formMatch && !line.startsWith("*") && !line.startsWith('"')) {
            currentForm = { name: formMatch[1].replace(/\.$/, ""), startLine: i + 1 };
        }

        // ENDFORM.
        if (/^\s*ENDFORM\s*\./i.test(originalLine) && currentForm) {
            result.forms.push({
                name: currentForm.name,
                startLine: currentForm.startLine,
                endLine: i + 1,
            });
            currentForm = null;
        }

        // MODULE <name> INPUT/OUTPUT.
        const moduleMatch = originalLine.match(/^\s*MODULE\s+(\S+)\s+(INPUT|OUTPUT)/i);
        if (moduleMatch && !line.startsWith("*") && !line.startsWith('"')) {
            currentModule = {
                name: moduleMatch[1].replace(/\.$/, ""),
                type: moduleMatch[2].toUpperCase() as "INPUT" | "OUTPUT",
                startLine: i + 1,
            };
        }

        // ENDMODULE.
        if (/^\s*ENDMODULE\s*\./i.test(originalLine) && currentModule) {
            result.modules.push({
                name: currentModule.name,
                type: currentModule.type,
                startLine: currentModule.startLine,
                endLine: i + 1,
            });
            currentModule = null;
        }

        // INCLUDE <name>.
        const includeMatch = originalLine.match(/^\s*INCLUDE\s+(\S+?)[\s.]/i);
        if (includeMatch && !line.startsWith("*") && !line.startsWith('"')) {
            result.includes.push(includeMatch[1]);
        }

        // TABLES: <table1>, <table2>.
        const tablesMatch = originalLine.match(/^\s*TABLES\s*:\s*(.+)/i);
        if (tablesMatch) {
            const tableList = tablesMatch[1]
                .replace(/\.$/, "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            result.tables.push(...tableList);
        }
    }

    return result;
}
