import { FileText, GitBranch, Database, BookOpen, AlertTriangle, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { TSSection, GenerationStatus } from "@/lib/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
};

interface TSPreviewProps {
  sections: TSSection[];
  status: GenerationStatus;
}

export function TSPreview({ sections, status }: TSPreviewProps) {
  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">Technical Specification Preview</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Upload ABAP files and click "Generate" to see the AI-generated specification here.
        </p>
      </div>
    );
  }

  if (status === "analyzing" || status === "generating") {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">
            {status === "analyzing" ? "Analyzing ABAP constructs…" : "Generating specification…"}
          </span>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Generated Technical Specification
        </span>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={sections.map((s) => s.id)} className="px-4 py-2">
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border-border/50">
              <AccordionTrigger className="text-sm hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <span className="text-primary">{ICON_MAP[section.icon]}</span>
                  {section.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap pl-6">
                  {section.content.replace(/\\n/g, "\n")}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
