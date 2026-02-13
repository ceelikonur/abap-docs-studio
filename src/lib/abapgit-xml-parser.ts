/**
 * XML parser for abapGit metadata files.
 * Extracts structure definitions, data elements, function groups, and classes.
 */

import type {
    AbapStructure,
    AbapField,
    AbapDataElement,
    AbapFunctionGroup,
    AbapFunctionModule,
    AbapFunctionParam,
    AbapClass,
} from "./abapgit-types";

// ─── Helpers ──────────────────────────────────────────────────────────

function getTagContent(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
}

function getAllBlocks(xml: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
    const results: string[] = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        results.push(match[1]);
    }
    return results;
}

// ─── Structure / Table Parser (.tabl.xml) ─────────────────────────────

export function parseTableXml(xml: string): AbapStructure | null {
    try {
        const name = getTagContent(xml, "TABNAME");
        const description = getTagContent(xml, "DDTEXT");
        const tableClass = getTagContent(xml, "TABCLASS");

        if (!name) return null;

        const fieldBlocks = getAllBlocks(xml, "DD03P");
        const fields: AbapField[] = fieldBlocks.map((block) => ({
            fieldName: getTagContent(block, "FIELDNAME"),
            position: parseInt(getTagContent(block, "POSITION") || "0", 10),
            dataElement: getTagContent(block, "ROLLNAME"),
            dataType: getTagContent(block, "DATATYPE") || undefined,
            length: getTagContent(block, "LENG") || undefined,
            decimals: getTagContent(block, "DECIMALS") || undefined,
            description: undefined,
        })).filter((f) => f.fieldName);

        return { name, description, tableClass, fields };
    } catch {
        return null;
    }
}

// ─── Data Element Parser (.dtel.xml) ──────────────────────────────────

export function parseDataElementXml(xml: string): AbapDataElement | null {
    try {
        const name = getTagContent(xml, "ROLLNAME");
        const description = getTagContent(xml, "DDTEXT");
        const dataType = getTagContent(xml, "DATATYPE");
        const length = getTagContent(xml, "LENG");
        const decimals = getTagContent(xml, "DECIMALS");

        if (!name) return null;

        return {
            name,
            description,
            dataType,
            length,
            decimals,
            labels: {
                short: getTagContent(xml, "SCRTEXT_S"),
                medium: getTagContent(xml, "SCRTEXT_M"),
                long: getTagContent(xml, "SCRTEXT_L"),
            },
        };
    } catch {
        return null;
    }
}

// ─── Function Group Parser (.fugr.xml) ────────────────────────────────

function parseFunctionParams(parentBlock: string, paramTag: string): AbapFunctionParam[] {
    const blocks = getAllBlocks(parentBlock, paramTag);
    return blocks.map((block) => ({
        name: getTagContent(block, "PARAMETER"),
        type: getTagContent(block, "TYP"),
        description: getTagContent(block, "STEXT"),
    })).filter((p) => p.name);
}

export function parseFunctionGroupXml(xml: string): AbapFunctionGroup | null {
    try {
        // Includes
        const includeBlocks = getAllBlocks(xml, "SOBJ_NAME");
        const includes = includeBlocks.map((name) => name.trim()).filter(Boolean);

        // Functions
        const functionItems = getAllBlocks(xml, "item");
        const functions: AbapFunctionModule[] = functionItems
            .filter((item) => getTagContent(item, "FUNCNAME"))
            .map((item) => {
                const funcName = getTagContent(item, "FUNCNAME");
                const funcDesc = getTagContent(item, "SHORT_TEXT");

                return {
                    name: funcName,
                    description: funcDesc,
                    importing: parseFunctionParams(item, "RSIMP"),
                    exporting: parseFunctionParams(item, "RSEXP"),
                    changing: parseFunctionParams(item, "RSCHA"),
                    tables: parseFunctionParams(item, "RSTBL"),
                    exceptions: getAllBlocks(item, "RSEXC")
                        .map((b) => getTagContent(b, "EXCEPTION"))
                        .filter(Boolean),
                };
            });

        // Derive group name from the first include
        const groupName = includes.length > 0
            ? includes[0].replace(/^L/i, "").replace(/TOP$/i, "").toUpperCase()
            : "UNKNOWN";

        return { name: groupName, includes, functions };
    } catch {
        return null;
    }
}

// ─── Class Parser (.clas.xml) ─────────────────────────────────────────

export function parseClassXml(xml: string): AbapClass | null {
    try {
        const name = getTagContent(xml, "CLSNAME");
        const description = getTagContent(xml, "DESCRIPT");
        const superclass = getTagContent(xml, "REFCLSNAME") || undefined;

        if (!name) return null;

        const interfaces: string[] = getAllBlocks(xml, "CPDNAME")
            .map((iface) => iface.trim())
            .filter(Boolean);

        return { name, description, superclass, interfaces };
    } catch {
        return null;
    }
}

// ─── Format Parsed Metadata as Markdown ───────────────────────────────

export function structureToMarkdown(s: AbapStructure): string {
    let md = `### Structure: ${s.name}\n`;
    md += `**Description:** ${s.description || "N/A"}\n`;
    md += `**Type:** ${s.tableClass}\n\n`;
    md += `| Pos | Field Name | Data Element | Data Type | Length |\n`;
    md += `|-----|-----------|-------------|-----------|--------|\n`;
    for (const f of s.fields) {
        md += `| ${f.position} | ${f.fieldName} | ${f.dataElement} | ${f.dataType || ""} | ${f.length || ""} |\n`;
    }
    return md;
}

export function dataElementToMarkdown(d: AbapDataElement): string {
    return `### Data Element: ${d.name}\n` +
        `**Description:** ${d.description}\n` +
        `**Data Type:** ${d.dataType}, Length: ${d.length}, Decimals: ${d.decimals}\n` +
        `**Labels:** Short: "${d.labels.short}", Medium: "${d.labels.medium}", Long: "${d.labels.long}"\n`;
}

export function functionGroupToMarkdown(fg: AbapFunctionGroup): string {
    let md = `### Function Group: ${fg.name}\n`;
    md += `**Includes:** ${fg.includes.join(", ")}\n\n`;
    for (const fm of fg.functions) {
        md += `#### FM: ${fm.name}\n`;
        md += `**Description:** ${fm.description}\n`;
        if (fm.importing.length) {
            md += `**IMPORTING:**\n`;
            fm.importing.forEach((p) => { md += `- ${p.name} TYPE ${p.type} — ${p.description}\n`; });
        }
        if (fm.exporting.length) {
            md += `**EXPORTING:**\n`;
            fm.exporting.forEach((p) => { md += `- ${p.name} TYPE ${p.type} — ${p.description}\n`; });
        }
        if (fm.changing.length) {
            md += `**CHANGING:**\n`;
            fm.changing.forEach((p) => { md += `- ${p.name} TYPE ${p.type} — ${p.description}\n`; });
        }
        if (fm.tables.length) {
            md += `**TABLES:**\n`;
            fm.tables.forEach((p) => { md += `- ${p.name} TYPE ${p.type} — ${p.description}\n`; });
        }
        if (fm.exceptions.length) {
            md += `**EXCEPTIONS:** ${fm.exceptions.join(", ")}\n`;
        }
        md += "\n";
    }
    return md;
}

export function classToMarkdown(c: AbapClass): string {
    let md = `### Class: ${c.name}\n`;
    md += `**Description:** ${c.description}\n`;
    if (c.superclass) md += `**Superclass:** ${c.superclass}\n`;
    if (c.interfaces.length) md += `**Interfaces:** ${c.interfaces.join(", ")}\n`;
    return md;
}
