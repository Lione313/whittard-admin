export type CurrencyType = 'PEN' | 'USD';

export interface BankAccount {
  id: number;
  brand?: string;
  bankName: string;
  accountNumber: string;
  cci?: string;
  accountType: string;
  holderName: string;
  holderDocumentType?: string;
  holderDocumentNumber?: string;
  currency: CurrencyType;
  logoUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccountPayload {
  brand?: string;
  bank_name: string;
  account_number: string;
  cci?: string;
  account_type: string;
  holder_name: string;
  holder_document_type?: string;
  holder_document_number?: string;
  currency: CurrencyType;
  logo_url?: string;
  is_active?: boolean;
  sort_order?: number;
}