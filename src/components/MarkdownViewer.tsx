import { useMemo } from "react";

// ─── Simple Markdown → HTML Renderer ─────────────────────────────────
// Converts markdown text to HTML for professional document display.
// Handles: headings, bold, italic, tables, lists, code, horizontal rules.

interface MarkdownViewerProps {
    content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
    const html = useMemo(() => markdownToHtml(content), [content]);

    return (
        <div
            className="ts-document"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

function markdownToHtml(md: string): string {
    const lines = md.split("\n");
    const result: string[] = [];
    let inTable = false;
    let inCodeBlock = false;
    let inList = false;
    let listType: "ul" | "ol" = "ul";

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code blocks
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                result.push("</code></pre>");
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                const lang = line.trim().replace("```", "").trim();
                result.push(
                    `<pre class="ts-code-block"><code class="language-${lang || "text"}">`
                );
            }
            continue;
        }
        if (inCodeBlock) {
            result.push(escapeHtml(line));
            continue;
        }

        // Close list if line is not a list item
        if (inList && !/^\s*[-*+]\s/.test(line) && !/^\s*\d+\.\s/.test(line) && line.trim() !== "") {
            result.push(listType === "ul" ? "</ul>" : "</ol>");
            inList = false;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
            if (inTable) {
                result.push("</tbody></table>");
                inTable = false;
            }
            result.push('<hr class="ts-hr" />');
            continue;
        }

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            if (inTable) {
                result.push("</tbody></table>");
                inTable = false;
            }
            const level = headingMatch[1].length;
            const text = inlineFormat(headingMatch[2]);
            result.push(`<h${level} class="ts-h${level}">${text}</h${level}>`);
            continue;
        }

        // Table rows
        if (line.includes("|") && line.trim().startsWith("|")) {
            const cells = line
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim());

            // Check if this is a separator row (---|---|---)
            if (cells.every((c) => /^[-:]+$/.test(c))) {
                continue; // skip separator
            }

            if (!inTable) {
                // Start table — first row is header
                inTable = true;
                result.push('<table class="ts-table"><thead><tr>');
                cells.forEach((cell) => {
                    result.push(`<th>${inlineFormat(cell)}</th>`);
                });
                result.push("</tr></thead><tbody>");
            } else {
                result.push("<tr>");
                cells.forEach((cell) => {
                    result.push(`<td>${inlineFormat(cell)}</td>`);
                });
                result.push("</tr>");
            }
            continue;
        } else if (inTable) {
            result.push("</tbody></table>");
            inTable = false;
        }

        // Unordered list
        const ulMatch = line.match(/^(\s*)[-*+]\s(.+)/);
        if (ulMatch) {
            if (!inList) {
                inList = true;
                listType = "ul";
                result.push("<ul>");
            }
            result.push(`<li>${inlineFormat(ulMatch[2])}</li>`);
            continue;
        }

        // Ordered list
        const olMatch = line.match(/^(\s*)\d+\.\s(.+)/);
        if (olMatch) {
            if (!inList || listType !== "ol") {
                if (inList) result.push("</ul>");
                inList = true;
                listType = "ol";
                result.push("<ol>");
            }
            result.push(`<li>${inlineFormat(olMatch[2])}</li>`);
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            if (inList) {
                result.push(listType === "ul" ? "</ul>" : "</ol>");
                inList = false;
            }
            continue;
        }

        // Regular paragraph
        result.push(`<p>${inlineFormat(line)}</p>`);
    }

    // Close any open tags
    if (inTable) result.push("</tbody></table>");
    if (inList) result.push(listType === "ul" ? "</ul>" : "</ol>");
    if (inCodeBlock) result.push("</code></pre>");

    return result.join("\n");
}

function inlineFormat(text: string): string {
    let result = text;
    // Bold + Italic (handling *** and ___)
    result = result.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    result = result.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");

    // Bold (handling ** and __)
    result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic (handling * and _)
    result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
    result = result.replace(/_(.+?)_/g, "<em>$1</em>");
    // Inline code
    result = result.replace(/`([^`]+)`/g, '<code class="ts-inline-code">$1</code>');
    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return result;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
