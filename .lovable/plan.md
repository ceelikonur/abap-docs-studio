
# ABAP DocuGen — Implementation Plan

## Overview
A professional, enterprise-grade web app that transforms ABAP source code into structured Technical Specification documents using AI. SAP-inspired dark-mode design with blue accents (#0064d2).

---

## Phase 1: Landing Page & Upload (Initial Build)

### 1. Landing / Home Page
- Hero section with app branding ("ABAP DocuGen"), tagline, and a prominent "Start New Project" CTA
- SAP-inspired dark theme with #0064d2 blue accents throughout

### 2. Multi-File Upload Zone
- Drag-and-drop dropzone supporting `.abap` files and template files (`.docx`, `.md`, `.pdf`)
- File list with icons (Lucide) showing file name, type badge, size, and remove button
- File categorization dropdown per file: "Main Logic", "Data Dictionary", "Include", "Function Module", "Class", "Template"

### 3. Project Context Sidebar
- Left sidebar listing all uploaded files grouped by category
- Progress indicator for generation status (idle → analyzing → generating → done)
- Collapsible sidebar with mini-icon mode

### 4. Split-Pane Document Workspace
- **Left pane**: ABAP code viewer with syntax highlighting (using a lightweight highlighter like Prism or highlight.js)
- **Right pane**: Live preview of the generated Technical Specification in structured sections (Flow Logic, Table Access, Error Handling, etc.)
- File tabs to switch between uploaded ABAP files
- Resizable split panes

---

## Phase 2: AI Analysis Engine (Backend)

### 5. Lovable Cloud + AI Integration
- Enable Lovable Cloud for backend capabilities
- Edge function that sends ABAP code + template structure to Lovable AI (Gemini model)
- The AI parses ABAP constructs (SELECT statements, loops, internal tables, FORM/PERFORM, class methods) and maps them into TS template sections
- Streaming response rendered token-by-token in the live preview pane

### 6. Template Mapping
- AI extracts and organizes into sections: Purpose, Flow Logic, Data Dictionary objects, Table Access patterns, Error Handling, Authorization Checks
- Sections displayed as expandable cards in the right pane

---

## Phase 3: Export & Polish

### 7. Finalize & Export
- "Finalize & Export" button to download the generated TS as Markdown
- Option to copy sections to clipboard

### 8. Polish
- Toast notifications for upload success, generation progress, and errors
- Responsive layout for different screen sizes
- Loading skeletons during AI processing
