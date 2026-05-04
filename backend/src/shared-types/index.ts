// shared-types/index.ts

// --- Address ---
export interface Address {
  id: string;
  userId: string;
  country: string;
  state: string;
  line1: string;
  line2: string | null;
  zipCode: string;
}

// --- User ---
export interface User {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  panCard: string | null;
  createdAt: string;
  updatedAt: string;
  address: Address | null;
  isProfileComplete?: boolean; // Only present if needed (frontend)
}

// --- Permission ---
export interface Permission {
  id: string;
  name: string;
  description?: string;
}

// --- Role ---
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

// --- Admin ---
export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
  avatar?: string | null; // Only for frontend UI compatibility
}

// --- Enums ---
export type CaseType = 'HEALTH' | 'EDUCATION' | 'OTHER';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'NETBANKING' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

// --- Case ---
export interface Case {
  id: string;
  patientName: string;
  age: number;
  nationality: string;
  typeOfCase: CaseType;
  title: string;
  description: string;
  pdfUrls?: string[] | null;
  imageUrls?: string[] | null;
  videoUrls?: string[] | null;
  phoneNumber?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  targetAmount: number;
  raisedAmount: number;
  isActive: boolean;
  createdBy?: Admin | null;
  createdAt: string;
  updatedAt: string;
  donations: Donation[];
}

// --- Donation ---
export interface Donation {
  id: string;
  userId?: string | null;
  caseId?: string | null;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  transactionId: string;
  isAnonymous: boolean;
  timeOfPayment: string;
  paymentStatus: PaymentStatus;
  gatewayTransactionId?: string | null;
  user?: User | null;
  case?: Case | null;
  receipt?: {
    id: string;
    fileUrl: string;
    receiptNo: string | null;
    createdAt: string;
    donationId: string;
  } | null;
  donorName?: string | null;
  donorEmail?: string | null;
  donorPhoneNumber?: string | null;
}

// --- Donation Request/Response Types (for API) ---
export interface DonorDetailsInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: {
    line1: string;
    line2?: string;
    country: string;
    state: string;
    zipCode: string;
  };
}

export interface InitiateDonationRequest {
  amount: number;
  isAnonymous: boolean;
  caseId?: string | null;
  donorDetails?: DonorDetailsInput;
}

export interface InitiateDonationResponse {
  message: string;
  paymentLink?: string;
}

export interface UserDonation {
  id: string;
  userId: string | null;
  caseId: string | null;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  transactionId: string;
  isAnonymous: boolean;
  timeOfPayment: string;
  paymentStatus: PaymentStatus;
  gatewayTransactionId: string | null;
  donorName: string | null;
  donorEmail: string | null;
  donorPhoneNumber: string | null;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phoneNumber: string;
  } | null;
  case?: {
    id: string;
    patientName: string;
    typeOfCase: CaseType;
  } | null;
  receipt?: {
    id: string;
    fileUrl: string;
    receiptNo: string | null;
    createdAt: string;
    donationId: string;
  } | null;
}

export interface CheckDonationStatusResponse {
  message: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId: string;
  receiptUrl?: string;
  donationDetails?: UserDonation;
}