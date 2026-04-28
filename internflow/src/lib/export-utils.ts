import jsPDF from "jspdf";

// ── Brand Constants ──
const BRAND_GREEN = [34, 197, 94] as const;
const BRAND_INDIGO = [99, 102, 241] as const;
const TEXT_DARK = [17, 24, 39] as const;
const TEXT_MUTED = [107, 114, 128] as const;
const BORDER_COLOR = [209, 213, 219] as const;

/** Draw a decorative double-line border around the page */
function drawPageBorder(doc: jsPDF, landscape = false) {
  const w = landscape ? 842 : 595;
  const h = landscape ? 595 : 842;
  const m = 30; // outer margin

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(1.5);
  doc.rect(m, m, w - m * 2, h - m * 2);

  doc.setLineWidth(0.5);
  doc.rect(m + 4, m + 4, w - m * 2 - 8, h - m * 2 - 8);
}

/** Draw a light watermark text diagonally across the page */
function drawWatermark(doc: jsPDF, text: string, landscape = false) {
  const w = landscape ? 842 : 595;
  const h = landscape ? 595 : 842;

  doc.setFontSize(60);
  doc.setTextColor(230, 230, 230);
  doc.setFont("helvetica", "bold");

  const textWidth = doc.getTextWidth(text);
  const x = (w - textWidth * Math.cos(Math.PI / 6)) / 2 + 60;
  const y = h / 2 + 40;

  doc.text(text, x, y, { angle: 30 });
}

/** Draw the institutional header block */
function drawInstitutionalHeader(doc: jsPDF, yStart: number): number {
  let y = yStart;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND_GREEN);
  doc.text("RATHINAM GROUP OF INSTITUTIONS", 298, y, { align: "center" });

  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Eachanari Post, Pollachi Main Road, Coimbatore - 641021, Tamil Nadu, India", 298, y, { align: "center" });

  y += 14;
  doc.text("www.rathinam.in  |  placements@rathinam.edu.in  |  +91 422 266 0011", 298, y, { align: "center" });

  // Divider line
  y += 12;
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(1.5);
  doc.line(60, y, 535, y);

  y += 4;
  doc.setDrawColor(...BRAND_INDIGO);
  doc.setLineWidth(0.5);
  doc.line(60, y, 535, y);

  return y + 16;
}

/** Draw section heading */
function drawSectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_INDIGO);
  doc.text(text, 60, y);

  doc.setDrawColor(...BRAND_INDIGO);
  doc.setLineWidth(0.3);
  doc.line(60, y + 3, 535, y + 3);

  return y + 16;
}

/** Draw the footer with reference number and page */
function drawFooter(doc: jsPDF, refId: string, landscape = false) {
  const w = landscape ? 842 : 595;
  const h = landscape ? 595 : 842;
  const y = h - 50;

  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${refId}`, 60, y);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} via InternFlow`, w - 60, y, { align: "right" });

  // Bottom accent line
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(2);
  doc.line(40, h - 36, w - 40, h - 36);
}

// ════════════════════════════════════════
// BONAFIDE CERTIFICATE
// ════════════════════════════════════════

export function exportBonafidePDF(studentName: string, companyName: string, role: string, startDate: string, endDate: string) {
  const doc = new jsPDF("p", "pt", "a4");
  const refId = `RGI/PC/BF/${Date.now().toString(36).toUpperCase()}`;

  drawPageBorder(doc);
  drawWatermark(doc, "RATHINAM");

  let y = drawInstitutionalHeader(doc, 70);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK);
  doc.text("BONAFIDE CERTIFICATE", 298, y, { align: "center" });
  y += 30;

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 60, y);
  doc.text(`Ref: ${refId}`, 535, y, { align: "right" });
  y += 30;

  // Body text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);

  const bodyText = `This is to certify that ${studentName} is a bonafide student of Rathinam College of Arts and Science. The student has been officially granted On-Duty (OD) permission to pursue an internship as a ${role} at ${companyName}.

The approved internship duration is from ${startDate} to ${endDate}.

During this period, the student's attendance will be recorded as On-Duty (OD) subject to the submission of the final internship completion certificate issued by the host organization.

This certificate is issued for the purpose of record and verification only.`;

  const splitText = doc.splitTextToSize(bodyText, 460);
  doc.text(splitText, 60, y, { lineHeightFactor: 1.6 });
  y += splitText.length * 12 * 1.6 + 60;

  // Signatures
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(60, y, 200, y);
  doc.line(380, y, 535, y);

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Placement Coordinator", 60, y);
  doc.text("Principal / Dean", 380, y);

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("(Rathinam Placement Cell)", 60, y);
  doc.text("(Rathinam Group of Institutions)", 380, y);

  drawFooter(doc, refId);
  doc.save(`Bonafide_${studentName.replace(/\s+/g, "_")}.pdf`);
}

// ════════════════════════════════════════
// ON-DUTY (OD) REQUEST FORM
// ════════════════════════════════════════

export function exportODFormPDF(studentName: string, companyName: string, role: string) {
  const doc = new jsPDF("p", "pt", "a4");
  const refId = `RGI/PC/OD/${Date.now().toString(36).toUpperCase()}`;

  drawPageBorder(doc);
  drawWatermark(doc, "RATHINAM");

  let y = drawInstitutionalHeader(doc, 70);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK);
  doc.text("ON-DUTY (OD) REQUEST FORM", 298, y, { align: "center" });
  y += 40;

  // Form fields table
  const fields = [
    ["Student Name", studentName],
    ["Company", companyName],
    ["Role / Position", role],
    ["Approval Status", "OFFICIALLY APPROVED"],
    ["Date of Issue", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
    ["Reference ID", refId],
  ];

  doc.setFontSize(11);
  for (const [label, value] of fields) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${label}:`, 60, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(value, 220, y);

    // Row separator
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.line(60, y + 8, 535, y + 8);

    y += 28;
  }

  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("This On-Duty permission has been reviewed and approved through the", 60, y);
  y += 16;
  doc.text("official InternFlow approval hierarchy (Tutor → PC → HOD → Dean → PO → COE → Principal).", 60, y);

  y += 60;

  // Signatures
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(60, y, 200, y);
  doc.line(380, y, 535, y);

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Head of Department", 60, y);
  doc.text("Placement Officer", 380, y);

  drawFooter(doc, refId);
  doc.save(`OD_Form_${studentName.replace(/\s+/g, "_")}.pdf`);
}

// ════════════════════════════════════════
// MEMORANDUM OF UNDERSTANDING (MoU)
// ════════════════════════════════════════

export function exportMoUPDF(companyName: string, date: string) {
  const doc = new jsPDF("p", "pt", "a4");
  const refId = `RGI/MCR/MOU/${Date.now().toString(36).toUpperCase()}`;

  drawPageBorder(doc);
  drawWatermark(doc, "CONFIDENTIAL");

  let y = drawInstitutionalHeader(doc, 70);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK);
  doc.text("MEMORANDUM OF UNDERSTANDING", 298, y, { align: "center" });
  y += 20;

  doc.setFontSize(12);
  doc.setTextColor(...BRAND_INDIGO);
  doc.text(`Between Rathinam Group of Institutions & ${companyName}`, 298, y, { align: "center" });
  y += 30;

  // Preamble
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);

  const preamble = `This Memorandum of Understanding ("MoU") is entered into on ${date}, by and between Rathinam Group of Institutions, Coimbatore ("Institution") and ${companyName} ("Company"), collectively referred to as "the Parties."`;
  const splitPreamble = doc.splitTextToSize(preamble, 460);
  doc.text(splitPreamble, 60, y, { lineHeightFactor: 1.5 });
  y += splitPreamble.length * 11 * 1.5 + 10;

  // Section 1
  y = drawSectionHeading(doc, "1. PURPOSE AND SCOPE", y);
  const s1 = "The purpose of this MoU is to establish a framework for collaboration between the Institution and the Company for internship placements, skill development programs, and industry-academia engagement.";
  const s1Split = doc.splitTextToSize(s1, 460);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_DARK);
  doc.text(s1Split, 60, y, { lineHeightFactor: 1.5 });
  y += s1Split.length * 11 * 1.5 + 10;

  // Section 2
  y = drawSectionHeading(doc, "2. RESPONSIBILITIES OF THE COMPANY", y);
  const s2items = [
    "• Provide meaningful internship and placement opportunities for students.",
    "• Assign a qualified mentor for evaluating student performance.",
    "• Issue certificates upon successful completion of the internship period.",
    "• Share feedback on student performance for institutional records.",
  ];
  doc.setFont("helvetica", "normal");
  for (const item of s2items) {
    doc.text(item, 70, y);
    y += 16;
  }
  y += 6;

  // Section 3
  y = drawSectionHeading(doc, "3. RESPONSIBILITIES OF THE INSTITUTION", y);
  const s3items = [
    "• Nominate eligible and qualified candidates for the programs.",
    "• Ensure students adhere to the company's code of conduct and policies.",
    "• Facilitate on-campus recruitment drives and coordination.",
    "• Provide academic transcripts and verification as required.",
  ];
  for (const item of s3items) {
    doc.text(item, 70, y);
    y += 16;
  }
  y += 6;

  // Section 4
  y = drawSectionHeading(doc, "4. TERMS AND TERMINATION", y);
  const s4 = "This MoU is valid for a period of two (2) years from the date of signing and may be renewed by mutual written consent. Either party may terminate this MoU with a prior written notice of 30 days.";
  const s4Split = doc.splitTextToSize(s4, 460);
  doc.text(s4Split, 60, y, { lineHeightFactor: 1.5 });
  y += s4Split.length * 11 * 1.5 + 50;

  // Signatures
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(60, y, 230, y);
  doc.line(365, y, 535, y);

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("For Rathinam Group of Institutions", 60, y);
  doc.text(`For ${companyName}`, 365, y);

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Authorized Signatory", 60, y);
  doc.text("Authorized Signatory", 365, y);

  drawFooter(doc, refId);
  doc.save(`MoU_${companyName.replace(/\s+/g, "_")}.pdf`);
}

// ════════════════════════════════════════
// CERTIFICATE OF REGISTRATION
// ════════════════════════════════════════

export function exportRegistrationCertificatePDF(companyName: string, date: string) {
  const doc = new jsPDF("l", "pt", "a4"); // Landscape
  const refId = `RGI/MCR/REG/${Date.now().toString(36).toUpperCase()}`;

  drawPageBorder(doc, true);
  drawWatermark(doc, "R-CHOICE", true);

  // Centered ornamental header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_GREEN);
  doc.text("RATHINAM GROUP OF INSTITUTIONS", 421, 80, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Coimbatore, Tamil Nadu  |  www.rathinam.in", 421, 96, { align: "center" });

  // Decorative divider
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(1.5);
  doc.line(200, 110, 642, 110);
  doc.setDrawColor(...BRAND_INDIGO);
  doc.setLineWidth(0.5);
  doc.line(200, 114, 642, 114);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...BRAND_INDIGO);
  doc.text("CERTIFICATE OF REGISTRATION", 421, 170, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("This is to certify that", 421, 220, { align: "center" });

  // Company Name (prominent)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...TEXT_DARK);
  doc.text(companyName, 421, 270, { align: "center" });

  // Underline accent
  const nameWidth = doc.getTextWidth(companyName);
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(2);
  doc.line(421 - nameWidth / 2, 278, 421 + nameWidth / 2, 278);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text("is officially registered as a Hiring Partner with the", 421, 320, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND_GREEN);
  doc.text("Rathinam Placement Cell — R-Choice Platform", 421, 345, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Date of Registration: ${date}`, 421, 380, { align: "center" });
  doc.text(`Reference: ${refId}`, 421, 398, { align: "center" });

  // Signature block
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(140, 460, 320, 460);
  doc.line(520, 460, 700, 460);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Placement Head", 140, 476);
  doc.text("Management Corporation (MCR)", 520, 476);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Rathinam Placement Cell", 140, 490);
  doc.text("Rathinam Group of Institutions", 520, 490);

  drawFooter(doc, refId, true);
  doc.save(`Registration_Certificate_${companyName.replace(/\s+/g, "_")}.pdf`);
}

// ════════════════════════════════════════
// CSV EXPORT UTILITY
// ════════════════════════════════════════

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) {
    return;
  }
  
  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map((row) => {
      const record = row as Record<string, unknown>;
      return keys.map(k => {
        const raw = record[k] === null || record[k] === undefined ? "" : record[k];
        let cell = raw instanceof Date ? raw.toLocaleString() : String(raw).replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  if (link.download !== undefined) { 
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
