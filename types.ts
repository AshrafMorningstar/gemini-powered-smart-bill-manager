
export interface BillItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type BillStatus = 'PAID' | 'UNPAID' | 'OVERDUE';

export interface Bill {
  id: string;
  invoiceNumber?: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: BillStatus;
  currency: string;
  items: BillItem[];
  totalAmount: number;
  notes?: string;
  imageUrl?: string;
  tags: string[];
  lastModified: string;
  isNew?: boolean; 
  isModified?: boolean;
}

export interface Customer {
  name: string;
  totalSpent: number;
  billCount: number;
  lastActive: string;
  tags: string[];
}

export interface SummaryStats {
  totalRevenue: number;
  billCount: number;
  averageBillValue: number;
}

export interface BotConfig {
  repoName: string;
  reviewStrictness: 'lenient' | 'balanced' | 'strict';
  focusAreas: string[];
  systemPromptOverride?: string;
}

export interface CodeReviewResult {
  summary: string;
  score: number;
  bugs: { file: string; line: number; message: string; severity: 'high' | 'medium' | 'low' }[];
  security: { issue: string; suggestion: string }[];
  performance: string[];
}

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: 'Rs ' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
];
