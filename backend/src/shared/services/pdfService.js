/**
 * PDF Generation Service using PDFKit
 *
 * Generates PDF documents for quotes on the backend (for email attachments)
 * Features:
 * - Professional layout with company branding
 * - Complete job breakdown and financial summary
 * - Terms & conditions
 * - Rock clause (if applicable)
 */

import PDFDocument from 'pdfkit';

// PDF Configuration
const PDF_CONFIG = {
  size: 'A4', // 595.28 x 841.89 points
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  colors: {
    primary: '#FFB400', // CAT Gold
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
  },
};

const JOB_TYPE_NAMES = {
  retaining_wall: 'Retaining Wall',
  driveway: 'Driveway',
  trenching: 'Trenching',
  stormwater: 'Stormwater',
  site_prep: 'Site Preparation',
};

/**
 * Generate quote PDF
 *
 * @param {Object} quote - Quote with all related data (jobs, financials)
 * @returns {Promise<Buffer>} PDF file buffer
 */
export async function generateQuotePDF(quote) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: PDF_CONFIG.size,
        margins: PDF_CONFIG.margins,
        info: {
          Title: `Quote ${quote.quote_number}`,
          Author: 'Embark Earthworks',
          Subject: `Quote for ${quote.customer_name}`,
          Creator: 'Embark Quoting System',
        },
      });

      // Collect PDF data in buffer
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (error) => reject(error));

      // Generate PDF content
      addHeader(doc, quote);
      addCustomerDetails(doc, quote);
      addJobBreakdown(doc, quote);
      addFinancialSummary(doc, quote);

      const requiresRockClause =
        quote.jobs &&
        quote.jobs.some((job) => job.job_type === 'retaining_wall' || job.job_type === 'trenching');
      if (requiresRockClause) {
        addRockClause(doc, quote);
      }

      addTermsAndConditions(doc, quote);
      addFooter(doc);

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================================
// PDF SECTIONS
// ============================================================================

function addHeader(doc, quote) {
  // Company name
  doc
    .fontSize(24)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text('Embark Earthworks', PDF_CONFIG.margins.left, PDF_CONFIG.margins.top);

  doc
    .fontSize(12)
    .fillColor(PDF_CONFIG.colors.textLight)
    .font('Helvetica')
    .text('Professional Earthmoving Solutions', PDF_CONFIG.margins.left, doc.y);

  doc.moveDown(0.5);

  // Company details (left)
  const leftX = PDF_CONFIG.margins.left;
  const topY = doc.y;
  doc
    .fontSize(10)
    .text('ABN: 12 345 678 901', leftX, topY)
    .text('Phone: (02) 1234 5678', leftX, doc.y)
    .text('Email: quotes@embark-earthworks.com.au', leftX, doc.y);

  // Quote number (right)
  const rightX = doc.page.width - PDF_CONFIG.margins.right - 150;
  doc
    .fontSize(10)
    .fillColor(PDF_CONFIG.colors.textLight)
    .text('Quote Number', rightX, topY, { width: 150, align: 'right' });

  doc
    .fontSize(16)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text(quote.quote_number, rightX, doc.y, { width: 150, align: 'right' });

  doc
    .fontSize(10)
    .fillColor(PDF_CONFIG.colors.textLight)
    .font('Helvetica')
    .text(formatDate(quote.created_at), rightX, doc.y, { width: 150, align: 'right' });

  doc.moveDown(1);

  // Horizontal line
  doc
    .strokeColor(PDF_CONFIG.colors.border)
    .lineWidth(1)
    .moveTo(PDF_CONFIG.margins.left, doc.y)
    .lineTo(doc.page.width - PDF_CONFIG.margins.right, doc.y)
    .stroke();

  doc.moveDown(1.5);
}

function addCustomerDetails(doc, quote) {
  doc
    .fontSize(16)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text('Customer Information', PDF_CONFIG.margins.left, doc.y);

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Name: ', PDF_CONFIG.margins.left, doc.y, { continued: true })
    .font('Helvetica')
    .text(quote.customer_name);

  if (quote.customer_email) {
    doc
      .font('Helvetica-Bold')
      .text('Email: ', PDF_CONFIG.margins.left, doc.y, { continued: true })
      .font('Helvetica')
      .text(quote.customer_email);
  }

  if (quote.customer_phone) {
    doc
      .font('Helvetica-Bold')
      .text('Phone: ', PDF_CONFIG.margins.left, doc.y, { continued: true })
      .font('Helvetica')
      .text(quote.customer_phone);
  }

  if (quote.customer_address) {
    doc
      .font('Helvetica-Bold')
      .text('Address: ', PDF_CONFIG.margins.left, doc.y, { continued: true })
      .font('Helvetica')
      .text(quote.customer_address);
  }

  doc.moveDown(1.5);
}

function addJobBreakdown(doc, quote) {
  checkPageBreak(doc, 100);

  doc
    .fontSize(16)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text('Job Breakdown', PDF_CONFIG.margins.left, doc.y);

  doc.moveDown(0.5);

  if (!quote.jobs || quote.jobs.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No jobs defined', PDF_CONFIG.margins.left, doc.y);
    doc.moveDown(1);
    return;
  }

  quote.jobs.forEach((job, index) => {
    checkPageBreak(doc, 150);

    // Job title
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(
        `Job ${index + 1}: ${JOB_TYPE_NAMES[job.job_type] || job.job_type}`,
        PDF_CONFIG.margins.left,
        doc.y,
      );

    doc.moveDown(0.5);

    // Job parameters
    if (job.parameters && Object.keys(job.parameters).length > 0) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Specifications:', PDF_CONFIG.margins.left + 10);
      doc.font('Helvetica');
      Object.entries(job.parameters).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        doc.fontSize(9).text(`${label}: ${value}`, PDF_CONFIG.margins.left + 20, doc.y);
      });
      doc.moveDown(0.3);
    }

    // Materials
    if (job.materials && job.materials.length > 0) {
      checkPageBreak(doc, 80 + job.materials.length * 15);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Materials:', PDF_CONFIG.margins.left + 10, doc.y);

      doc.moveDown(0.3);

      // Table header
      const tableLeft = PDF_CONFIG.margins.left + 20;
      const tableWidth = doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right - 20;

      doc
        .fillColor('#f3f4f6')
        .rect(tableLeft, doc.y - 3, tableWidth, 18)
        .fill();

      doc
        .fontSize(9)
        .fillColor(PDF_CONFIG.colors.text)
        .font('Helvetica-Bold')
        .text('Item', tableLeft + 5, doc.y)
        .text('Qty', tableLeft + tableWidth - 220, doc.y, { width: 60, align: 'right' })
        .text('Unit Price', tableLeft + tableWidth - 150, doc.y, { width: 70, align: 'right' })
        .text('Total', tableLeft + tableWidth - 70, doc.y, { width: 70, align: 'right' });

      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica').fontSize(9);
      job.materials.forEach((material) => {
        checkPageBreak(doc, 15);
        const rowY = doc.y;
        doc.fillColor(PDF_CONFIG.colors.text).text(material.name, tableLeft + 5, rowY, {
          width: tableWidth - 230,
        });
        doc.text(`${material.quantity} ${material.unit}`, tableLeft + tableWidth - 220, rowY, {
          width: 60,
          align: 'right',
        });
        doc.text(formatCurrency(material.price_per_unit), tableLeft + tableWidth - 150, rowY, {
          width: 70,
          align: 'right',
        });
        doc.text(formatCurrency(material.total), tableLeft + tableWidth - 70, rowY, {
          width: 70,
          align: 'right',
        });
        doc.moveDown(0.5);
      });

      doc.moveDown(0.3);
    }

    // Labour
    if (job.labour) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Labour:', PDF_CONFIG.margins.left + 10, doc.y);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          `${job.labour.hours} hours @ ${formatCurrency(job.labour.rate_per_hour)}/hour`,
          PDF_CONFIG.margins.left + 20,
          doc.y,
          { continued: true },
        )
        .text(formatCurrency(job.labour.total), { align: 'right' });

      doc.moveDown(0.5);
    }

    // Job subtotal
    doc
      .strokeColor(PDF_CONFIG.colors.border)
      .lineWidth(0.5)
      .moveTo(PDF_CONFIG.margins.left + 10, doc.y)
      .lineTo(doc.page.width - PDF_CONFIG.margins.right, doc.y)
      .stroke();

    doc.moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Job Subtotal:', PDF_CONFIG.margins.left + 10, doc.y, { continued: true })
      .text(formatCurrency(job.subtotal), { align: 'right' });

    doc.moveDown(1.5);
  });
}

function addFinancialSummary(doc, quote) {
  if (!quote.financials) {
    return;
  }

  checkPageBreak(doc, 250);

  doc
    .fontSize(16)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text('Financial Summary', PDF_CONFIG.margins.left, doc.y);

  doc.moveDown(0.5);

  // Background box
  const boxLeft = PDF_CONFIG.margins.left;
  const boxWidth = doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;
  const boxTop = doc.y;
  const boxHeight = 200;

  doc.fillColor('#f9fafb').rect(boxLeft, boxTop, boxWidth, boxHeight).fill();

  doc.fillColor(PDF_CONFIG.colors.text);
  let yPos = boxTop + 15;

  // Direct costs and overhead
  doc
    .fontSize(10)
    .font('Helvetica')
    .text('Direct Costs:', boxLeft + 10, yPos, { continued: true })
    .text(formatCurrency(quote.financials.direct_cost), { align: 'right' });

  yPos += 15;
  doc
    .text('Overhead Multiplier:', boxLeft + 10, yPos, { continued: true })
    .text(`${quote.financials.overhead_multiplier}x`, { align: 'right' });

  yPos += 25;

  // Profit-First breakdown
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Profit-First Allocation:', boxLeft + 10, yPos);

  yPos += 15;
  doc
    .font('Helvetica')
    .text('Profit:', boxLeft + 20, yPos, { continued: true })
    .text(formatCurrency(quote.financials.profit_first.profit), { align: 'right' });

  yPos += 12;
  doc
    .text('Owner Pay:', boxLeft + 20, yPos, { continued: true })
    .text(formatCurrency(quote.financials.profit_first.owner), { align: 'right' });

  yPos += 12;
  doc
    .text('Tax:', boxLeft + 20, yPos, { continued: true })
    .text(formatCurrency(quote.financials.profit_first.tax), { align: 'right' });

  yPos += 12;
  doc
    .text('Operating Expenses:', boxLeft + 20, yPos, { continued: true })
    .text(formatCurrency(quote.financials.profit_first.opex), { align: 'right' });

  yPos += 25;

  // GST and total
  doc
    .fontSize(10)
    .text('Price (ex GST):', boxLeft + 10, yPos, { continued: true })
    .text(formatCurrency(quote.financials.price_ex_gst), { align: 'right' });

  yPos += 15;
  doc
    .text(`GST (${quote.financials.gst_rate * 100}%):`, boxLeft + 10, yPos, { continued: true })
    .text(formatCurrency(quote.financials.gst_amount), { align: 'right' });

  yPos += 25;

  // Total
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Total (inc GST):', boxLeft + 10, yPos, { continued: true })
    .fillColor(PDF_CONFIG.colors.primary)
    .text(formatCurrency(quote.financials.rounded_total), { align: 'right' });

  doc.fillColor(PDF_CONFIG.colors.text);

  doc.y = boxTop + boxHeight + 10;

  // Deposit
  if (quote.financials.deposit) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Deposit Required (${quote.financials.deposit.percentage}%):`, boxLeft + 10, doc.y, {
        continued: true,
      })
      .font('Helvetica-Bold')
      .text(formatCurrency(quote.financials.deposit.amount), { align: 'right' });

    doc.moveDown(0.5);
  }

  doc.moveDown(1);
}

function addRockClause(doc, _quote) {
  checkPageBreak(doc, 100);

  doc
    .fontSize(16)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text('Rock Clause', PDF_CONFIG.margins.left, doc.y);

  doc.moveDown(0.5);

  const boxLeft = PDF_CONFIG.margins.left;
  const boxWidth = doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;
  const boxTop = doc.y;

  const rockText =
    'Important: This quote is based on standard soil conditions. If rock or similar hard material is encountered during excavation, additional charges will apply. Rock removal is charged at {ROCK_RATE} per cubic meter plus equipment hire and disposal costs. We will notify you immediately if rock is encountered and provide an updated quote before proceeding with rock removal work.';

  // Yellow background
  doc.fillColor('#fef9c3').rect(boxLeft, boxTop, boxWidth, 80).fill();

  // Yellow border
  doc.strokeColor('#facc15').lineWidth(2).rect(boxLeft, boxTop, boxWidth, 80).stroke();

  doc
    .fillColor(PDF_CONFIG.colors.text)
    .fontSize(9)
    .font('Helvetica')
    .text(rockText, boxLeft + 10, boxTop + 10, {
      width: boxWidth - 20,
      align: 'left',
    });

  doc.y = boxTop + 85;
  doc.moveDown(1);
}

function addTermsAndConditions(doc, quote) {
  checkPageBreak(doc, 200);

  doc
    .fontSize(16)
    .fillColor(PDF_CONFIG.colors.text)
    .font('Helvetica-Bold')
    .text('Terms & Conditions', PDF_CONFIG.margins.left, doc.y);

  doc.moveDown(0.5);

  const depositPercentage = quote.financials?.deposit?.percentage || 30;

  const terms = [
    '1. Acceptance: This quote is valid for 30 days from the date of issue. Acceptance of this quote constitutes agreement to these terms and conditions.',
    `2. Payment: A deposit of ${depositPercentage}% is required before work commences. The balance is due upon completion of works.`,
    '3. Site Access: Client to ensure clear site access for equipment. Additional charges may apply if access is restricted.',
    '4. Underground Services: Client is responsible for locating and marking all underground services prior to work commencing.',
    '5. Weather: Works may be delayed due to adverse weather conditions. Extensions will be granted for delays beyond our control.',
    '6. Variations: Any variations to the scope of work must be agreed in writing and may result in additional charges.',
    '7. Disputes: Any disputes will be resolved in accordance with the laws of New South Wales, Australia.',
  ];

  doc.fontSize(9).font('Helvetica');

  terms.forEach((term) => {
    checkPageBreak(doc, 30);
    doc.text(term, PDF_CONFIG.margins.left, doc.y, {
      width: doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right,
      align: 'left',
    });
    doc.moveDown(0.5);
  });

  doc.moveDown(1);
}

function addFooter(doc) {
  checkPageBreak(doc, 60);

  doc
    .strokeColor(PDF_CONFIG.colors.border)
    .lineWidth(0.5)
    .moveTo(PDF_CONFIG.margins.left, doc.y)
    .lineTo(doc.page.width - PDF_CONFIG.margins.right, doc.y)
    .stroke();

  doc.moveDown(0.5);

  doc
    .fontSize(9)
    .fillColor(PDF_CONFIG.colors.textLight)
    .font('Helvetica')
    .text(
      'Thank you for considering Embark Earthworks for your project.',
      PDF_CONFIG.margins.left,
      doc.y,
      {
        width: doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right,
        align: 'center',
      },
    );

  doc.moveDown(0.3);

  doc.text(
    'For questions or to accept this quote, please contact us at quotes@embark-earthworks.com.au',
    PDF_CONFIG.margins.left,
    doc.y,
    {
      width: doc.page.width - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right,
      align: 'center',
    },
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function checkPageBreak(doc, requiredSpace) {
  const availableSpace = doc.page.height - doc.y - PDF_CONFIG.margins.bottom;
  if (availableSpace < requiredSpace) {
    doc.addPage();
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}
