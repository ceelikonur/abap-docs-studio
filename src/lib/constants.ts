export const FILE_CATEGORIES = [
  "Main Logic",
  "Data Dictionary",
  "Include",
  "Function Module",
  "Class",
  "Template",
] as const;

export const SAMPLE_ABAP_CODE = `*&---------------------------------------------------------------------*
*& Report Z_SALES_ORDER_REPORT
*&---------------------------------------------------------------------*
*& Description: Sales Order Processing Report
*& Author: ABAP Developer
*& Date: 2024-01-15
*&---------------------------------------------------------------------*
REPORT z_sales_order_report.

TABLES: vbak, vbap, kna1.

TYPES: BEGIN OF ty_sales,
         vbeln TYPE vbak-vbeln,
         erdat TYPE vbak-erdat,
         kunnr TYPE vbak-kunnr,
         name1 TYPE kna1-name1,
         netwr TYPE vbak-netwr,
         waerk TYPE vbak-waerk,
         posnr TYPE vbap-posnr,
         matnr TYPE vbap-matnr,
         kwmeng TYPE vbap-kwmeng,
       END OF ty_sales.

DATA: gt_sales TYPE TABLE OF ty_sales,
      gs_sales TYPE ty_sales,
      gv_total TYPE vbak-netwr.

SELECT-OPTIONS: s_vbeln FOR vbak-vbeln,
                s_erdat FOR vbak-erdat,
                s_kunnr FOR vbak-kunnr.

PARAMETERS: p_max TYPE i DEFAULT 100.

START-OF-SELECTION.

  PERFORM get_sales_data.
  PERFORM calculate_totals.
  PERFORM display_report.

*&---------------------------------------------------------------------*
*& Form GET_SALES_DATA
*&---------------------------------------------------------------------*
FORM get_sales_data.
  SELECT a~vbeln a~erdat a~kunnr c~name1
         a~netwr a~waerk b~posnr b~matnr b~kwmeng
    INTO TABLE gt_sales
    FROM vbak AS a
    INNER JOIN vbap AS b ON a~vbeln = b~vbeln
    LEFT JOIN kna1 AS c ON a~kunnr = c~kunnr
    WHERE a~vbeln IN s_vbeln
      AND a~erdat IN s_erdat
      AND a~kunnr IN s_kunnr
    UP TO p_max ROWS.

  IF sy-subrc <> 0.
    MESSAGE 'No data found' TYPE 'I'.
    LEAVE LIST-PROCESSING.
  ENDIF.
ENDFORM.

*&---------------------------------------------------------------------*
*& Form CALCULATE_TOTALS
*&---------------------------------------------------------------------*
FORM calculate_totals.
  LOOP AT gt_sales INTO gs_sales.
    gv_total = gv_total + gs_sales-netwr.
  ENDLOOP.
ENDFORM.

*&---------------------------------------------------------------------*
*& Form DISPLAY_REPORT
*&---------------------------------------------------------------------*
FORM display_report.
  LOOP AT gt_sales INTO gs_sales.
    WRITE: / gs_sales-vbeln, gs_sales-erdat,
             gs_sales-kunnr, gs_sales-name1,
             gs_sales-netwr, gs_sales-waerk.
  ENDLOOP.
  SKIP.
  WRITE: / 'Total Net Value:', gv_total.
ENDFORM.`;

export const SAMPLE_TS_SECTIONS = [
  {
    id: "purpose",
    title: "Purpose & Overview",
    content: "This report (Z_SALES_ORDER_REPORT) retrieves and displays sales order data from SAP SD module tables. It provides a consolidated view of sales orders with customer details and line item information, with configurable selection criteria.",
    icon: "FileText",
  },
  {
    id: "flow-logic",
    title: "Flow Logic",
    content: "1. **Selection Screen**: User provides Sales Order number (s_vbeln), Creation Date (s_erdat), Customer Number (s_kunnr), and Max Rows (p_max).\\n2. **GET_SALES_DATA**: Fetches joined data from VBAK/VBAP/KNA1.\\n3. **CALCULATE_TOTALS**: Iterates through results to sum net values.\\n4. **DISPLAY_REPORT**: Outputs formatted list with totals.",
    icon: "GitBranch",
  },
  {
    id: "table-access",
    title: "Table Access",
    content: "| Table | Alias | Join Type | Purpose |\\n|-------|-------|-----------|---------|\\n| VBAK | a | Primary | Sales Document Header |\\n| VBAP | b | INNER JOIN | Sales Document Items |\\n| KNA1 | c | LEFT JOIN | Customer Master |",
    icon: "Database",
  },
  {
    id: "data-dictionary",
    title: "Data Dictionary Objects",
    content: "**Custom Type**: `ty_sales` — Structure containing fields from VBAK (vbeln, erdat, kunnr, netwr, waerk), KNA1 (name1), and VBAP (posnr, matnr, kwmeng).\\n\\n**Internal Table**: `gt_sales` — Standard table of ty_sales.\\n**Work Area**: `gs_sales` — Single row of ty_sales.\\n**Variable**: `gv_total` — Running total of net values (type vbak-netwr).",
    icon: "BookOpen",
  },
  {
    id: "error-handling",
    title: "Error Handling",
    content: "- **No Data Found (SY-SUBRC ≠ 0)**: Displays informational message 'No data found' and exits list processing via `LEAVE LIST-PROCESSING`.\\n- No explicit exception handling for database errors.\\n- No authorization checks implemented.",
    icon: "AlertTriangle",
  },
  {
    id: "auth-checks",
    title: "Authorization Checks",
    content: "⚠️ **No authorization checks detected.** Recommend adding:\\n- `AUTHORITY-CHECK OBJECT 'V_VBAK_VKO'` for Sales Organization\\n- `AUTHORITY-CHECK OBJECT 'V_VBAK_AAT'` for Sales Document Type",
    icon: "Shield",
  },
];
