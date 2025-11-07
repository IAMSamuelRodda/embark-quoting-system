/**
 * QuoteViewer Component
 *
 * Customer-facing quote display with professional layout
 * Used for:
 * - Web preview
 * - PDF generation
 * - Email content
 *
 * Features:
 * - Company branding
 * - Customer details
 * - Job breakdowns (materials, labor)
 * - Financial summary (Profit-First model)
 * - Terms & conditions
 * - Rock clause (if applicable)
 */

import { useMemo } from 'react';
import type { QuoteWithDetails, Job, Material } from '../../shared/types/models';
import { JobType } from '../../shared/types/models';

interface QuoteViewerProps {
  quote: QuoteWithDetails;
  /** Print-optimized layout for PDF generation */
  printMode?: boolean;
}

export function QuoteViewer({ quote, printMode = false }: QuoteViewerProps) {
  // Format currency (Australian)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  // Get job type display name
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

  // Check if any job requires rock clause
  const requiresRockClause = useMemo(() => {
    return quote.jobs.some(
      (job) => job.job_type === JobType.RETAINING_WALL || job.job_type === JobType.TRENCHING,
    );
  }, [quote.jobs]);

  // Container classes for print vs web
  const containerClass = printMode
    ? 'max-w-[210mm] mx-auto bg-white p-8 font-sans text-sm'
    : 'max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 my-8';

  return (
    <div className={containerClass} id="quote-viewer">
      {/* Company Header */}
      <header className="border-b-4 border-primary-500 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Embark Earthworks</h1>
            <p className="text-gray-600 mt-1">Professional Earthmoving Solutions</p>
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p>ABN: 12 345 678 901</p>
              <p>Phone: (02) 1234 5678</p>
              <p>Email: quotes@embark-earthworks.com.au</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Quote Number</p>
            <p className="text-2xl font-bold text-primary-600">{quote.quote_number}</p>
            <p className="text-sm text-gray-600 mt-2">{formatDate(quote.created_at)}</p>
          </div>
        </div>
      </header>

      {/* Customer Details */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-2">
          Customer Information
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-700">Name:</p>
            <p className="text-gray-900">{quote.customer_name}</p>
          </div>
          {quote.customer_email && (
            <div>
              <p className="font-semibold text-gray-700">Email:</p>
              <p className="text-gray-900">{quote.customer_email}</p>
            </div>
          )}
          {quote.customer_phone && (
            <div>
              <p className="font-semibold text-gray-700">Phone:</p>
              <p className="text-gray-900">{quote.customer_phone}</p>
            </div>
          )}
          {quote.customer_address && (
            <div className="col-span-2">
              <p className="font-semibold text-gray-700">Address:</p>
              <p className="text-gray-900">{quote.customer_address}</p>
              {quote.location && (
                <p className="text-gray-600">
                  {quote.location.suburb && `${quote.location.suburb}, `}
                  {quote.location.postcode}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Job Breakdown */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-2">Job Breakdown</h2>
        {quote.jobs.map((job, index) => (
          <JobBreakdown key={job.id} job={job} index={index} formatCurrency={formatCurrency} />
        ))}
      </section>

      {/* Financial Summary */}
      {quote.financials && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-2">
            Financial Summary
          </h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-3">
              {/* Job Subtotals */}
              {quote.jobs.map((job, index) => (
                <div key={job.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    Job {index + 1}: {getJobTypeName(job.job_type)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(job.subtotal)}
                  </span>
                </div>
              ))}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Direct Costs:</span>
                  <span className="font-medium">{formatCurrency(quote.financials.direct_cost)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-700">Overhead Multiplier:</span>
                  <span className="font-medium">{quote.financials.overhead_multiplier}x</span>
                </div>
              </div>

              {/* Profit-First Breakdown */}
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">Profit-First Allocation:</p>
                <div className="space-y-1 text-sm pl-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Profit:</span>
                    <span className="text-gray-900">
                      {formatCurrency(quote.financials.profit_first.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Owner Pay:</span>
                    <span className="text-gray-900">
                      {formatCurrency(quote.financials.profit_first.owner)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax:</span>
                    <span className="text-gray-900">
                      {formatCurrency(quote.financials.profit_first.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Operating Expenses:</span>
                    <span className="text-gray-900">
                      {formatCurrency(quote.financials.profit_first.opex)}
                    </span>
                  </div>
                </div>
              </div>

              {/* GST and Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Price (ex GST):</span>
                  <span className="font-medium">
                    {formatCurrency(quote.financials.price_ex_gst)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-700">GST ({quote.financials.gst_rate * 100}%):</span>
                  <span className="font-medium">{formatCurrency(quote.financials.gst_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t-2">
                  <span className="text-gray-900">Total (inc GST):</span>
                  <span className="text-primary-600">
                    {formatCurrency(quote.financials.rounded_total)}
                  </span>
                </div>
              </div>

              {/* Deposit */}
              {quote.financials.deposit && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      Deposit Required ({quote.financials.deposit.percentage}%):
                    </span>
                    <span className="font-semibold text-primary-600">
                      {formatCurrency(quote.financials.deposit.amount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Rock Clause */}
      {requiresRockClause && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-2">Rock Clause</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
            <p className="text-gray-800 leading-relaxed">
              <strong>Important:</strong> This quote is based on standard soil conditions. If rock
              or similar hard material is encountered during excavation, additional charges will
              apply. Rock removal is charged at ${'{'}ROCK_RATE{'}'} per cubic meter plus equipment
              hire and disposal costs. We will notify you immediately if rock is encountered and
              provide an updated quote before proceeding with rock removal work.
            </p>
          </div>
        </section>
      )}

      {/* Terms & Conditions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-2">
          Terms & Conditions
        </h2>
        <div className="text-xs text-gray-700 space-y-2">
          <p>
            <strong>1. Acceptance:</strong> This quote is valid for 30 days from the date of
            issue. Acceptance of this quote constitutes agreement to these terms and conditions.
          </p>
          <p>
            <strong>2. Payment:</strong> A deposit of{' '}
            {quote.financials?.deposit?.percentage || 30}% is required before work commences. The
            balance is due upon completion of works. Payment can be made via bank transfer or
            credit card.
          </p>
          <p>
            <strong>3. Site Access:</strong> Client to ensure clear site access for equipment.
            Additional charges may apply if access is restricted or requires special arrangements.
          </p>
          <p>
            <strong>4. Underground Services:</strong> Client is responsible for locating and
            marking all underground services (water, gas, electricity, telecommunications) prior to
            work commencing. Dial Before You Dig service must be used.
          </p>
          <p>
            <strong>5. Weather:</strong> Works may be delayed due to adverse weather conditions.
            Extensions will be granted for delays beyond our control.
          </p>
          <p>
            <strong>6. Variations:</strong> Any variations to the scope of work must be agreed in
            writing and may result in additional charges.
          </p>
          <p>
            <strong>7. Disputes:</strong> Any disputes will be resolved in accordance with the laws
            of New South Wales, Australia.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pt-6 mt-8 text-center text-sm text-gray-600">
        <p className="mb-2">Thank you for considering Embark Earthworks for your project.</p>
        <p>
          For questions or to accept this quote, please contact us at{' '}
          <a
            href="mailto:quotes@embark-earthworks.com.au"
            className="text-primary-600 hover:underline"
          >
            quotes@embark-earthworks.com.au
          </a>
        </p>
      </footer>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface JobBreakdownProps {
  job: Job;
  index: number;
  formatCurrency: (amount: number) => string;
}

function JobBreakdown({ job, index, formatCurrency }: JobBreakdownProps) {
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

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Job {index + 1}: {getJobTypeName(job.job_type)}
      </h3>

      {/* Job Parameters */}
      {job.parameters && Object.keys(job.parameters).length > 0 && (
        <div className="mb-3 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Specifications:</p>
          <div className="pl-4 text-gray-600">
            {Object.entries(job.parameters).map(([key, value]) => (
              <p key={key}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:{' '}
                {String(value)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Materials */}
      {job.materials && job.materials.length > 0 && (
        <div className="mb-3">
          <p className="font-semibold text-sm text-gray-700 mb-1">Materials:</p>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Quantity</th>
                <th className="text-right p-2">Unit Price</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {job.materials.map((material, idx) => (
                <MaterialRow key={idx} material={material} formatCurrency={formatCurrency} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Labour */}
      {job.labour && (
        <div className="mb-3 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Labour:</p>
          <div className="pl-4">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {job.labour.hours} hours @ {formatCurrency(job.labour.rate_per_hour)}/hour
              </span>
              <span className="font-medium">{formatCurrency(job.labour.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Job Subtotal */}
      <div className="flex justify-between items-center pt-2 mt-2 border-t">
        <span className="font-semibold text-gray-800">Job Subtotal:</span>
        <span className="font-bold text-primary-600">{formatCurrency(job.subtotal)}</span>
      </div>
    </div>
  );
}

interface MaterialRowProps {
  material: Material;
  formatCurrency: (amount: number) => string;
}

function MaterialRow({ material, formatCurrency }: MaterialRowProps) {
  return (
    <tr className="border-b border-gray-100">
      <td className="p-2 text-gray-800">{material.name}</td>
      <td className="p-2 text-right text-gray-600">
        {material.quantity} {material.unit}
      </td>
      <td className="p-2 text-right text-gray-600">
        {formatCurrency(material.price_per_unit)}
      </td>
      <td className="p-2 text-right font-medium text-gray-900">
        {formatCurrency(material.total)}
      </td>
    </tr>
  );
}
