import axios from 'axios';

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


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

export const fetchClients = () =>
  API.get('/clients').then((res) => res.data);

export const createClient = (
  data: Record<string, unknown>
) =>
  API.post('/clients', data).then((res) => res.data);

export const updateClientApi = (
  id: number,
  data: Record<string, unknown>
) =>
  API.put(`/clients/${id}`, data).then((res) => res.data);

export const deleteClientApi = (
  id: number
) =>
  API.delete(`/clients/${id}`).then((res) => res.data);



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
) =>
  API.delete(`/invoices/${id}`).then((res) => res.data);



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



export default API;