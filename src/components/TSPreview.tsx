import { FileText, Loader2, Download, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { exportToDocx } from "@/lib/docx-generator";
import type { GenerationStatus } from "@/lib/types";

interface TSPreviewProps {
  markdown: string;
  status: GenerationStatus;
  scopeLabel?: string | null;
  title?: string;
}

export function TSPreview({ markdown, status, scopeLabel, title = "Technical Specification" }: TSPreviewProps) {
  if (status === "idle" && !markdown) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 mb-4">
          <FileText className="h-10 w-10 text-primary/60" />
        </div>
        <h3 className="text-base font-semibold mb-2">
          {title} Preview
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Upload your <span className="text-primary font-medium">Template</span> and{" "}
          <span className="text-primary font-medium">Requiremnets</span>,
          then click "Generate" to create your specification.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground/70">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
            Provide input (Upload or Type)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
            Configure parameters
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
            Click "Generate" — AI creates the document
          </div>
        </div>
      </div>
    );
  }

  if (status === "analyzing" || status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative rounded-full bg-primary/10 p-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {status === "analyzing"
              ? "Analyzing input…"
              : `Generating ${title}…`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {scopeLabel
              ? `Scope: ${scopeLabel}`
              : "This may take a moment for complex requests"}
          </p>
        </div>
      </div>
    );
  }

  // ─── Document view ───────────────────────────────────────────────
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 32px; }
          h2 { font-size: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 28px; }
          h3 { font-size: 16px; margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px; }
          th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: 600; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
          pre { background: #f3f4f6; padding: 16px; border-radius: 6px; overflow-x: auto; }
          ul, ol { padding-left: 24px; }
          li { margin-bottom: 4px; }
          hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${document.querySelector('.ts-document')?.innerHTML || ''}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = () => {
    const filename = `${title.replace(/\s+/g, "_")}.docx`;
    exportToDocx(markdown, filename);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Document toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">{title}</span>
          {scopeLabel && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {scopeLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMd}
          >
            <Download className="h-4 w-4 mr-2" />
            Export .md
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDocx}
          >
            <Download className="h-4 w-4 mr-2" />
            Export .docx
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Document content */}
      <ScrollArea className="flex-1">
        <div className="ts-document-wrapper">
          <MarkdownViewer content={markdown} />
        </div>
      </ScrollArea>
    </div>
  );
}
