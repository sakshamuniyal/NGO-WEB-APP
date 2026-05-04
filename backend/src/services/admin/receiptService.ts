import prisma from '../../prisma';
import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import sgMail from '@sendgrid/mail';
import { toWords } from 'number-to-words';
import { PaymentMode, type Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import fs from 'fs';
import path from 'path';
import { uploadPrivateFileToS3 } from './uploadService';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// --- Helper: Text Wrapper ---
const drawWrappedText = (params: {
  page: PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  font: PDFFont;
  color?: ReturnType<typeof rgb>;
  lineHeight?: number;
}) => {
  const { page, text, x, y, maxWidth, size, font, color = rgb(0.15, 0.15, 0.15), lineHeight = size + 4 } = params;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const next = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      currentLine = next;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color });
    cursorY -= lineHeight;
  }
  return cursorY;
};

// --- Amount in Words (Clean & Reusable) ---
const getAmountInWords = (amount: number): string => {
  if (isNaN(amount) || amount <= 0) return 'Zero Rupees Only';

  let words = toWords(amount)
    .trim()
    .replace(/,/g, '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${words} Rupees Only`;
};

// --- NEW CORE ENGINE: Generates PDF and Sends Email from an existing Donation ID ---
export async function generatePdfAndEmail(donationId: string) {
  // 1. Fetch donation with user and address info
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: { user: { include: { address: true } } },
  });

  if (!donation) throw new Error('Donation record not found.');

  // --- FIX STARTS HERE ---
  
  // 1. Resolve Name: Prioritize donation.donorName, fallback to User fields
  let donorName = "Valued Donor";
  if (donation.donorName && donation.donorName.trim() !== "" && !donation.donorName.includes("undefined")) {
    donorName = donation.donorName;
  } else if (donation.user) {
    donorName = `${donation.user.firstName || ''} ${donation.user.lastName || ''}`.trim() || "Valued Donor";
  }

  // 2. Resolve Email: Prioritize donation.donorEmail
  const donorEmail = donation.donorEmail || donation.user?.email || "N/A";

  // 3. Resolve Phone
  const donorPhone = donation.donorPhoneNumber || donation.user?.phoneNumber || "";

  // 2. Prepare Data
  const receiptNo = `R-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = donation.timeOfPayment || new Date();

  // Safely convert Decimal → number
const amountNum = donation.amount.toNumber ? donation.amount.toNumber() : Number(donation.amount);

 // 4. Generate PDF
 const pdfDoc = await PDFDocument.create();
 // ... (Keep all your existing PDF drawing logic here: Logo, Header, Table, etc.)
 // Ensure you use the 'receiptNo' variable generated above in the PDF text drawing section

  // PDF Generation Logic

  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = page.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const brandColor = rgb(0.14, 0.35, 0.58);
  const textColor = rgb(0.15, 0.15, 0.15);
  const subtleColor = rgb(0.45, 0.45, 0.45);

  const readableDate = createdAt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // --- Start Drawing (Same as your original design) ---
  let y = 800;
  const headerBottom = 744;

  page.drawLine({
    start: { x: margin, y: headerBottom },
    end: { x: pageWidth - margin, y: headerBottom },
    thickness: 1,
    color: rgb(0.86, 0.86, 0.86),
  });

  const logoPath = path.join(__dirname, 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const scale = Math.min(110 / logoImage.width, 52 / logoImage.height);
    page.drawImage(logoImage, {
      x: margin + 14,
      y: headerBottom + (820 - headerBottom - logoImage.height * scale) / 2,
      width: logoImage.width * scale,
      height: logoImage.height * scale,
    });
  }

  // Org Info
  const orgLines = ['1516, 3rd Floor, Wazir Nagar', 'Kotla Mubarakpur, New Delhi - 110003', 'info@gigglesfoundation.com', 'PAN: AALCG0958M'];
  let orgY = 796;
  for (const line of orgLines) {
    const lineWidth = font.widthOfTextAtSize(line, 10);
    page.drawText(line, { x: pageWidth - margin - 14 - lineWidth, y: orgY, size: 10, font, color: subtleColor });
    orgY -= 14;
  }

  // Title
  const centeredTitle = 'Donation Receipt';
  const titleWidth = boldFont.widthOfTextAtSize(centeredTitle, 16);
  page.drawText(centeredTitle, { x: (pageWidth - titleWidth) / 2, y: 715, size: 16, font: boldFont, color: brandColor });

  y = 695;
  // Receipt card
  page.drawRectangle({ x: margin, y: y - 62, width: contentWidth, height: 62, color: rgb(0.98, 0.99, 1), borderColor: rgb(0.86, 0.9, 0.96), borderWidth: 1 });
  page.drawText('Receipt No.', { x: margin + 16, y: y - 22, size: 10, font, color: subtleColor });
  page.drawText(receiptNo, { x: margin + 16, y: y - 40, size: 13, font: boldFont, color: textColor });
  page.drawText('Date & Time', { x: margin + 300, y: y - 22, size: 10, font, color: subtleColor });
  page.drawText(readableDate, { x: margin + 300, y: y - 40, size: 13, font: boldFont, color: textColor });

  y -= 105;
  // Donor Details
  page.drawText('Donor Details', { x: margin, y, size: 13, font: boldFont, color: brandColor });
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + contentWidth, y }, thickness: 1, color: rgb(0.86, 0.86, 0.86) });
  y -= 18;

  page.drawText(`Name: ${donorName}`, { x: margin, y, size: 11, font, color: textColor });
  y -= 16;
  page.drawText(`Email: ${donorEmail}`, { x: margin, y, size: 11, font, color: textColor });
  y -= 16;

  if (donation.user?.panCard) {
  page.drawText(`PAN: ${donation.user?.panCard}`, { x: margin, y, size: 11, font, color: textColor });
  y -= 16;
  }

  if (donorPhone) {
    page.drawText(`Phone: ${donorPhone}`, { x: margin, y, size: 11, font, color: textColor });
    y -= 16;
  }
  
  // Get address from Donation's user relation
  const address = donation.user?.address;
  if (address) {
    const addressLine = `Address: ${address.line1}${address.line2 ? `, ${address.line2}` : ''}, ${address.state}, ${address.country} - ${address.zipCode}`;
    y = drawWrappedText({ page, text: addressLine, x: margin, y, maxWidth: contentWidth, size: 11, font, color: textColor });
  }
  y -= 25;

  // Appreciation & Table (Skipping verbatim re-list for brevity, keep your existing logic here)
  // Appreciation note

  page.drawText(`Dear ${donorName},`, { x: margin, y, size: 12, font: boldFont, color: textColor });

  y -= 20;

  y = drawWrappedText({

    page,

    text: 'Thank you for your generous donation to Giggles Foundation. Your contribution enables us to support children and families with care, dignity, and hope.',

    x: margin,

    y,

    maxWidth: contentWidth,

    size: 11,

    font,

    color: textColor,

    lineHeight: 15,

  });

  y -= 22;
  
  // ... [Keep Donation Summary Table & Footer logic here] ...
  page.drawText('Donation Summary', { x: margin, y, size: 13, font: boldFont, color: brandColor });

  y -= 20;



  const tableX = margin;

  const tableYTop = y;

  const tableWidth = contentWidth;

  const rowHeight = 28;

  const rows = [

    ['Transaction ID', donation.transactionId],

    ['Mode of Payment', donation.paymentMode],

    ['Donation Amount', `INR ${Number(donation.amount).toLocaleString('en-IN')}`],

    ['Amount in Words', getAmountInWords(amountNum)],
  ];

  const tableHeight = rowHeight * rows.length;

  const labelColWidth = 180;



  page.drawRectangle({

    x: tableX,

    y: tableYTop - tableHeight,

    width: tableWidth,

    height: tableHeight,

    borderColor: rgb(0.8, 0.8, 0.8),

    borderWidth: 1,

    color: rgb(0.995, 0.995, 0.995),

  });



  for (let i = 0; i < rows.length; i++) {

    const rowTopY = tableYTop - i * rowHeight;

    if (i > 0) {

      page.drawLine({

        start: { x: tableX, y: rowTopY },

        end: { x: tableX + tableWidth, y: rowTopY },

        thickness: 1,

        color: rgb(0.9, 0.9, 0.9),

      });

    }



    page.drawLine({

      start: { x: tableX + labelColWidth, y: rowTopY },

      end: { x: tableX + labelColWidth, y: rowTopY - rowHeight },

      thickness: 1,

      color: rgb(0.9, 0.9, 0.9),

    });



    page.drawText(rows[i][0], {

      x: tableX + 12,

      y: rowTopY - 19,

      size: 10.5,

      font: boldFont,

      color: textColor,

    });



    drawWrappedText({

      page,

      text: rows[i][1],

      x: tableX + labelColWidth + 12,

      y: rowTopY - 19,

      maxWidth: tableWidth - labelColWidth - 20,

      size: 10.5,

      font,

      color: textColor,

      lineHeight: 12,

    });

  }



  // Footer

  page.drawLine({

    start: { x: margin, y: 68 },

    end: { x: pageWidth - margin, y: 68 },

    thickness: 1,

    color: rgb(0.86, 0.86, 0.86),

  });

  page.drawText('This is a system-generated receipt. No signature is required.', {

    x: margin,

    y: 52,

    size: 9,

    font,

    color: subtleColor,

  });

  drawWrappedText({

    page,

    text: '80G Note: Donations to Giggles Foundation may be eligible for tax deduction under Section 80G of the Income Tax Act, 1961, subject to applicable rules, valid PAN details, and prevailing law.',

    x: margin,

    y: 39,

    maxWidth: contentWidth,

    size: 8.2,

    font,

    color: subtleColor,

    lineHeight: 10,

  });

  page.drawText('Giggles Foundation • info@gigglesfoundation.com • www.gigglesfoundation.com', {

    x: margin,

    y: 18,

    size: 9,

    font,

    color: subtleColor,

  });

  // Finalize PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  
  // 5. Upload to S3
  // We use the private bucket as receipts contain sensitive donor info
  const s3Url = await uploadPrivateFileToS3(
    pdfBuffer,
    'application/pdf',
    `receipt-${receiptNo}.pdf`,
    'donation-receipts'
  );

  // 6. Create Receipt Record in DB (Linked with S3 URL and ReceiptNo)
  const receipt = await prisma.receipt.create({
    data: {
      donationId: donation.id,
      receiptNo: receiptNo, // 👈 Stored in DB
      fileUrl: s3Url,       // 👈 AWS S3 URL stored in DB
      createdAt: createdAt,
    },
  });

  //7. Send Email
  let emailStatus: 'sent' | 'failed' = 'sent';

  if (!donation.donorEmail) {
    console.error(`[receiptService] Skipping email: No email address found for donation ${donationId}`);
    return { receipt, receiptNo, fileUrl: s3Url, emailStatus: 'failed' };
  }
  
  try {
    await sgMail.send({
      to: donation.donorEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Your Donation Receipt - Giggles Foundation',
      text: 'Thank you for your donation. Please find your receipt attached.',
      attachments: [{
        content: Buffer.from(pdfBytes).toString('base64'),
        filename: `Receipt_${receiptNo}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      }],
    });
  } catch (error) {
    emailStatus = 'failed';
    console.error('Email failed:', error);
  }

  return { receipt, receiptNo, fileUrl: s3Url, emailStatus };
}

export interface ManualReceiptInput {
  firstName: string;
  lastName?: string;
  title: string;
  address?: Prisma.AddressCreateWithoutUserInput;
  phoneNumber?: string;
  pan?: string;
  modeOfPayment: string;
  amount: number | string;
  createdAt: string | Date;
  email: string;
}

export async function generateAndSendReceipt(data: ManualReceiptInput) {
  const { firstName, lastName, title, address, phoneNumber, pan, modeOfPayment, amount, createdAt, email } = data;

  // 1. User Logic (Find or Create)
// We check for BOTH phone and email to prevent unique constraint collisions
let user: Awaited<ReturnType<typeof prisma.user.findFirst<{ include: { address: true } }>>> = await prisma.user.findFirst({
  where: {
    OR: [
      { phoneNumber: phoneNumber || undefined },
      { email: email }
    ]
  },
  include: { address: true }
});

if (!user) {
  const phone = phoneNumber?.trim();
  if (!phone) {
    throw new Error('phoneNumber is required to create a donor profile for this receipt.');
  }
  user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      phoneNumber: phone,
      panCard: pan,
      email,
      address: address ? { create: address } : undefined,
    },
    include: { address: true },
  });
} else {
  // Scenario: User exists with either this phone or this email
  // Update missing fields ONLY (don't overwrite existing data)
  const updateData: Prisma.UserUpdateInput = {};
  if (!user.firstName && firstName) updateData.firstName = firstName;
  if (!user.lastName && lastName) updateData.lastName = lastName;
  if (!user.panCard && pan) updateData.panCard = pan;
  // If we found them by Phone but Email was different/missing, update it
  if (!user.email && email) updateData.email = email; 
  // If we found them by Email but Phone was missing, update it
  if (!user.phoneNumber && phoneNumber) updateData.phoneNumber = phoneNumber;

  if (!user.address && address) {
    updateData.address = { create: address };
  }

  if (Object.keys(updateData).length > 0) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { address: true }
    });
  }
}

  // 2. Create Donation Record
  const donation = await prisma.donation.create({
    data: {
      userId: user?.id,
      amount: new Decimal(amount),
      currency: 'INR',
      paymentMode: modeOfPayment as PaymentMode,
      transactionId: `TID_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timeOfPayment: new Date(createdAt),
      paymentStatus: 'SUCCESS',
      donorName: `${title} ${firstName} ${lastName || ''}`.trim(),
      donorEmail: email,
      donorPhoneNumber: phoneNumber,
    },
  });

  // 3. Trigger the Core Engine
  const result = await generatePdfAndEmail(donation.id);
  return { user, donation, ...result };
}