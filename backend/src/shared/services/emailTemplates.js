/**
 * Email Templates
 *
 * HTML and text email templates for:
 * - Quote delivery
 * - Price change notifications
 *
 * All templates include both HTML and plain text versions
 */

// ============================================================================
// QUOTE EMAIL TEMPLATE
// ============================================================================

/**
 * Generate HTML email for quote delivery
 * @param {Object} data - Email data
 * @param {string} data.customerName - Customer's name
 * @param {string} data.quoteNumber - Quote number (e.g., EE-2025-0001)
 * @param {string} data.totalAmount - Formatted total amount (e.g., $5,432.00)
 * @param {string} data.quoteDate - Formatted quote date
 * @param {number} data.jobCount - Number of jobs in quote
 * @param {string} data.depositAmount - Formatted deposit amount
 * @param {number} data.depositPercentage - Deposit percentage
 * @returns {string} HTML email content
 */
export function generateQuoteEmailHTML(data) {
  const {
    customerName,
    quoteNumber,
    totalAmount,
    quoteDate,
    jobCount,
    depositAmount,
    depositPercentage,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote from Embark Earthworks</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #FFB400 0%, #FFA000 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .quote-box {
      background-color: #f9fafb;
      border-left: 4px solid #FFB400;
      padding: 20px;
      margin: 25px 0;
    }
    .quote-detail {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .quote-detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .quote-detail-value {
      color: #1f2937;
      font-weight: 600;
    }
    .total {
      border-top: 2px solid #e5e7eb;
      padding-top: 15px;
      margin-top: 15px;
    }
    .total .quote-detail-value {
      color: #FFB400;
      font-size: 24px;
    }
    .cta-button {
      display: inline-block;
      background-color: #FFB400;
      color: #1f2937;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0;
      text-align: center;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #1e40af;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #FFB400;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Embark Earthworks</h1>
      <p>Professional Earthmoving Solutions</p>
    </div>

    <div class="content">
      <p class="greeting">Hi ${customerName},</p>

      <p>Thank you for requesting a quote for your earthmoving project. We're pleased to provide you with the following detailed quote.</p>

      <div class="quote-box">
        <div class="quote-detail">
          <span class="quote-detail-label">Quote Number:</span>
          <span class="quote-detail-value">${quoteNumber}</span>
        </div>
        <div class="quote-detail">
          <span class="quote-detail-label">Date:</span>
          <span class="quote-detail-value">${quoteDate}</span>
        </div>
        <div class="quote-detail">
          <span class="quote-detail-label">Number of Jobs:</span>
          <span class="quote-detail-value">${jobCount}</span>
        </div>
        <div class="quote-detail total">
          <span class="quote-detail-label">Total (inc GST):</span>
          <span class="quote-detail-value">${totalAmount}</span>
        </div>
      </div>

      <p>Your complete quote is attached as a PDF, which includes:</p>
      <ul>
        <li>Detailed breakdown of all ${jobCount} job${jobCount > 1 ? 's' : ''}</li>
        <li>Materials and labor costs</li>
        <li>Financial summary with GST</li>
        <li>Terms and conditions</li>
      </ul>

      ${
        depositAmount
          ? `
      <div class="info-box">
        <strong>Deposit Required:</strong> A ${depositPercentage}% deposit of <strong>${depositAmount}</strong> is required to secure your booking and commence work.
      </div>
      `
          : ''
      }

      <center>
        <a href="mailto:quotes@embark-earthworks.com.au?subject=Re: Quote ${quoteNumber}" class="cta-button">
          Reply to Accept Quote
        </a>
      </center>

      <p>This quote is valid for 30 days from the date of issue. If you have any questions or would like to discuss any aspect of the quote, please don't hesitate to contact us.</p>

      <p>We look forward to working with you on your project!</p>

      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>The Embark Earthworks Team</strong>
      </p>
    </div>

    <div class="footer">
      <p><strong>Embark Earthworks</strong></p>
      <p>ABN: 12 345 678 901</p>
      <p>Phone: (02) 1234 5678</p>
      <p>Email: <a href="mailto:quotes@embark-earthworks.com.au">quotes@embark-earthworks.com.au</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for quote delivery
 * @param {Object} data - Email data (same as HTML version)
 * @returns {string} Plain text email content
 */
export function generateQuoteEmailText(data) {
  const {
    customerName,
    quoteNumber,
    totalAmount,
    quoteDate,
    jobCount,
    depositAmount,
    depositPercentage,
  } = data;

  return `
EMBARK EARTHWORKS
Professional Earthmoving Solutions

Hi ${customerName},

Thank you for requesting a quote for your earthmoving project. We're pleased to provide you with the following detailed quote.

QUOTE DETAILS
--------------
Quote Number: ${quoteNumber}
Date: ${quoteDate}
Number of Jobs: ${jobCount}
Total (inc GST): ${totalAmount}

Your complete quote is attached as a PDF, which includes:
- Detailed breakdown of all ${jobCount} job${jobCount > 1 ? 's' : ''}
- Materials and labor costs
- Financial summary with GST
- Terms and conditions

${
  depositAmount
    ? `DEPOSIT REQUIRED: A ${depositPercentage}% deposit of ${depositAmount} is required to secure your booking and commence work.\n\n`
    : ''
}
This quote is valid for 30 days from the date of issue. If you have any questions or would like to discuss any aspect of the quote, please don't hesitate to contact us.

To accept this quote, simply reply to this email.

We look forward to working with you on your project!

Best regards,
The Embark Earthworks Team

---
Embark Earthworks
ABN: 12 345 678 901
Phone: (02) 1234 5678
Email: quotes@embark-earthworks.com.au
  `.trim();
}

// ============================================================================
// PRICE CHANGE NOTIFICATION TEMPLATE
// ============================================================================

/**
 * Generate HTML email for price change notification
 * @param {Object} data - Email data
 * @param {string} data.userName - User's name
 * @param {number} data.priceSheetVersion - New price sheet version number
 * @param {number} data.itemCount - Number of price items
 * @param {string} data.createdAt - Formatted date
 * @param {string} [data.creatorName] - Name of person who made the change
 * @returns {string} HTML email content
 */
export function generatePriceChangeEmailHTML(data) {
  const { userName, priceSheetVersion, itemCount, createdAt, creatorName } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Sheet Updated</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .alert-box p {
      margin: 0;
      color: #92400e;
      font-size: 15px;
    }
    .info-section {
      background-color: #f9fafb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 15px;
    }
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Price Sheet Updated</h1>
      <p>Embark Quoting System</p>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>

      <p>This is a notification that the price sheet has been updated in the Embark Quoting System.</p>

      <div class="alert-box">
        <p><strong>⚠️ Action Required:</strong> Please review the updated prices before creating new quotes to ensure accuracy.</p>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">New Version:</span>
          <span class="info-value">${priceSheetVersion}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Items:</span>
          <span class="info-value">${itemCount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Updated:</span>
          <span class="info-value">${createdAt}</span>
        </div>
        ${
          creatorName
            ? `
        <div class="info-row">
          <span class="info-label">Updated By:</span>
          <span class="info-value">${creatorName}</span>
        </div>
        `
            : ''
        }
      </div>

      <p><strong>What this means for you:</strong></p>
      <ul>
        <li>All new quotes will automatically use the updated prices (Version ${priceSheetVersion})</li>
        <li>Existing draft quotes will need to be reviewed and may need recalculation</li>
        <li>Sent quotes are not affected and remain valid as-is</li>
      </ul>

      <p>To view the complete price list, log in to the Embark Quoting System and navigate to the Price Management section (Admin only).</p>

      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>Embark Quoting System</strong>
      </p>
    </div>

    <div class="footer">
      <p><strong>Embark Earthworks</strong></p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for price change notification
 * @param {Object} data - Email data (same as HTML version)
 * @returns {string} Plain text email content
 */
export function generatePriceChangeEmailText(data) {
  const { userName, priceSheetVersion, itemCount, createdAt, creatorName } = data;

  return `
PRICE SHEET UPDATED
Embark Quoting System

Hi ${userName},

This is a notification that the price sheet has been updated in the Embark Quoting System.

⚠️ ACTION REQUIRED: Please review the updated prices before creating new quotes to ensure accuracy.

UPDATE DETAILS
--------------
New Version: ${priceSheetVersion}
Total Items: ${itemCount}
Updated: ${createdAt}
${creatorName ? `Updated By: ${creatorName}` : ''}

WHAT THIS MEANS FOR YOU:
- All new quotes will automatically use the updated prices (Version ${priceSheetVersion})
- Existing draft quotes will need to be reviewed and may need recalculation
- Sent quotes are not affected and remain valid as-is

To view the complete price list, log in to the Embark Quoting System and navigate to the Price Management section (Admin only).

Best regards,
Embark Quoting System

---
Embark Earthworks
This is an automated notification. Please do not reply to this email.
  `.trim();
}
