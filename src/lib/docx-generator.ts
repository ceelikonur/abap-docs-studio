import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx";
import FileSaver from "file-saver";

export async function exportToDocx(markdown: string, filename: string = "Technical_Specification.docx") {
    const children: (Paragraph | Table)[] = [];
    const lines = markdown.split("\n");

    let inTable = false;
    let tableRows: TableRow[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // ─── Tables ──────────────────────────────────────────────────────
        if (line.startsWith("|")) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }

            const cells = line.split("|").filter(s => s).map(s => s.trim());
            // Skip separator lines like |---|---|
            if (cells.every(c => /^[-:]+$/.test(c))) continue;

            const rowCells = cells.map(cellText =>
                new TableCell({
                    children: [new Paragraph({ text: cellText.replace(/\*\*/g, "").replace(/__/g, "") })],
                    width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    },
                })
            );
            tableRows.push(new TableRow({ children: rowCells }));
            continue;
        } else if (inTable) {
            inTable = false;
            if (tableRows.length > 0) {
                children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            }
        }

        if (!line) {
            children.push(new Paragraph("")); // Empty line
            continue;
        }

        // ─── Headings ────────────────────────────────────────────────────
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].replace(/\*\*/g, "").replace(/__/g, "");

            let headingLevel: any = HeadingLevel.HEADING_1;
            if (level === 2) headingLevel = HeadingLevel.HEADING_2;
            if (level === 3) headingLevel = HeadingLevel.HEADING_3;
            if (level >= 4) headingLevel = HeadingLevel.HEADING_4;

            children.push(new Paragraph({
                text: text,
                heading: headingLevel,
                spacing: { before: 240, after: 120 },
            }));
            continue;
        }

        // ─── Lists ───────────────────────────────────────────────────────
        const listMatch = line.match(/^[-*]\s+(.+)/);
        if (listMatch) {
            children.push(new Paragraph({
                text: listMatch[1].replace(/\*\*/g, "").replace(/__/g, ""),
                bullet: { level: 0 }
            }));
            continue;
        }

        const orderedListMatch = line.match(/^\d+\.\s+(.+)/);
        if (orderedListMatch) {
            children.push(new Paragraph({
                text: orderedListMatch[1].replace(/\*\*/g, "").replace(/__/g, ""),
                // limitations of simple parser: numbering requires abstract num definitions
                // treating as bullet for simplicity or just text
                bullet: { level: 0 }
            }));
            continue;
        }

        // ─── Regular Paragraph ───────────────────────────────────────────
        // Handle bold text (**text** or __text__)
        const parts = line.split(/(\*\*|__)(.+?)\1/g);
        const runs: TextRun[] = [];

        if (parts.length === 1) {
            runs.push(new TextRun(line));
        } else {
            for (let j = 0; j < parts.length; j++) {
                const part = parts[j];
                if (part === "**" || part === "__") continue;

                // If the previous part was a bold marker, this part is bold? 
                // The split Regex behavior: "a **b** c".split(...) -> ["a ", "**", "b", "**", " c"]

                // Simplified approach: Regex match all bold segments
                // Let's simpler parsing: just plain text for now, handling whole line.
                // For true rich text, we need a tokenizer.
                // As a quick fix, just dump text.
            }
            // Fallback to simple text for standard paragraphs
            runs.push(new TextRun(line.replace(/\*\*/g, "").replace(/__/g, "")));
        }

        children.push(new Paragraph({ children: runs }));
    }

    // Final table check
    if (inTable && tableRows.length > 0) {
        children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, filename);
}
