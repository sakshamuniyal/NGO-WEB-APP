import { Prisma, PaymentMode, PaymentStatus } from '@prisma/client';
import { StandardCheckoutPayRequest, CallbackType } from 'pg-sdk-node';
import {
  phonePeClient,
  FRONTEND_URL,
  PHONEPE_WEBHOOK_USERNAME,
  PHONEPE_WEBHOOK_PASSWORD,
} from '../../config/phonepe';
import prisma from '../../prisma';
import {
  InitiateDonationRequest,
  CheckDonationStatusResponse,
  UserDonation
} from '../../types/user/donation';

function phonePeSdkErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}
import { generatePdfAndEmail } from '../admin/receiptService'; // New Import
import { getPrivateFileUrl } from '../admin/uploadService';

type DonationWithUserCaseReceipt =
  | Prisma.DonationGetPayload<{ include: { user: true; case: true; receipt: true } }>
  | Prisma.DonationGetPayload<{
      include: {
        user: true;
        case: { select: { id: true; patientName: true; typeOfCase: true } };
        receipt: true;
      };
    }>;

const convertPrismaDonationToUserDonation = (
  prismaDonation: DonationWithUserCaseReceipt
): UserDonation => {
  return {
    id: prismaDonation.id,
    userId: prismaDonation.userId || null,
    caseId: prismaDonation.caseId || null,
    amount: prismaDonation.amount.toNumber(),
    currency: prismaDonation.currency,
    paymentMode: prismaDonation.paymentMode,
    transactionId: prismaDonation.transactionId,
    isAnonymous: prismaDonation.isAnonymous,
    timeOfPayment: prismaDonation.timeOfPayment.toISOString(),
    paymentStatus: prismaDonation.paymentStatus,
    gatewayTransactionId: prismaDonation.gatewayTransactionId || null,
    donorName: prismaDonation.donorName || null,
    donorEmail: prismaDonation.donorEmail || null,
    donorPhoneNumber: prismaDonation.donorPhoneNumber || null,
    user: prismaDonation.user
      ? {
          id: prismaDonation.user.id,
          firstName: prismaDonation.user.firstName,
          lastName: prismaDonation.user.lastName,
          email: prismaDonation.user.email,
          phoneNumber: prismaDonation.user.phoneNumber,
        }
      : null,
    case: prismaDonation.case
      ? {
          id: prismaDonation.case.id,
          patientName: prismaDonation.case.patientName,
          typeOfCase: prismaDonation.case.typeOfCase,
        }
      : null,
    receipt: prismaDonation.receipt
      ? {
          id: prismaDonation.receipt.id,
          donationId: prismaDonation.receipt.donationId,
          fileUrl: prismaDonation.receipt.fileUrl,
          receiptNo: prismaDonation.receipt.receiptNo ?? null,
          createdAt:
            prismaDonation.receipt.createdAt instanceof Date
              ? prismaDonation.receipt.createdAt.toISOString()
              : String(prismaDonation.receipt.createdAt),
        }
      : null,
  };
};

// --- CORE LOGIC: Apply updates and trigger Receipt ---
const applyDonationPaymentUpdate = async (input: {
  merchantTransactionId: string;
  paymentState?: string;
  transactionId?: string;
  paymentMode?: string;
  paymentTimestamp?: number;
}) => {
  const existingDonation = await prisma.donation.findUnique({
    where: { transactionId: input.merchantTransactionId },
  });

  if (!existingDonation) {
    throw new Error(`Donation ${input.merchantTransactionId} not found.`);
  }

  const newPaymentStatus = derivePaymentStatus(input.paymentState);
  const receivedPaymentMode = derivePaymentMode(input.paymentMode);
  const nextPaymentTime = input.paymentTimestamp ? new Date(input.paymentTimestamp) : new Date();

  const updatedDonationRecord = await prisma.donation.update({
    where: { transactionId: input.merchantTransactionId },
    data: {
      gatewayTransactionId: input.transactionId || existingDonation.gatewayTransactionId || null,
      paymentMode: receivedPaymentMode,
      paymentStatus: newPaymentStatus,
      timeOfPayment: nextPaymentTime,
    },
    include: { user: true, case: true, receipt: true },
  });

  // --- AUTOMATIC RECEIPT LOGIC ---
  // If status just changed to SUCCESS, trigger the PDF/Email engine
  if (newPaymentStatus === 'SUCCESS' && existingDonation.paymentStatus !== 'SUCCESS') {
    
    // 1. Update Case raisedAmount
    if (updatedDonationRecord.caseId) {
      await prisma.case.update({
        where: { id: updatedDonationRecord.caseId },
        data: { raisedAmount: { increment: updatedDonationRecord.amount.toNumber() } },
      });
    }

    // 2. Generate and Send Receipt in background
    generatePdfAndEmail(updatedDonationRecord.id).catch(err => 
      console.error(`[Receipt Generation Error for ${updatedDonationRecord.id}]:`, err)
    );
  }

  return updatedDonationRecord;
};

// --- Rest of service functions (unchanged logic, calling applyDonationPaymentUpdate) ---

export const initiatePhonePePayment = async (payload: InitiateDonationRequest, loggedInUserId: string | undefined) => {
  const { amount, isAnonymous, caseId, donorDetails } = payload;
  const merchantTransactionId = `TID_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  let finalDonorName = "Valued Donor";
  let finalDonorEmail = donorDetails?.email;
  let finalDonorPhone = donorDetails?.phoneNumber;
  // 1. If logged in, fetch the real name from the Database
  if (loggedInUserId) {
    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId }
    });
    
    if (user) {
      // Prioritize DB name for logged-in users
      finalDonorName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || "Valued Donor";
      finalDonorEmail = user.email || finalDonorEmail;
      finalDonorPhone = user.phoneNumber || finalDonorPhone;
    }
  } 
  // 2. If not logged in (Guest), use the form details
  else if (donorDetails) {
    const guestName = [donorDetails.firstName, donorDetails.lastName].filter(Boolean).join(' ').trim();
    if (guestName) finalDonorName = guestName;
  }

  const newDonation = await prisma.donation.create({
    data: {
      amount: new Prisma.Decimal(amount),
      currency: 'INR',
      paymentMode: 'OTHER',
      transactionId: merchantTransactionId,
      isAnonymous,
      userId: loggedInUserId || null,
      caseId: caseId || null,
      donorName: finalDonorName,
      donorEmail: finalDonorEmail,
      donorPhoneNumber: finalDonorPhone
    },
  });

  const phonePeRequest = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantTransactionId)
    .amount(amount * 100)
    .redirectUrl(`${FRONTEND_URL}/donation-processing?merchantTransactionId=${merchantTransactionId}`)
    .build();

  try {
    const phonePeResponse = await phonePeClient.pay(phonePeRequest);
    return { paymentLink: phonePeResponse.redirectUrl!, newDonationId: newDonation.id };
  } catch (err: unknown) {
    await prisma.donation.update({
      where: { id: newDonation.id },
      data: { paymentStatus: 'FAILED' },
    });

    const code = phonePeSdkErrorCode(err);
    if (code === 'OIM007') {
      console.error(
        '[PhonePe] OIM007 Client Not Found — use Standard Checkout client_id and client_secret from PhonePe PG onboarding (not legacy Merchant ID / Salt Key unless they are the issued OAuth pair). See backend/src/config/phonepe.ts.'
      );
      throw new Error(
        'Payment gateway configuration error: PhonePe does not recognize this client for production. Confirm Standard Checkout credentials in your deployment environment.'
      );
    }

    throw err;
  }
};

export const processPhonePeWebhook = async (authorizationHeader: string, rawBody: string) => {
  const callbackResponse = phonePeClient.validateCallback(PHONEPE_WEBHOOK_USERNAME!, PHONEPE_WEBHOOK_PASSWORD!, authorizationHeader, rawBody);
  
  // Validate webhook payload structure and presence of required fields
  const payload = callbackResponse.payload;
  if (!payload?.merchantOrderId) {
    throw new Error('Invalid webhook: missing merchantOrderId');
  }
  if (!payload?.state) {
    throw new Error('Invalid webhook: missing payment state');
  }
  if (!payload?.paymentDetails?.length) {
    throw new Error('Invalid webhook: missing paymentDetails');
  }
  const latestPayment = payload.paymentDetails[0];
  
  // Validate payment details structure
  if (!latestPayment?.transactionId) {
    throw new Error('Invalid payment details: missing transactionId');
  }
  if (!latestPayment?.paymentMode) {
    throw new Error('Invalid payment details: missing paymentMode');
  }
  if (!latestPayment?.timestamp) {
    throw new Error('Invalid payment details: missing timestamp');
  }

  // Validate timestamp freshness (optional)
  const now = Date.now();
  if (Math.abs(now - latestPayment.timestamp) > 5 * 60 * 1000) { // 5 minutes
    throw new Error('Webhook timestamp is too old');
  }

  await applyDonationPaymentUpdate({
    merchantTransactionId: payload.merchantOrderId,
    paymentState: payload.state,
    transactionId: latestPayment.transactionId,
    paymentMode: latestPayment.paymentMode,
    paymentTimestamp: latestPayment.timestamp,
  });
};

export const checkDonationStatus = async (merchantTransactionId: string): Promise<CheckDonationStatusResponse> => {
  let latestDonation = await prisma.donation.findUnique({
    where: { transactionId: merchantTransactionId },
    include: { user: true, case: true, receipt: true }
  });

  if (!latestDonation) throw new Error("Donation not found.");

  if (latestDonation.paymentStatus === 'PENDING') {
    const statusResponse = await phonePeClient.getOrderStatus(merchantTransactionId);
    const latestPayment = statusResponse.paymentDetails?.[0];

    latestDonation = await applyDonationPaymentUpdate({
      merchantTransactionId,
      paymentState: statusResponse.state,
      transactionId: latestPayment?.transactionId,
      paymentMode: latestPayment?.paymentMode,
      paymentTimestamp: latestPayment?.timestamp,
    });
  }

  return {
    message: successMessageByStatus(latestDonation.paymentStatus),
    status: latestDonation.paymentStatus,
    transactionId: merchantTransactionId,
    receiptUrl: latestDonation.receipt?.fileUrl,
    donationDetails: latestDonation.paymentStatus === 'SUCCESS' ? convertPrismaDonationToUserDonation(latestDonation) : undefined,
  };
};

// --- Enums and Derivations ---
const derivePaymentMode = (type?: string): PaymentMode => {
  if (type?.startsWith('UPI')) return 'UPI';
  if (type === 'CARD') return 'CARD';
  if (type === 'NET_BANKING') return 'NETBANKING';
  return 'OTHER';
};

const derivePaymentStatus = (state?: string): PaymentStatus => {
  if (state === 'COMPLETED') return 'SUCCESS';
  if (state === 'PENDING') return 'PENDING';
  return 'FAILED';
};

const successMessageByStatus = (status: PaymentStatus) => 
  status === 'SUCCESS' ? 'Payment successful.' : status === 'PENDING' ? 'Payment pending.' : 'Payment failed.';

export async function getUserDonationsPaginated(
  userId: string,
  options: { page?: number; limit?: number; paymentStatus?: PaymentStatus }
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  const skip = (page - 1) * limit;

  const where: { userId: string; paymentStatus?: PaymentStatus } = { userId };
  if (options.paymentStatus) where.paymentStatus = options.paymentStatus;

  const [total, rows] = await prisma.$transaction([
    prisma.donation.count({ where }),
    prisma.donation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timeOfPayment: 'desc' },
      include: {
        user: true,
        case: { select: { id: true, patientName: true, typeOfCase: true } },
        receipt: true,
      },
    }),
  ]);

  return {
    donations: rows.map(convertPrismaDonationToUserDonation),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getUserDonationsImpact(userId: string) {
  const successful = await prisma.donation.findMany({
    where: { userId, paymentStatus: 'SUCCESS' },
    include: {
      case: { select: { id: true, patientName: true, typeOfCase: true } },
    },
    orderBy: { timeOfPayment: 'desc' },
  });

  let totalAmount = 0;
  const thisYear = new Date().getFullYear();
  let thisYearAmount = 0;
  const uniqueCaseNames = new Set<string>();
  const monthlyBreakdownMap = new Map<string, number>();

  for (const d of successful) {
    const amt = d.amount.toNumber();
    totalAmount += amt;
    if (new Date(d.timeOfPayment).getFullYear() === thisYear) {
      thisYearAmount += amt;
    }
    if (d.case?.patientName) uniqueCaseNames.add(d.case.patientName);
    const date = d.timeOfPayment;
    const key = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
    monthlyBreakdownMap.set(key, (monthlyBreakdownMap.get(key) || 0) + amt);
  }

  const monthlyBreakdown = Array.from(monthlyBreakdownMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
    .slice(0, 6);

  const recentImpact = successful.slice(0, 5).map((d) => ({
    id: d.id,
    amount: d.amount.toNumber(),
    currency: d.currency,
    paymentMode: d.paymentMode,
    timeOfPayment: d.timeOfPayment.toISOString(),
    case: d.case
      ? { id: d.case.id, patientName: d.case.patientName, typeOfCase: d.case.typeOfCase }
      : null,
  }));

  return {
    totals: {
      totalAmount,
      successfulCount: successful.length,
      uniqueCasesSupported: uniqueCaseNames.size,
      thisYearAmount,
    },
    monthlyBreakdown,
    recentImpact,
  };
}

export async function getReceiptSignedDownloadUrl(userId: string, donationId: string) {
  const donation = await prisma.donation.findFirst({
    where: { id: donationId, userId },
    include: { receipt: true },
  });

  if (!donation || donation.paymentStatus !== 'SUCCESS') {
    return null;
  }
  if (!donation.receipt?.fileUrl) {
    return null;
  }

  return getPrivateFileUrl(donation.receipt.fileUrl, 3600);
}