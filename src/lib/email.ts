import nodemailer from 'nodemailer';
import getDb from './db';

const GMAIL_USER = process.env.GMAIL_USER || 'asher@developthesouth.com';
const GMAIL_PASS = process.env.GMAIL_PASS;

function getTransporter() {
  if (!GMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  type: string;
  relatedId?: number;
}

export async function sendEmail({ to, subject, html, type, relatedId }: EmailOptions) {
  const db = getDb();

  // Log to DB
  db.prepare(
    'INSERT INTO email_log (to_email, subject, type, related_id) VALUES (?, ?, ?, ?)'
  ).run(to, subject, type, relatedId || null);

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[EMAIL - not sent, GMAIL_PASS not set] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL BODY] ${html.replace(/<[^>]+>/g, ' ').substring(0, 500)}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Southern Cities Construction" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Subject: ${subject}`, err);
  }
}

export function sendApplicationConfirmation(email: string, companyName: string, appId: number) {
  return sendEmail({
    to: email,
    subject: 'Application Received - Southern Cities Construction',
    type: 'application_confirm',
    relatedId: appId,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #132452; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Southern Cities Construction LLC</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <p>Dear <strong>${companyName}</strong>,</p>
          <p>We received your vendor application. Our team will review it within 3-5 business days.</p>
          <p>You will receive an email once a decision has been made.</p>
          <br/>
          <p>Thank you,<br/>Southern Cities Construction LLC</p>
        </div>
      </div>
    `,
  });
}

export function sendApplicationApproved(email: string, companyName: string, contractorId: number) {
  return sendEmail({
    to: email,
    subject: 'Congratulations - You\'ve Been Added to the SCC Vendor Network',
    type: 'approved',
    relatedId: contractorId,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #132452; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Southern Cities Construction LLC</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <p>Dear <strong>${companyName}</strong>,</p>
          <p>Congratulations! Your vendor application has been approved.</p>
          <p><strong>Your Vendor ID:</strong> SCC-V${String(contractorId).padStart(4, '0')}</p>
          <h3 style="color: #132452;">What to Expect</h3>
          <ul>
            <li>You are now part of the SCC Vendor Network</li>
            <li>You may be contacted for upcoming projects</li>
            <li>Invoices can be submitted through our invoice system</li>
          </ul>
          <h3 style="color: #132452;">How to Submit Invoices</h3>
          <p>Invoices will be created through our internal system. Your project manager will coordinate invoice submission with you.</p>
          <br/>
          <p>Welcome aboard!<br/>Southern Cities Construction LLC</p>
        </div>
      </div>
    `,
  });
}

export function sendApplicationRejected(email: string, companyName: string, appId: number, customNote?: string) {
  return sendEmail({
    to: email,
    subject: 'Vendor Application Update - Southern Cities Construction',
    type: 'rejected',
    relatedId: appId,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #132452; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Southern Cities Construction LLC</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <p>Dear <strong>${companyName}</strong>,</p>
          <p>Thank you for your interest in working with Southern Cities Construction. After reviewing your application, we are unable to add you to our vendor network at this time.</p>
          ${customNote ? `<p><strong>Note:</strong> ${customNote}</p>` : ''}
          <p>We will keep your application on file for future consideration.</p>
          <br/>
          <p>Thank you,<br/>Southern Cities Construction LLC</p>
        </div>
      </div>
    `,
  });
}

export function sendPaymentConfirmation(email: string, companyName: string, invoiceNum: string, amount: number, invoiceId: number) {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  return sendEmail({
    to: email,
    subject: `Payment Confirmation - Invoice ${invoiceNum}`,
    type: 'payment_confirm',
    relatedId: invoiceId,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #132452; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Southern Cities Construction LLC</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb;">
          <p>Dear <strong>${companyName}</strong>,</p>
          <p>This confirms that payment has been processed for the following invoice:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; color: #6b7280;">Invoice Number</td>
              <td style="padding: 8px; font-weight: bold;">${invoiceNum}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; color: #6b7280;">Amount Paid</td>
              <td style="padding: 8px; font-weight: bold; color: #059669;">${formatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Payment Date</td>
              <td style="padding: 8px; font-weight: bold;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
            </tr>
          </table>
          <br/>
          <p>Thank you for your work with Southern Cities Construction.</p>
        </div>
      </div>
    `,
  });
}
