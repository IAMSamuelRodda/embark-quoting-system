/**
 * PDF Generation Utility
 *
 * Converts QuoteViewer component to PDF using jsPDF
 * Features:
 * - Professional layout with company branding
 * - Complete job breakdown and financial summary
 * - Terms & conditions
 * - Rock clause (if applicable)
 */

import jsPDF from 'jspdf';
import type { QuoteWithDetails } from '../../shared/types/models';
import { JobType } from '../../shared/types/models';

// PDF Configuration
const PDF_CONFIG = {
  format: 'a4' as const,
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  lineHeight: 6,
  fontSize: {
    title: 22,
    heading: 16,
    subheading: 12,
    body: 10,
    small: 8,
  },
  colors: {
    primary: '#FFB400', // CAT Gold
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
  },
};

export async function generateQuotePDF(quote: QuoteWithDetails): Promise<Blob> {
  const doc = new jsPDF({
    format: PDF_CONFIG.format,
    orientation: PDF_CONFIG.orientation,
    unit: PDF_CONFIG.unit,
  });

  let yPos = PDF_CONFIG.margins.top;
  const contentWidth = PDF_CONFIG.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const getJobTypeName = (jobType: string): string => {
    const names: Record<string, string> = {
      [JobType.RETAINING_WALL]: 'Retaining Wall',
      [JobType.DRIVEWAY]: 'Driveway',
      [JobType.TRENCHING]: 'Trenching',
      [JobType.STORMWATER]: 'Stormwater',
      [JobType.SITE_PREP]: 'Site Preparation',
    };
    return names[jobType] || jobType;
  };

  const checkPageBreak = (requiredSpace: number): void => {
    if (yPos + requiredSpace > PDF_CONFIG.pageHeight - PDF_CONFIG.margins.bottom) {
      doc.addPage();
      yPos = PDF_CONFIG.margins.top;
    }
  };

  const drawLine = (y: number, color = PDF_CONFIG.colors.border): void => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.5);
    doc.line(PDF_CONFIG.margins.left, y, PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right, y);
  };

  // ============================================================================
  // HEADER
  // ============================================================================

  doc.setFontSize(PDF_CONFIG.fontSize.title);
  doc.setTextColor(PDF_CONFIG.colors.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Embark Earthworks', PDF_CONFIG.margins.left, yPos);
  yPos += 8;

  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_CONFIG.colors.textLight);
  doc.text('Professional Earthmoving Solutions', PDF_CONFIG.margins.left, yPos);
  yPos += 10;

  // Company details (left) and Quote number (right)
  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.text('ABN: 12 345 678 901', PDF_CONFIG.margins.left, yPos);
  doc.text('Phone: (02) 1234 5678', PDF_CONFIG.margins.left, yPos + 4);
  doc.text('Email: quotes@embark-earthworks.com.au', PDF_CONFIG.margins.left, yPos + 8);

  // Quote number on the right
  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setTextColor(PDF_CONFIG.colors.textLight);
  doc.text('Quote Number', PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right, yPos, {
    align: 'right',
  });
  doc.setFontSize(PDF_CONFIG.fontSize.heading);
  doc.setTextColor(PDF_CONFIG.colors.text);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.quote_number, PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right, yPos + 6, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setTextColor(PDF_CONFIG.colors.textLight);
  doc.text(
    formatDate(quote.created_at),
    PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right,
    yPos + 11,
    { align: 'right' },
  );

  yPos += 18;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // CUSTOMER INFORMATION
  // ============================================================================

  checkPageBreak(30);

  doc.setFontSize(PDF_CONFIG.fontSize.heading);
  doc.setTextColor(PDF_CONFIG.colors.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', PDF_CONFIG.margins.left, yPos);
  yPos += 8;

  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', PDF_CONFIG.margins.left, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.customer_name, PDF_CONFIG.margins.left + 30, yPos);
  yPos += 6;

  if (quote.customer_email) {
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', PDF_CONFIG.margins.left, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.customer_email, PDF_CONFIG.margins.left + 30, yPos);
    yPos += 6;
  }

  if (quote.customer_phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', PDF_CONFIG.margins.left, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.customer_phone, PDF_CONFIG.margins.left + 30, yPos);
    yPos += 6;
  }

  if (quote.customer_address) {
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', PDF_CONFIG.margins.left, yPos);
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(quote.customer_address, contentWidth - 35);
    doc.text(addressLines, PDF_CONFIG.margins.left + 30, yPos);
    yPos += addressLines.length * PDF_CONFIG.lineHeight;
  }

  yPos += 10;

  // ============================================================================
  // JOB BREAKDOWN
  // ============================================================================

  checkPageBreak(30);

  doc.setFontSize(PDF_CONFIG.fontSize.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Breakdown', PDF_CONFIG.margins.left, yPos);
  yPos += 8;

  for (let i = 0; i < quote.jobs.length; i++) {
    const job = quote.jobs[i];

    checkPageBreak(40);

    doc.setFontSize(PDF_CONFIG.fontSize.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text(`Job ${i + 1}: ${getJobTypeName(job.job_type)}`, PDF_CONFIG.margins.left, yPos);
    yPos += 8;

    // Job parameters
    if (job.parameters && Object.keys(job.parameters).length > 0) {
      doc.setFontSize(PDF_CONFIG.fontSize.body);
      doc.setFont('helvetica', 'bold');
      doc.text('Specifications:', PDF_CONFIG.margins.left + 5, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_CONFIG.fontSize.small);
      for (const [key, value] of Object.entries(job.parameters)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        doc.text(`${label}: ${String(value)}`, PDF_CONFIG.margins.left + 10, yPos);
        yPos += 5;
      }
      yPos += 3;
    }

    // Materials table
    if (job.materials && job.materials.length > 0) {
      checkPageBreak(30 + job.materials.length * 6);

      doc.setFontSize(PDF_CONFIG.fontSize.body);
      doc.setFont('helvetica', 'bold');
      doc.text('Materials:', PDF_CONFIG.margins.left + 5, yPos);
      yPos += 6;

      // Table headers
      doc.setFontSize(PDF_CONFIG.fontSize.small);
      doc.setFillColor(240, 240, 240);
      doc.rect(
        PDF_CONFIG.margins.left + 10,
        yPos - 4,
        contentWidth - 10,
        6,
        'F',
      );
      doc.text('Item', PDF_CONFIG.margins.left + 12, yPos);
      doc.text('Qty', PDF_CONFIG.margins.left + 90, yPos, { align: 'right' });
      doc.text('Unit Price', PDF_CONFIG.margins.left + 120, yPos, { align: 'right' });
      doc.text('Total', PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 2, yPos, {
        align: 'right',
      });
      yPos += 6;

      // Table rows
      doc.setFont('helvetica', 'normal');
      for (const material of job.materials) {
        checkPageBreak(10);
        doc.text(material.name, PDF_CONFIG.margins.left + 12, yPos);
        doc.text(
          `${material.quantity} ${material.unit}`,
          PDF_CONFIG.margins.left + 90,
          yPos,
          { align: 'right' },
        );
        doc.text(
          formatCurrency(material.price_per_unit),
          PDF_CONFIG.margins.left + 120,
          yPos,
          { align: 'right' },
        );
        doc.text(
          formatCurrency(material.total),
          PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 2,
          yPos,
          { align: 'right' },
        );
        yPos += 6;
      }
      yPos += 3;
    }

    // Labour
    if (job.labour) {
      doc.setFontSize(PDF_CONFIG.fontSize.body);
      doc.setFont('helvetica', 'bold');
      doc.text('Labour:', PDF_CONFIG.margins.left + 5, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_CONFIG.fontSize.small);
      doc.text(
        `${job.labour.hours} hours @ ${formatCurrency(job.labour.rate_per_hour)}/hour`,
        PDF_CONFIG.margins.left + 10,
        yPos,
      );
      doc.text(
        formatCurrency(job.labour.total),
        PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 2,
        yPos,
        { align: 'right' },
      );
      yPos += 8;
    }

    // Job subtotal
    drawLine(yPos);
    yPos += 6;
    doc.setFontSize(PDF_CONFIG.fontSize.body);
    doc.setFont('helvetica', 'bold');
    doc.text('Job Subtotal:', PDF_CONFIG.margins.left + 5, yPos);
    doc.text(
      formatCurrency(job.subtotal),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 2,
      yPos,
      { align: 'right' },
    );
    yPos += 12;
  }

  // ============================================================================
  // FINANCIAL SUMMARY
  // ============================================================================

  if (quote.financials) {
    checkPageBreak(80);

    doc.setFontSize(PDF_CONFIG.fontSize.heading);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', PDF_CONFIG.margins.left, yPos);
    yPos += 8;

    // Background box
    doc.setFillColor(249, 250, 251);
    const boxHeight = 70;
    doc.rect(PDF_CONFIG.margins.left, yPos - 4, contentWidth, boxHeight, 'F');

    doc.setFontSize(PDF_CONFIG.fontSize.body);
    doc.setFont('helvetica', 'normal');

    // Direct costs and overhead
    yPos += 4;
    doc.text('Direct Costs:', PDF_CONFIG.margins.left + 5, yPos);
    doc.text(
      formatCurrency(quote.financials.direct_cost),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 6;

    doc.text('Overhead Multiplier:', PDF_CONFIG.margins.left + 5, yPos);
    doc.text(
      `${quote.financials.overhead_multiplier}x`,
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 10;

    // Profit-First breakdown
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    doc.text('Profit-First Allocation:', PDF_CONFIG.margins.left + 5, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Profit:', PDF_CONFIG.margins.left + 15, yPos);
    doc.text(
      formatCurrency(quote.financials.profit_first.profit),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 5;

    doc.text('Owner Pay:', PDF_CONFIG.margins.left + 15, yPos);
    doc.text(
      formatCurrency(quote.financials.profit_first.owner),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 5;

    doc.text('Tax:', PDF_CONFIG.margins.left + 15, yPos);
    doc.text(
      formatCurrency(quote.financials.profit_first.tax),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 5;

    doc.text('Operating Expenses:', PDF_CONFIG.margins.left + 15, yPos);
    doc.text(
      formatCurrency(quote.financials.profit_first.opex),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 10;

    // GST and total
    doc.setFontSize(PDF_CONFIG.fontSize.body);
    doc.text('Price (ex GST):', PDF_CONFIG.margins.left + 5, yPos);
    doc.text(
      formatCurrency(quote.financials.price_ex_gst),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 6;

    doc.text(`GST (${quote.financials.gst_rate * 100}%):`, PDF_CONFIG.margins.left + 5, yPos);
    doc.text(
      formatCurrency(quote.financials.gst_amount),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );
    yPos += 10;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF_CONFIG.fontSize.subheading);
    doc.text('Total (inc GST):', PDF_CONFIG.margins.left + 5, yPos);
    doc.text(
      formatCurrency(quote.financials.rounded_total),
      PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
      yPos,
      { align: 'right' },
    );

    yPos += 12;

    // Deposit
    if (quote.financials.deposit) {
      doc.setFontSize(PDF_CONFIG.fontSize.body);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Deposit Required (${quote.financials.deposit.percentage}%):`,
        PDF_CONFIG.margins.left + 5,
        yPos,
      );
      doc.setFont('helvetica', 'bold');
      doc.text(
        formatCurrency(quote.financials.deposit.amount),
        PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right - 5,
        yPos,
        { align: 'right' },
      );
      yPos += 10;
    }
  }

  // ============================================================================
  // ROCK CLAUSE
  // ============================================================================

  const requiresRockClause = quote.jobs.some(
    (job) => job.job_type === JobType.RETAINING_WALL || job.job_type === JobType.TRENCHING,
  );

  if (requiresRockClause) {
    checkPageBreak(40);

    doc.setFontSize(PDF_CONFIG.fontSize.heading);
    doc.setFont('helvetica', 'bold');
    doc.text('Rock Clause', PDF_CONFIG.margins.left, yPos);
    yPos += 8;

    doc.setFillColor(254, 252, 232); // Yellow background
    const rockClauseText =
      'Important: This quote is based on standard soil conditions. If rock or similar hard material is encountered during excavation, additional charges will apply. Rock removal is charged at {ROCK_RATE} per cubic meter plus equipment hire and disposal costs. We will notify you immediately if rock is encountered and provide an updated quote before proceeding with rock removal work.';

    const textLines = doc.splitTextToSize(rockClauseText, contentWidth - 10);
    const textHeight = textLines.length * PDF_CONFIG.lineHeight + 8;

    doc.rect(PDF_CONFIG.margins.left, yPos - 4, contentWidth, textHeight, 'F');
    doc.setDrawColor(250, 204, 21); // Yellow border
    doc.setLineWidth(1);
    doc.rect(PDF_CONFIG.margins.left, yPos - 4, contentWidth, textHeight, 'S');

    doc.setFontSize(PDF_CONFIG.fontSize.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_CONFIG.colors.text);
    doc.text(textLines, PDF_CONFIG.margins.left + 5, yPos);
    yPos += textHeight + 5;
  }

  // ============================================================================
  // TERMS & CONDITIONS
  // ============================================================================

  checkPageBreak(60);

  doc.setFontSize(PDF_CONFIG.fontSize.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_CONFIG.colors.text);
  doc.text('Terms & Conditions', PDF_CONFIG.margins.left, yPos);
  yPos += 8;

  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setFont('helvetica', 'normal');

  const terms = [
    '1. Acceptance: This quote is valid for 30 days from the date of issue. Acceptance of this quote constitutes agreement to these terms and conditions.',
    `2. Payment: A deposit of ${quote.financials?.deposit?.percentage || 30}% is required before work commences. The balance is due upon completion of works.`,
    '3. Site Access: Client to ensure clear site access for equipment. Additional charges may apply if access is restricted.',
    '4. Underground Services: Client is responsible for locating and marking all underground services prior to work commencing.',
    '5. Weather: Works may be delayed due to adverse weather conditions. Extensions will be granted for delays beyond our control.',
    '6. Variations: Any variations to the scope of work must be agreed in writing and may result in additional charges.',
    '7. Disputes: Any disputes will be resolved in accordance with the laws of New South Wales, Australia.',
  ];

  for (const term of terms) {
    checkPageBreak(15);
    const termLines = doc.splitTextToSize(term, contentWidth);
    doc.text(termLines, PDF_CONFIG.margins.left, yPos);
    yPos += termLines.length * PDF_CONFIG.lineHeight + 2;
  }

  yPos += 10;

  // ============================================================================
  // FOOTER
  // ============================================================================

  checkPageBreak(20);

  drawLine(yPos);
  yPos += 6;

  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_CONFIG.colors.textLight);
  doc.text(
    'Thank you for considering Embark Earthworks for your project.',
    PDF_CONFIG.pageWidth / 2,
    yPos,
    { align: 'center' },
  );
  yPos += 5;
  doc.text(
    'For questions or to accept this quote, please contact us at quotes@embark-earthworks.com.au',
    PDF_CONFIG.pageWidth / 2,
    yPos,
    { align: 'center' },
  );

  // Return PDF as blob
  return doc.output('blob');
}

/**
 * Download PDF to user's device
 */
export function downloadQuotePDF(quote: QuoteWithDetails, filename?: string): Promise<void> {
  return generateQuotePDF(quote).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${quote.quote_number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  });
}
