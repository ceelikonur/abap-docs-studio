# ABAP DocuGen - AI Technical Specification Generator

An intelligent tool that analyzes SAP ABAP source code (including Function Groups, Reports, and Classes) and generates comprehensive Technical Specification documents based on your custom templates.

## Key Features

- **Custom Project Metadata**: Set dynamic values for Document Title, ID, Author, etc. to automatically fill template placeholders.
- **SE80 Object Navigator**: Visualizes uploaded ABAP files in a hierarchical tree structure (Function Groups, Programs, Includes, etc.) just like SAP GUI.
- **Template Support**: Upload your own Technical Specification template (.docx, .md, .pdf) and the AI will fill it out perfectly, respecting your layout.
- **Smart Parsing**: Automatically converts DOCX templates to Markdown for AI processing and previews.
- **DOCX & Markdown Export**: Download your finalized Technical Specification as a `.docx` document or `.md` file.
- **Scoped Analysis**: Analyze the entire project or select specific objects (e.g., a single Function Group) for focused documentation.

## How to Use

1. **Upload Template**: Drag & drop your Technical Specification template (e.g., `EWM_032 Box Label TS.docx`).
2. **Set Project Data**: Click "Project Data" to enter your Object ID, Title, and Author name.
3. **Upload Code**: Upload your ABAP source files. The system auto-organizes them.
4. **Generate**: Click "Generate TS". The AI analyzes your code and populates your template.
5. **Export**: Click "Export .docx" to download the final document.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **AI Integration**: Google Gemini / OpenAI / Anthropic
- **File Parsing & Generation**: 
  - `mammoth.js` for DOCX import
  - `docx` library for DOCX export
  - Custom regex-based ABAP parser

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```
