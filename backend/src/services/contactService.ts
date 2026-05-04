import prisma from '../prisma';
import sgMail, { ResponseError } from '@sendgrid/mail';

// Initialize SendGrid - use same pattern as receiptService
if (!process.env.SENDGRID_API_KEY) {
  console.warn('WARNING: SENDGRID_API_KEY is not set. Email functionality will be disabled.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData) {
  // Save to database
  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    },
  });

  // Send email
  const recipientEmail = process.env.CONTACT_FORM_EMAIL || 'info@gigglesfoundation.com';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FCD34D; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #FCD34D; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${data.name}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${data.email}</div>
          </div>
          <div class="field">
            <div class="label">Phone:</div>
            <div class="value">${data.phone}</div>
          </div>
          <div class="field">
            <div class="label">Message:</div>
            <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="field">
            <div class="label">Submitted At:</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Message: ${data.message}

Submitted At: ${new Date().toLocaleString()}
  `;

  // Only attempt to send email if SendGrid is configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@gigglesfoundation.com';
      
      // Validate that from email is set
      if (!fromEmail) {
        console.error('SENDGRID_FROM_EMAIL is not set. Cannot send email.');
      } else {
        await sgMail.send({
          to: recipientEmail,
          from: fromEmail,
          subject: `New Contact Form Submission from ${data.name}`,
          text: emailText,
          html: emailHtml,
        });
        console.log(`Contact form email sent successfully to ${recipientEmail}`);
      }
    } catch (error) {
      console.error('Error sending contact form email:', error);
      if (error instanceof ResponseError) {
        console.error('SendGrid API Error Details:', {
          status: error.code,
          body: error.response?.body,
        });
        if (error.code === 401) {
          console.error('SendGrid Authentication Failed. Please check:');
          console.error('1. SENDGRID_API_KEY is correct and valid');
          console.error('2. API key has Mail Send permissions');
          console.error('3. API key is not expired or revoked');
        } else if (error.code === 403) {
          console.error('SendGrid Forbidden. Please check:');
          console.error('1. SENDGRID_FROM_EMAIL is verified in SendGrid');
          console.error('2. Sender email has proper permissions');
        }
      }
    }
  } else {
    console.warn('SENDGRID_API_KEY not configured. Skipping email send.');
  }

  return contact;
}
