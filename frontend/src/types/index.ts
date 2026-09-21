// Client Types
export type ClientType =
  | 'SME'
  | 'School'
  | 'Healthcare'
  | 'Enterprise';

export type ClientStatus =
  | 'Active'
  | 'Lead'
  | 'Prospect';

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  type: ClientType;
  status: ClientStatus;
  lastContact: string;
  createdAt: string;
}

// Lead Pipeline Types
export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost';

export type LeadTemperature =
  | 'Hot'
  | 'Warm'
  | 'Cold';

export type LeadSource = 'Referral' | 'Social' | 'Direct' | 'Other';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  value: number;
  stage: LeadStage;
  temperature: LeadTemperature;
  source: LeadSource;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Paid'
  | 'Overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

// Receipt Type
export interface Receipt {
  id: string;
  invoiceId: string;
  receiptNumber: string;
  clientName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  generatedAt: string;
}

// Team Types
export type TeamMemberRole =
  | 'Designer'
  | 'Developer'
  | 'Intern'
  | 'Manager';

export type TaskStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamMemberRole;
  email: string;
  avatar?: string;
  tasks: Task[];
  status:
    | 'Active'
    | 'Away'
    | 'Offline';
}

// Message Board Types
export interface Message {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  timestamp: string;
  isPinned: boolean;
}

// Settings Types
export interface BusinessSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  tin: string;
  logo?: string;
}

export interface InvoiceSettings {
  currency: string;
  taxRate: number;
  taxLabel: string;
  paymentTerms: number;
  paymentMethods: string[];
  invoicePrefix: string;
  nextInvoiceNumber: number;
  receiptPrefix: string;
  nextReceiptNumber: number;
  footer: string;
}

export interface ListSettings {
  clientTypes: ClientType[];
  leadStages: LeadStage[];
  leadTemperatures: LeadTemperature[];
}

export type CRMRole =
  | 'Owner'
  | 'Admin'
  | 'Manager'
  | 'Staff'
  | 'Accountant';

export type CRMUserStatus =
  | 'Active'
  | 'Invited'
  | 'Inactive';

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: CRMRole;
  status: CRMUserStatus;
}

export interface UserSettings {
  currentUserId: string;
  users: CRMUser[];
}

export interface AccountSettings {
  name: string;
  email: string;
}

export interface DataSettings {
  lastBackupAt?: string;
}

export interface Settings {
  business: BusinessSettings;
  invoices: InvoiceSettings;
  lists: ListSettings;
  users: UserSettings;
  account: AccountSettings;
  data: DataSettings;
}

// App State
export type View =
  | 'dashboard'
  | 'clients'
  | 'leads'
  | 'invoices'
  | 'receipts'
  | 'team'
  | 'board'
  | 'profile'
  | 'settings';


export interface AppState {
  currentView: View;
  clients: Client[];
  leads: Lead[];
  invoices: Invoice[];
  receipts: Receipt[];
  team: TeamMember[];
  messages: Message[];
  settings: Settings;
}

// Action Types
export type Action =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'UPDATE_LEAD'; payload: Lead }
  | { type: 'DELETE_LEAD'; payload: string }
  | { type: 'MOVE_LEAD'; payload: { id: string; stage: LeadStage } }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'ADD_RECEIPT'; payload: Receipt }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'DELETE_TEAM_MEMBER'; payload: string }
  | { type: 'ADD_TASK'; payload: { memberId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { memberId: string; task: Task } }
  | { type: 'DELETE_TASK'; payload: { memberId: string; taskId: string } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'PIN_MESSAGE'; payload: string }
  | { type: 'UNPIN_MESSAGE'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> };
