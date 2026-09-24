import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


// ---------------------------------------------------------------------------
// Frontend types (minimal, to avoid circular imports with @/types).
// These must stay structurally compatible with @/types Client/Lead.
// ---------------------------------------------------------------------------

type ClientType = 'SME' | 'School' | 'Healthcare' | 'Enterprise';
type ClientStatus = 'Active' | 'Lead' | 'Prospect';

export interface ClientPayload {
  id?: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  type: ClientType;
  status: ClientStatus;
  lastContact?: string;
  createdAt?: string;
}

type LeadStage =
  | 'New' | 'Contacted' | 'Qualified'
  | 'Proposal Sent' | 'Won' | 'Lost';
type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
type LeadSource = 'Referral' | 'Social' | 'Direct' | 'Other';

export interface LeadPayload {
  id?: string;
  name: string;
  company: string;
  email: string;
  value: number;
  stage: LeadStage;
  temperature: LeadTemperature;
  source: LeadSource;
  expectedCloseDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}


// ---------------------------------------------------------------------------
// Adapters: backend JSON → frontend shape.
// ---------------------------------------------------------------------------

function toClient(raw: Record<string, unknown>): ClientPayload {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    company: raw.company ? String(raw.company) : undefined,
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    type: (raw.type as ClientType) ?? 'SME',
    status: (raw.status as ClientStatus) ?? 'Lead',
    lastContact: String(raw.lastContact ?? 'Today'),
    createdAt: String(raw.createdAt ?? ''),
  };
}

function toLead(raw: Record<string, unknown>): LeadPayload {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    company: String(raw.company ?? ''),
    email: String(raw.email ?? ''),
    value: Number(raw.value ?? 0),
    stage: (raw.stage as LeadStage) ?? 'New',
    temperature: (raw.temperature as LeadTemperature) ?? 'Warm',
    source: (raw.source as LeadSource) ?? 'Direct',
    expectedCloseDate: raw.expectedCloseDate
      ? String(raw.expectedCloseDate)
      : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}


// ---------------------------------------------------------------------------
// Existing interfaces — unchanged.
// ---------------------------------------------------------------------------

export interface BusinessProfile {
  id?: number;
  user_id?: number;
  company_name: string;
  address: string;
  tax_id: string;
  currency: string;
  timezone: string;
  logo_url?: string | null;
  logoUrl?: string;
}

export interface InvoiceSettingsResponse {
  id?: number;
  user_id?: number;
  prefix: string;
  next_number: number;
  tax_rate: number;
  tax_enabled: boolean;
}

export interface PaymentMethod {
  id: number;
  user_id?: number;
  method_type: string;
  details: string;
  is_active: boolean;
}

export interface ListSettingsResponse {
  id?: number;
  user_id?: number;
  client_types: string[];
  lead_stages: string[];
  lead_temperatures: string[];
}

export interface AccountSettingsResponse {
  id?: number;
  user_id?: number;
  display_name: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
  date_format: string;
}


// ---------------------------------------------------------------------------
// Business / invoice / list / account settings — unchanged.
// ---------------------------------------------------------------------------

export const getBusinessProfile = async (): Promise<BusinessProfile> => {
  const response = await API.get<BusinessProfile>(
    '/invoices/settings/business-profile'
  );
  return response.data;
};

export const updateBusinessProfile = async (
  profileData: Partial<BusinessProfile>
): Promise<BusinessProfile> => {
  const response = await API.put<BusinessProfile>(
    '/invoices/settings/business-profile',
    profileData
  );
  return response.data;
};

export const uploadBusinessLogo = async (
  formData: FormData
): Promise<{
  logo_url: string;
  logoUrl?: string;
  message: string;
}> => {
  const response = await API.post(
    '/invoices/settings/business-profile/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const getInvoiceSettings =
  async (): Promise<InvoiceSettingsResponse> => {
    const response = await API.get<InvoiceSettingsResponse>(
      '/invoices/settings'
    );
    return response.data;
  };

export const updateInvoiceSettings = async (
  settingsData: Partial<InvoiceSettingsResponse>
): Promise<InvoiceSettingsResponse> => {
  const response = await API.put<InvoiceSettingsResponse>(
    '/invoices/settings',
    settingsData
  );
  return response.data;
};

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await API.get<PaymentMethod[]>(
    '/invoices/settings/payment-methods'
  );
  return response.data;
};

export const addPaymentMethod = async (
  paymentData: {
    method_type: string;
    details?: string;
    is_active?: boolean;
  }
): Promise<PaymentMethod> => {
  const response = await API.post<PaymentMethod>(
    '/invoices/settings/payment-methods',
    paymentData
  );
  return response.data;
};

export const deletePaymentMethod = async (
  methodId: number
): Promise<{ message: string }> => {
  const response = await API.delete<{ message: string }>(
    `/invoices/settings/payment-methods/${methodId}`
  );
  return response.data;
};

export const getListSettings =
  async (): Promise<ListSettingsResponse> => {
    const response = await API.get<ListSettingsResponse>(
      '/settings/lists'
    );
    return response.data;
  };

export const updateListSettings = async (
  settingsData: Partial<ListSettingsResponse>
): Promise<ListSettingsResponse> => {
  const response = await API.put<ListSettingsResponse>(
    '/settings/lists',
    settingsData
  );
  return response.data;
};

export const getAccountSettings =
  async (): Promise<AccountSettingsResponse> => {
    const response = await API.get<AccountSettingsResponse>(
      '/settings/account'
    );
    return response.data;
  };

export const updateAccountSettings = async (
  settingsData: Partial<AccountSettingsResponse>
): Promise<AccountSettingsResponse> => {
  const response = await API.put<AccountSettingsResponse>(
    '/settings/account',
    settingsData
  );
  return response.data;
};


// ---------------------------------------------------------------------------
// Clients — talk to /api/clients (clients_bp).
// Paths here are RELATIVE to the axios baseURL, which already includes /api.
// ---------------------------------------------------------------------------

export const fetchClients = async (): Promise<ClientPayload[]> => {
  const response = await API.get<{ clients: Record<string, unknown>[] }>(
    '/clients/'
  );
  return (response.data.clients || []).map(toClient);
};

export const createClientApi = async (
  client: Omit<ClientPayload, 'id' | 'createdAt'>
): Promise<ClientPayload> => {
  const response = await API.post<Record<string, unknown>>(
    '/clients/',
    {
      name: client.name,
      company: client.company ?? '',
      email: client.email,
      phone: client.phone,
      type: client.type,
      status: client.status,
      lastContact: client.lastContact ?? 'Today',
    }
  );
  return toClient(response.data);
};

export const updateClientApi = async (
  id: string,
  client: Partial<ClientPayload>
): Promise<ClientPayload> => {
  const response = await API.patch<Record<string, unknown>>(
    `/clients/${id}`,
    {
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      type: client.type,
      status: client.status,
      lastContact: client.lastContact,
    }
  );
  return toClient(response.data);
};

export const deleteClientApi = async (
  id: string
): Promise<{ message: string }> => {
  const response = await API.delete<{ message: string }>(
    `/clients/${id}`
  );
  return response.data;
};

// Dead export kept for compatibility — nothing in useAppState imports it.
export const createClient = (
  data: Record<string, unknown>
) =>
  API.post('/clients', data).then((res) => res.data);


// ---------------------------------------------------------------------------
// Leads — talk to /api/leads (leads_bp).
// ---------------------------------------------------------------------------

export const fetchLeads = async (): Promise<LeadPayload[]> => {
  const response = await API.get<{ leads: Record<string, unknown>[] }>(
    '/leads'
  );
  return (response.data.leads || []).map(toLead);
};

export const createLeadApi = async (
  lead: Omit<LeadPayload, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LeadPayload> => {
  const response = await API.post<Record<string, unknown>>(
    '/leads',
    {
      name: lead.name,
      company: lead.company,
      email: lead.email,
      value: lead.value,
      stage: lead.stage,
      temperature: lead.temperature,
      source: lead.source,
      expectedCloseDate: lead.expectedCloseDate ?? '',
      notes: lead.notes ?? '',
    }
  );
  return toLead(response.data);
};

export const updateLeadApi = async (
  id: string,
  lead: Partial<LeadPayload>
): Promise<LeadPayload> => {
  const response = await API.patch<Record<string, unknown>>(
    `/leads/${id}`,
    {
      name: lead.name,
      company: lead.company,
      email: lead.email,
      value: lead.value,
      stage: lead.stage,
      temperature: lead.temperature,
      source: lead.source,
      expectedCloseDate: lead.expectedCloseDate,
      notes: lead.notes,
    }
  );
  return toLead(response.data);
};

export const deleteLeadApi = async (
  id: string
): Promise<{ message: string }> => {
  const response = await API.delete<{ message: string }>(
    `/leads/${id}`
  );
  return response.data;
};


// ---------------------------------------------------------------------------
// Invoices — unchanged from previous file.
// ---------------------------------------------------------------------------

export const fetchInvoices = () =>
  API.get('/invoices').then((res) => res.data);

export const createInvoice = (
  data: Record<string, unknown>
) =>
  API.post('/invoices', data).then((res) => res.data);

export const updateInvoiceApi = (
  id: number,
  data: Record<string, unknown>
) =>
  API.put(`/invoices/${id}`, data).then((res) => res.data);

export const deleteInvoiceApi = (
  id: number
) => API.delete(`/invoices/${id}`).then((res) => res.data);


// ---------------------------------------------------------------------------
// Team members / tasks — unchanged.
// ---------------------------------------------------------------------------

export const fetchTeamMembers = () =>
  API.get('/team').then((res) => res.data);

export const addTeamMemberApi = (
  memberData: Record<string, unknown>
) =>
  API.post('/team', memberData).then(
    (res) => res.data
  );

export const updateTeamMemberApi = (
  memberId: number,
  memberData: Record<string, unknown>
) =>
  API.put(
    `/team/${memberId}`,
    memberData
  ).then((res) => res.data);

export const deleteTeamMemberApi = (
  memberId: number
) =>
  API.delete(
    `/team/${memberId}`
  ).then((res) => res.data);

export const addTeamMemberTaskApi = (
  memberId: number,
  taskData: Record<string, unknown>
) =>
  API.post(
    `/team/${memberId}/tasks`,
    taskData
  ).then((res) => res.data);

export const updateTeamMemberTaskApi = (
  memberId: number,
  taskId: number,
  taskData: Record<string, unknown>
) =>
  API.put(
    `/team/${memberId}/tasks/${taskId}`,
    taskData
  ).then((res) => res.data);

export const deleteTeamMemberTaskApi = (
  memberId: number,
  taskId: number
) =>
  API.delete(
    `/team/${memberId}/tasks/${taskId}`
  ).then((res) => res.data);


// ---------------------------------------------------------------------------
// User avatar — talks to /auth/me/avatar (auth_bp, not under /api).
// Uses a full URL because this axios instance's baseURL ends in /api.
// ---------------------------------------------------------------------------

export const uploadAvatar = async (
  formData: FormData
): Promise<{ avatar: string; message: string }> => {
  const base = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000';
  const response = await axios.post<{ avatar: string; message: string }>(
    `${base}/auth/me/avatar`,
    formData,
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};


export default API;