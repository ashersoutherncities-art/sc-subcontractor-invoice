# Southern Cities Invoice Studio

A production-ready v1 invoice generator for subcontractors.

## What it does

This app lets a subcontractor:

- upload a logo
- enter company and contact details
- add client and project information
- create invoice line items with quantity and unit price
- set tax, deposit, due date, and notes
- preview a polished branded invoice in real time
- print or save the invoice as PDF from the browser

The interface is mobile-friendly, simple to operate, and optimized for practical field use instead of demo-only flows.

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind base utilities with custom CSS styling

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Primary files

- `src/app/page.tsx` - main app entry
- `src/app/invoice/new/page.tsx` - direct route for creating invoices
- `src/components/InvoiceStudio.tsx` - full invoice generator UI and print preview
- `src/app/globals.css` - styling, responsive layout, and print rules

## Notes

- Logo upload is local in-browser and does not require a backend.
- Use the **Print or save PDF** button to create a PDF with the browser print dialog.
- Sample invoice data is included so the app feels complete on first load.
