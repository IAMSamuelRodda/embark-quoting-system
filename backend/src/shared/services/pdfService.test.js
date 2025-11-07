/**
 * PDF Service Unit Tests
 *
 * Tests PDF generation with mock quote data (no database required)
 */

import { describe, it, expect } from '@jest/globals';
import { generateQuotePDF } from './pdfService.js';

describe('PDF Service', () => {
  // Mock quote data for testing
  const mockQuote = {
    id: 'test-quote-123',
    quote_number: 'EE-2025-TEST',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '0400 123 456',
    customer_address: '123 Test St, Sydney NSW 2000',
    created_at: new Date('2025-01-15'),
    status: 'draft',
    jobs: [
      {
        id: 'job-1',
        job_type: 'retaining_wall',
        parameters: {
          height: 1.2,
          length: 10,
        },
        materials: [
          {
            name: 'Test Material',
            quantity: 10,
            unit: 'each',
            price_per_unit: 50.0,
            total: 500.0,
          },
        ],
        labour: {
          hours: 8,
          rate_per_hour: 85.0,
          total: 680.0,
        },
        subtotal: 1180.0,
      },
    ],
    financials: {
      direct_cost: 1180.0,
      overhead_multiplier: 1.0,
      profit_first: {
        profit: 59.0,
        owner: 590.0,
        tax: 177.0,
        opex: 354.0,
      },
      price_ex_gst: 1180.0,
      gst_rate: 0.1,
      gst_amount: 118.0,
      total_inc_gst: 1298.0,
      rounded_total: 1300.0,
      deposit: {
        percentage: 30,
        amount: 390.0,
      },
    },
  };

  describe('generateQuotePDF', () => {
    it('should generate a valid PDF buffer', async () => {
      const pdfBuffer = await generateQuotePDF(mockQuote);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should have PDF magic bytes (%PDF-)', async () => {
      const pdfBuffer = await generateQuotePDF(mockQuote);
      const header = pdfBuffer.toString('utf8', 0, 5);

      expect(header).toBe('%PDF-');
    });

    it('should generate PDF with expected size (contains content)', async () => {
      const pdfBuffer = await generateQuotePDF(mockQuote);

      // PDF should be substantial (at least 3KB with all content)
      expect(pdfBuffer.length).toBeGreaterThan(3000);
    });

    it('should include PDF content stream', async () => {
      const pdfBuffer = await generateQuotePDF(mockQuote);
      const content = pdfBuffer.toString('utf8');

      // PDF should have content streams
      expect(content).toContain('stream');
      expect(content).toContain('endstream');
    });

    it('should include PDF metadata', async () => {
      const pdfBuffer = await generateQuotePDF(mockQuote);
      const content = pdfBuffer.toString('utf8');

      // Check for PDF metadata
      expect(content).toContain('/Title');
      expect(content).toContain('/Author');
    });

    it('should generate different PDFs for different quote types', async () => {
      const quoteWithDriveway = {
        ...mockQuote,
        jobs: [
          {
            ...mockQuote.jobs[0],
            job_type: 'driveway',
          },
        ],
      };

      const pdfWithRetainingWall = await generateQuotePDF(mockQuote);
      const pdfWithDriveway = await generateQuotePDF(quoteWithDriveway);

      // PDFs should be different for different job types
      expect(pdfWithRetainingWall.length).not.toBe(pdfWithDriveway.length);
    });

    it('should handle quotes without financials', async () => {
      const quoteWithoutFinancials = {
        ...mockQuote,
        financials: null,
      };

      const pdfBuffer = await generateQuotePDF(quoteWithoutFinancials);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle quotes without jobs', async () => {
      const quoteWithoutJobs = {
        ...mockQuote,
        jobs: [],
      };

      const pdfBuffer = await generateQuotePDF(quoteWithoutJobs);

      // Should still generate valid PDF even without jobs
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);

      const header = pdfBuffer.toString('utf8', 0, 5);
      expect(header).toBe('%PDF-');
    });

    it('should generate larger PDFs for quotes with multiple jobs', async () => {
      const quoteWithMultipleJobs = {
        ...mockQuote,
        jobs: [
          mockQuote.jobs[0],
          {
            ...mockQuote.jobs[0],
            id: 'job-2',
            job_type: 'trenching',
          },
        ],
      };

      const singleJobPdf = await generateQuotePDF(mockQuote);
      const multiJobPdf = await generateQuotePDF(quoteWithMultipleJobs);

      // PDF with more jobs should be larger
      expect(multiJobPdf.length).toBeGreaterThan(singleJobPdf.length);
    });

    it('should end with PDF EOF marker', async () => {
      const pdfBuffer = await generateQuotePDF(mockQuote);
      const content = pdfBuffer.toString('utf8');

      // PDF should end with EOF marker
      expect(content).toContain('%%EOF');
    });
  });
});
