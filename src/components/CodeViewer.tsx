import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/vs2015.css";
import { ScrollArea } from "@/components/ui/scroll-area";

// Register a basic ABAP-like language definition
hljs.registerLanguage("abap", () => ({
  case_insensitive: true,
  keywords: {
    keyword:
      "report data types type table of begin end select from into where inner join left endselect " +
      "if else endif loop at endloop form endform perform write skip parameters select-options " +
      "tables start-of-selection message leave list-processing call function method class endclass " +
      "importing exporting changing returning exceptions raise try catch endtry append clear refresh " +
      "read modify delete insert update commit rollback authority-check and or not in as up to rows",
    literal: "sy-subrc sy-tabix sy-datum sy-uzeit space abap_true abap_false",
    type: "i c n d t p f string xstring",
  },
  contains: [
    hljs.QUOTE_STRING_MODE,
    { className: "comment", begin: /\*/, end: /$/ },
    { className: "comment", begin: /"/, end: /$/ },
    hljs.C_NUMBER_MODE,
    { className: "title", begin: /\b(form|class|method|report)\s+/i, end: /[\s.]/, excludeBegin: true },
  ],
}));

interface CodeViewerProps {
  code: string;
  fileName: string;
}

export function CodeViewer({ code, fileName }: CodeViewerProps) {
  const codeRef = useRef<HTMLElement>(null);
  // All uploaded source files in this app are ABAP code — always use ABAP highlighting
  const languageClass = "language-abap";

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/50">
        <span className="text-xs font-mono text-muted-foreground">{fileName}</span>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-4 text-sm leading-relaxed">
          <code ref={codeRef} className={languageClass}>
            {code}
          </code>
        </pre>
      </ScrollArea>
    </div>
  );
}
