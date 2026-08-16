# Dokument AI — open-source kandidati

Cilj: dodavati postojeće javno dostupne komponente bez uklanjanja postojećih funkcija.

## Prvi pregledani kandidati

### PDF
- Hopding/pdf-lib — izmena postojećih PDF-ova, forme, stranice, spajanje
- mozilla/pdf.js — renderovanje i pregled PDF-a
- embedpdf/embed-pdf-viewer — viewer, anotacije, pretraga, redakcija
- foliojs/pdfkit — generisanje kompleksnih PDF-ova
- highkite/pdfAnnotate — PDF anotacije

### OCR
- naptha/tesseract.js — OCR u browseru/Node-u, 100+ jezika
- stacksapien/react-tesseract-ocr — React OCR integracija

### Potpis i forme
- agilgur5/react-signature-canvas — ručni potpis
- docusealco/docuseal-react — embedded potpisivanje i form builder
- amithit/react-form-builder — builder formi

### DOCX i šabloni
- open-xml-templating/docxtemplater — popunjavanje DOCX šablona
- dolanmiu/docx — već postoji u projektu; proširiti korišćenje

### Editor sadržaja
- ueberdosis/tiptap — rich-text editor
- hunghg255/reactjs-tiptap-editor — gotov Tiptap + shadcn UI
- TypeCellOS/BlockNote — block editor; koristiti samo licence kompatibilne sa projektom
- pileax-ai/yiitap — AI/Notion-style editor

### QR, barkod, Excel/CSV
- soldair/node-qrcode — QR kodovi
- lindell/JsBarcode — CODE128, EAN, UPC, CODE39 i drugi barkodovi
- SheetJS/sheetjs CE — Excel/CSV import/export

### Fakture / UX reference
- VladSez/easy-invoice-pdf — live preview, valute, porezi, QR, multi-page PDF
- guranshdeol/Invoice-Generator — React invoice + PDF export
- johnuberbacher/invoice-generator — stavke, količine, porezi, popusti, PDF

## Pravilo integracije
Ne kopirati nasumično cele repozitorijume. Za svaki kandidat proveriti licencu, React 19/Next.js 16 kompatibilnost i da li duplira postojeću funkciju. Integrisati po manjim grupama i testirati pre sledeće grupe.
