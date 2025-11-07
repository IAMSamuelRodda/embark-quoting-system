/**
 * Email Service using AWS SES
 *
 * Sends transactional emails:
 * - Quote delivery (PDF attachment)
 * - Price change notifications
 *
 * Uses AWS SES v2 API for improved deliverability
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import {
  generateQuoteEmailHTML,
  generateQuoteEmailText,
  generatePriceChangeEmailHTML,
  generatePriceChangeEmailText,
} from './emailTemplates.js';

// Initialize SES client
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
});

// Email configuration
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'quotes@embark-earthworks.com.au';
const FROM_NAME = 'Embark Earthworks';

// ============================================================================
// QUOTE EMAILS
// ============================================================================

/**
 * Send quote to customer via email with PDF attachment
 *
 * @param {Object} params - Email parameters
 * @param {string} params.to - Customer email address
 * @param {string} params.customerName - Customer's name
 * @param {string} params.quoteNumber - Quote number (e.g., EE-2025-0001)
 * @param {string} params.totalAmount - Formatted total amount (e.g., $5,432.00)
 * @param {string} params.quoteDate - Formatted quote date
 * @param {number} params.jobCount - Number of jobs in quote
 * @param {string} [params.depositAmount] - Formatted deposit amount
 * @param {number} [params.depositPercentage] - Deposit percentage
 * @param {Buffer} params.pdfAttachment - PDF file buffer
 * @param {string} params.pdfFilename - PDF filename (e.g., EE-2025-0001.pdf)
 * @returns {Promise<Object>} SES response
 */
export async function sendQuoteEmail(params) {
  const {
    to,
    customerName,
    quoteNumber,
    totalAmount,
    quoteDate,
    jobCount,
    depositAmount,
    depositPercentage,
    pdfAttachment,
    pdfFilename,
  } = params;

  // Validate required parameters
  if (!to || !customerName || !quoteNumber || !pdfAttachment) {
    throw new Error('Missing required parameters: to, customerName, quoteNumber, pdfAttachment');
  }

  // Generate email content
  const htmlBody = generateQuoteEmailHTML({
    customerName,
    quoteNumber,
    totalAmount,
    quoteDate,
    jobCount,
    depositAmount,
    depositPercentage,
  });

  const textBody = generateQuoteEmailText({
    customerName,
    quoteNumber,
    totalAmount,
    quoteDate,
    jobCount,
    depositAmount,
    depositPercentage,
  });

  try {
    // Create email with PDF attachment
    const emailParams = {
      FromEmailAddress: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [to],
      },
      Content: {
        Raw: {
          Data: createRawEmailWithAttachment({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject: `Your Quote from Embark Earthworks - ${quoteNumber}`,
            htmlBody,
            textBody,
            attachmentBuffer: pdfAttachment,
            attachmentFilename: pdfFilename,
            attachmentMimeType: 'application/pdf',
          }),
        },
      },
    };

    const command = new SendEmailCommand(emailParams);
    const response = await sesClient.send(command);

    console.log(`[Email] Quote sent to ${to} - MessageId: ${response.MessageId}`);

    return {
      success: true,
      messageId: response.MessageId,
      to,
      quoteNumber,
    };
  } catch (error) {
    console.error('[Email] Failed to send quote:', error);
    throw new Error(`Failed to send quote email: ${error.message}`);
  }
}

// ============================================================================
// PRICE CHANGE NOTIFICATIONS
// ============================================================================

/**
 * Send price change notification to user
 *
 * @param {Object} params - Email parameters
 * @param {string} params.to - User email address
 * @param {string} params.userName - User's name
 * @param {number} params.priceSheetVersion - New price sheet version
 * @param {number} params.itemCount - Number of price items
 * @param {string} params.createdAt - Formatted date
 * @param {string} [params.creatorName] - Name of person who made the change
 * @returns {Promise<Object>} SES response
 */
export async function sendPriceChangeNotification(params) {
  const { to, userName, priceSheetVersion, itemCount, createdAt, creatorName } = params;

  // Validate required parameters
  if (!to || !userName || !priceSheetVersion) {
    throw new Error('Missing required parameters: to, userName, priceSheetVersion');
  }

  // Generate email content
  const htmlBody = generatePriceChangeEmailHTML({
    userName,
    priceSheetVersion,
    itemCount,
    createdAt,
    creatorName,
  });

  const textBody = generatePriceChangeEmailText({
    userName,
    priceSheetVersion,
    itemCount,
    createdAt,
    creatorName,
  });

  try {
    const emailParams = {
      FromEmailAddress: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [to],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `Price Sheet Updated - Version ${priceSheetVersion}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      },
    };

    const command = new SendEmailCommand(emailParams);
    const response = await sesClient.send(command);

    console.log(
      `[Email] Price change notification sent to ${to} - MessageId: ${response.MessageId}`,
    );

    return {
      success: true,
      messageId: response.MessageId,
      to,
      priceSheetVersion,
    };
  } catch (error) {
    console.error('[Email] Failed to send price change notification:', error);
    throw new Error(`Failed to send price change notification: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create raw MIME email with attachment (for SES Raw Email API)
 *
 * @param {Object} params - Email parameters
 * @param {string} params.from - From address
 * @param {string} params.to - To address
 * @param {string} params.subject - Email subject
 * @param {string} params.htmlBody - HTML email body
 * @param {string} params.textBody - Plain text email body
 * @param {Buffer} params.attachmentBuffer - Attachment file buffer
 * @param {string} params.attachmentFilename - Attachment filename
 * @param {string} params.attachmentMimeType - Attachment MIME type
 * @returns {Buffer} Raw MIME email
 */
function createRawEmailWithAttachment(params) {
  const {
    from,
    to,
    subject,
    htmlBody,
    textBody,
    attachmentBuffer,
    attachmentFilename,
    attachmentMimeType,
  } = params;

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const attachmentBoundary = `----=_Attachment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Build MIME email
  let email = '';

  // Headers
  email += `From: ${from}\r\n`;
  email += `To: ${to}\r\n`;
  email += `Subject: ${subject}\r\n`;
  email += 'MIME-Version: 1.0\r\n';
  email += `Content-Type: multipart/mixed; boundary='${boundary}'\r\n\r\n`;

  // Multipart alternative section (HTML + Text)
  email += `--${boundary}\r\n`;
  email += `Content-Type: multipart/alternative; boundary='${attachmentBoundary}'\r\n\r\n`;

  // Plain text part
  email += `--${attachmentBoundary}\r\n`;
  email += 'Content-Type: text/plain; charset=UTF-8\r\n';
  email += 'Content-Transfer-Encoding: 7bit\r\n\r\n';
  email += `${textBody}\r\n\r\n`;

  // HTML part
  email += `--${attachmentBoundary}\r\n`;
  email += 'Content-Type: text/html; charset=UTF-8\r\n';
  email += 'Content-Transfer-Encoding: 7bit\r\n\r\n';
  email += `${htmlBody}\r\n\r\n`;

  // End multipart alternative
  email += `--${attachmentBoundary}--\r\n\r\n`;

  // PDF attachment
  email += `--${boundary}\r\n`;
  email += `Content-Type: ${attachmentMimeType}; name='${attachmentFilename}'\r\n`;
  email += `Content-Description: ${attachmentFilename}\r\n`;
  email += `Content-Disposition: attachment; filename='${attachmentFilename}'\r\n`;
  email += 'Content-Transfer-Encoding: base64\r\n\r\n';

  // Encode attachment as base64 and add line breaks every 76 characters
  const base64Attachment = attachmentBuffer.toString('base64');
  const lines = base64Attachment.match(/.{1,76}/g);
  email += lines.join('\r\n');
  email += '\r\n\r\n';

  // End email
  email += `--${boundary}--\r\n`;

  return Buffer.from(email);
}

/**
 * Batch send price change notifications to multiple users
 *
 * @param {Array<Object>} users - Array of user objects with {email, name}
 * @param {Object} priceSheetData - Price sheet data
 * @param {number} priceSheetData.version - Price sheet version
 * @param {number} priceSheetData.itemCount - Number of items
 * @param {string} priceSheetData.createdAt - Formatted date
 * @param {string} [priceSheetData.creatorName] - Creator name
 * @returns {Promise<Array>} Array of results
 */
export async function batchSendPriceChangeNotifications(users, priceSheetData) {
  const promises = users.map((user) =>
    sendPriceChangeNotification({
      to: user.email,
      userName: user.name,
      priceSheetVersion: priceSheetData.version,
      itemCount: priceSheetData.itemCount,
      createdAt: priceSheetData.createdAt,
      creatorName: priceSheetData.creatorName,
    }).catch((error) => ({
      success: false,
      error: error.message,
      email: user.email,
    })),
  );

  const results = await Promise.allSettled(promises);

  // Log summary
  const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.log(
    `[Email] Batch price change notifications: ${successful} sent, ${failed} failed (out of ${results.length})`,
  );

  return results;
}
