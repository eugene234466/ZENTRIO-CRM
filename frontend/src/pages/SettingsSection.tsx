import { useEffect, useState } from 'react';
import {
  Building2,
  FileText,
  List,
  Users,
  UserCircle,
  Database,
  Save,
  CheckCircle2,
  Plus,
  X,
  Download,
  RotateCcw,
} from 'lucide-react';

import type {
  AppState,
  AccountSettings,
  BusinessSettings,
  ClientType,
  CRMRole,
  CRMUser,
  CRMUserStatus,
  InvoiceSettings,
  LeadStage,
  LeadTemperature,
  ListSettings,
} from '@/types';

import { resetToSampleData } from '@/store/storage';

import {
  getBusinessProfile,
  updateBusinessProfile,
  getInvoiceSettings,
  updateInvoiceSettings,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  getListSettings,
  updateListSettings,
  getAccountSettings,
  updateAccountSettings,
} from '@/api';

interface SettingsSectionProps {
  state: AppState;
  updateSettings: (
    settings: Partial<AppState['settings']>,
  ) => void;
}

type SettingsTab =
  | 'business'
  | 'invoices'
  | 'lists'
  | 'users'
  | 'account'
  | 'data';

const tabs: {
  id: SettingsTab;
  label: string;
  icon: typeof Building2;
}[] = [
  {
    id: 'business',
    label: 'Business',
    icon: Building2,
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: FileText,
  },
  {
    id: 'lists',
    label: 'Lists',
    icon: List,
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
  },
  {
    id: 'account',
    label: 'My Account',
    icon: UserCircle,
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
  },
];

const defaultClientTypes: ClientType[] = [
  'SME',
  'School',
  'Healthcare',
  'Enterprise',
];

const defaultLeadStages: LeadStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Won',
  'Lost',
];

const defaultTemperatures: LeadTemperature[] = [
  'Hot',
  'Warm',
  'Cold',
];

const roleDescriptions: Record<CRMRole, string> = {
  Owner: 'Full access to the entire CRM.',
  Admin: 'Manage CRM settings, users, and data.',
  Manager: 'Manage clients, leads, invoices, and team tasks.',
  Staff: 'Work with assigned CRM records and tasks.',
  Accountant: 'Manage invoices, receipts, and financial data.',
};

/* =========================================================
   HELPERS
   ========================================================= */

function SettingsInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 outline-none transition"
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      />
    </label>
  );
}

function SaveArea({
  saving,
  saved,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div
      className="flex items-center justify-end gap-3 pt-5 mt-6"
      style={{
        borderTop: '1px solid var(--border-color)',
      }}
    >
      {saved && (
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--accent-primary)' }}
        >
          <CheckCircle2 size={17} />
          Saved
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
        style={{
          background: 'var(--accent-primary)',
          color: '#fff',
        }}
      >
        <Save size={16} />
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  );
}

function ListCard({
  title,
  items,
  onAdd,
  onRemove,
  onRestore,
}: {
  title: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  onRestore: () => void;
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const value = newItem.trim();

    if (!value) return;

    onAdd(value);
    setNewItem('');
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3
          className="font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>

        <button
          type="button"
          onClick={onRestore}
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RotateCcw size={13} />
          Restore defaults
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span
              className="text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              {item}
            </span>

            <button
              type="button"
              onClick={() => onRemove(item)}
              className="p-1 rounded-lg transition"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
            }
          }}
          placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}`}
          className="flex-1 rounded-xl px-3 py-2.5 outline-none"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />

        <button
          type="button"
          onClick={handleAdd}
          className="px-3 rounded-xl flex items-center justify-center"
          style={{
            background: 'var(--accent-primary)',
            color: '#fff',
          }}
        >
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}

function DataCount({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        className="text-sm mb-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </div>

      <div
        className="text-2xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {count}
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS SECTION
   ========================================================= */

export function SettingsSection({
  state,
  updateSettings,
}: SettingsSectionProps) {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>('business');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* =======================================================
     BUSINESS FORM
     ======================================================= */

  const [businessForm, setBusinessForm] =
    useState<BusinessSettings>(state.settings.business);

  /* =======================================================
     INVOICE FORM
     ======================================================= */

  const [invoiceForm, setInvoiceForm] =
    useState<InvoiceSettings>(state.settings.invoices);

  /* =======================================================
     LIST FORM
     ======================================================= */

  const [listsForm, setListsForm] =
    useState<ListSettings>(state.settings.lists);

  /* =======================================================
     ACCOUNT FORM
     ======================================================= */

  const [accountForm, setAccountForm] =
    useState<AccountSettings>(state.settings.account);

  /* =======================================================
     USER FORM
     ======================================================= */

  const [users, setUsers] = useState<CRMUser[]>(
    state.settings.users?.users || [],
  );

  const [selectedUserId, setSelectedUserId] =
    useState<string | undefined>(
      state.settings.users?.currentUserId ||
        state.settings.users?.users?.[0]?.id,
    );

  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: CRMRole;
    status: CRMUserStatus;
  }>({
    name: '',
    email: '',
    role: 'Staff',
    status: 'Active',
  });

  /* =======================================================
     LOAD DATABASE SETTINGS
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);

        const [
          business,
          invoices,
          paymentMethods,
          lists,
          account,
        ] = await Promise.all([
          getBusinessProfile(),
          getInvoiceSettings(),
          getPaymentMethods(),
          getListSettings(),
          getAccountSettings(),
        ]);

        if (!mounted) return;

        /* ---------------- BUSINESS ---------------- */

        const loadedBusiness: BusinessSettings = {
          ...state.settings.business,

          name:
            business.company_name ||
            state.settings.business.name,

          address:
            business.address ||
            state.settings.business.address,

          tin:
            business.tax_id ||
            state.settings.business.tin,
        };

        setBusinessForm(loadedBusiness);

        /* ---------------- INVOICES ---------------- */

        const loadedInvoices: InvoiceSettings = {
          ...state.settings.invoices,

          invoicePrefix:
            invoices.prefix ||
            state.settings.invoices.invoicePrefix,

          nextInvoiceNumber:
            invoices.next_number ||
            state.settings.invoices.nextInvoiceNumber,

          taxRate:
            invoices.tax_rate ??
            state.settings.invoices.taxRate,

          paymentMethods:
            paymentMethods.map(
              (method) => method.method_type,
            ),
        };

        setInvoiceForm(loadedInvoices);

        /* ---------------- LISTS ---------------- */

        const loadedLists: ListSettings = {
          ...state.settings.lists,

          clientTypes:
            lists.client_types as ClientType[],

          leadStages:
            lists.lead_stages as LeadStage[],

          leadTemperatures:
            lists.lead_temperatures as LeadTemperature[],
        };

        setListsForm(loadedLists);

        /* ---------------- ACCOUNT ---------------- */

        const loadedAccount: AccountSettings = {
          ...state.settings.account,

          name:
            account.display_name ||
            state.settings.account.name,

          email:
            account.email ||
            state.settings.account.email,
        };

        setAccountForm(loadedAccount);

        /* ---------------- APP STATE ---------------- */

        updateSettings({
          business: loadedBusiness,
          invoices: loadedInvoices,
          lists: loadedLists,
          account: loadedAccount,
        });
      } catch (error) {
        console.error(
          'Failed to load settings:',
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };

    // Settings are loaded when this section mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     SAVE BUSINESS
     ======================================================= */

  const saveBusiness = async () => {
    try {
      setSaving(true);

      const result = await updateBusinessProfile({
        company_name: businessForm.name,
        address: businessForm.address,
        tax_id: businessForm.tin,
      });

      const updatedBusiness: BusinessSettings = {
        ...businessForm,
        name: result.company_name,
        address: result.address,
        tin: result.tax_id,
      };

      setBusinessForm(updatedBusiness);

      updateSettings({
        business: updatedBusiness,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to save business settings:',
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     SAVE INVOICES
     ======================================================= */

  const saveInvoices = async () => {
    try {
      setSaving(true);

      const result = await updateInvoiceSettings({
        prefix: invoiceForm.invoicePrefix,
        next_number: invoiceForm.nextInvoiceNumber,
        tax_rate: invoiceForm.taxRate,
        tax_enabled: true,
      });

      const updatedInvoices: InvoiceSettings = {
        ...invoiceForm,

        invoicePrefix: result.prefix,

        nextInvoiceNumber:
          result.next_number,

        taxRate:
          result.tax_rate,
      };

      setInvoiceForm(updatedInvoices);

      updateSettings({
        invoices: updatedInvoices,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to save invoice settings:',
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     SAVE LISTS
     ======================================================= */

  const saveLists = async () => {
    try {
      setSaving(true);

      const result = await updateListSettings({
        client_types: listsForm.clientTypes,
        lead_stages: listsForm.leadStages,
        lead_temperatures:
          listsForm.leadTemperatures,
      });

      const updatedLists: ListSettings = {
        ...listsForm,

        clientTypes:
          result.client_types as ClientType[],

        leadStages:
          result.lead_stages as LeadStage[],

        leadTemperatures:
          result.lead_temperatures as LeadTemperature[],
      };

      setListsForm(updatedLists);

      updateSettings({
        lists: updatedLists,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to save list settings:',
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     SAVE ACCOUNT
     ======================================================= */

  const saveAccount = async () => {
    try {
      setSaving(true);

      const result =
        await updateAccountSettings({
          display_name: accountForm.name,
          email: accountForm.email,
        });

      const updatedAccount: AccountSettings = {
        ...accountForm,

        name:
          result.display_name,

        email:
          result.email,
      };

      setAccountForm(updatedAccount);

      updateSettings({
        account: updatedAccount,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to save account settings:',
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     LIST HELPERS
     ======================================================= */

  const addClientType = (value: string) => {
    if (
      !listsForm.clientTypes.includes(
        value as ClientType,
      )
    ) {
      setListsForm((prev) => ({
        ...prev,
        clientTypes: [
          ...prev.clientTypes,
          value as ClientType,
        ],
      }));
    }
  };

  const removeClientType = (value: string) => {
    setListsForm((prev) => ({
      ...prev,
      clientTypes:
        prev.clientTypes.filter(
          (item) => item !== value,
        ),
    }));
  };

  const addLeadStage = (value: string) => {
    if (
      !listsForm.leadStages.includes(
        value as LeadStage,
      )
    ) {
      setListsForm((prev) => ({
        ...prev,
        leadStages: [
          ...prev.leadStages,
          value as LeadStage,
        ],
      }));
    }
  };

  const removeLeadStage = (value: string) => {
    setListsForm((prev) => ({
      ...prev,
      leadStages:
        prev.leadStages.filter(
          (item) => item !== value,
        ),
    }));
  };

  const addTemperature = (value: string) => {
    if (
      !listsForm.leadTemperatures.includes(
        value as LeadTemperature,
      )
    ) {
      setListsForm((prev) => ({
        ...prev,
        leadTemperatures: [
          ...prev.leadTemperatures,
          value as LeadTemperature,
        ],
      }));
    }
  };

  const removeTemperature = (value: string) => {
    setListsForm((prev) => ({
      ...prev,
      leadTemperatures:
        prev.leadTemperatures.filter(
          (item) => item !== value,
        ),
    }));
  };

  /* =======================================================
     PAYMENT METHODS
     ======================================================= */

  const [paymentMethodInput, setPaymentMethodInput] =
    useState('');

  const addPayment = async () => {
    const method = paymentMethodInput.trim();

    if (!method) return;

    if (
      invoiceForm.paymentMethods.includes(method)
    ) {
      setPaymentMethodInput('');
      return;
    }

    try {
      await addPaymentMethod({
        method_type: method,
        is_active: true,
      });

      setInvoiceForm((prev) => ({
        ...prev,
        paymentMethods: [
          ...prev.paymentMethods,
          method,
        ],
      }));

      setPaymentMethodInput('');
    } catch (error) {
      console.error(
        'Failed to add payment method:',
        error,
      );
    }
  };

  const removePayment = async (
    method: string,
  ) => {
    try {
      const methods = await getPaymentMethods();

      const existing = methods.find(
        (item) =>
          item.method_type === method,
      );

      if (existing) {
        await deletePaymentMethod(
          existing.id,
        );
      }

      setInvoiceForm((prev) => ({
        ...prev,
        paymentMethods:
          prev.paymentMethods.filter(
            (item) => item !== method,
          ),
      }));
    } catch (error) {
      console.error(
        'Failed to remove payment method:',
        error,
      );
    }
  };

  /* =======================================================
     USERS
     ======================================================= */

  const addUser = () => {
    if (
      !newUser.name.trim() ||
      !newUser.email.trim()
    ) {
      return;
    }

    const newUserId =
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : String(Date.now());

    const user: CRMUser = {
      id: newUserId,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      status: newUser.status,
    };

    const updatedUsers = [
      ...users,
      user,
    ];

    setUsers(updatedUsers);

    const currentUserId =
      state.settings.users?.currentUserId ||
      user.id;

    updateSettings({
      users: {
        ...state.settings.users,
        currentUserId,
        users: updatedUsers,
      },
    });

    setNewUser({
      name: '',
      email: '',
      role: 'Staff',
      status: 'Active',
    });

    if (!selectedUserId) {
      setSelectedUserId(currentUserId);
    }
  };

  const removeUser = (id: string) => {
    const updatedUsers =
      users.filter(
        (user) => user.id !== id,
      );

    setUsers(updatedUsers);

    let nextCurrentUserId =
      state.settings.users?.currentUserId || '';

    if (
      nextCurrentUserId === id
    ) {
      nextCurrentUserId =
        updatedUsers[0]?.id || '';
    }

    if (selectedUserId === id) {
      setSelectedUserId(
        updatedUsers[0]?.id,
      );
    }

    updateSettings({
      users: {
        ...state.settings.users,
        currentUserId:
          nextCurrentUserId,
        users: updatedUsers,
      },
    });
  };

  const updateUser = (
    id: string,
    updates: Partial<CRMUser>,
  ) => {
    const updatedUsers =
      users.map((user) =>
        user.id === id
          ? { ...user, ...updates }
          : user,
      );

    setUsers(updatedUsers);

    updateSettings({
      users: {
        ...state.settings.users,
        users: updatedUsers,
      },
    });
  };

  const selectedUser = users.find(
    (user) =>
      user.id === selectedUserId,
  );

  /* =======================================================
     DATA
     ======================================================= */

  const downloadBackup = () => {
    const backup = JSON.stringify(
      state,
      null,
      2,
    );

    const blob = new Blob(
      [backup],
      {
        type: 'application/json',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      `crm-backup-${new Date()
        .toISOString()
        .split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    updateSettings({
      data: {
        ...state.settings.data,
        lastBackupAt:
          new Date().toISOString(),
      },
    });
  };

  const resetData = () => {
    const confirmed =
      window.confirm(
        'Are you sure you want to reset the CRM to sample data? This may overwrite your current local data.',
      );

    if (!confirmed) return;

    resetToSampleData();

    window.location.reload();
  };

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <section className="py-10">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background:
              'var(--bg-secondary)',
            border:
              '1px solid var(--border-color)',
          }}
        >
          <div
            className="animate-pulse text-sm"
            style={{
              color:
                'var(--text-secondary)',
            }}
          >
            Loading settings...
          </div>
        </div>
      </section>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="space-y-6 pb-10">
      {/* HEADER */}

      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{
            color:
              'var(--text-primary)',
          }}
        >
          Settings
        </h1>

        <p
          className="mt-1"
          style={{
            color:
              'var(--text-secondary)',
          }}
        >
          Manage your CRM preferences,
          business information, users,
          and data.
        </p>
      </div>

      {/* TABS */}

      <div
        className="overflow-x-auto"
        style={{
          borderBottom:
            '1px solid var(--border-color)',
        }}
      >
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition relative"
                style={{
                  color: active
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
                }}
              >
                <Icon size={17} />
                {tab.label}

                {active && (
                  <span
                    className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full"
                    style={{
                      background:
                        'var(--accent-primary)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================
          BUSINESS
          =================================================== */}

      {activeTab === 'business' && (
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background:
              'var(--bg-secondary)',
            border:
              '1px solid var(--border-color)',
          }}
        >
          <div className="mb-6">
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              Business Information
            </h2>

            <p
              className="text-sm mt-1"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Information that appears
              across your CRM and invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingsInput
              label="Business name"
              value={businessForm.name}
              onChange={(value) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  name: value,
                }))
              }
            />

            <SettingsInput
              label="Email"
              value={
                businessForm.email
              }
              onChange={(value) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  email: value,
                }))
              }
              type="email"
            />

            <SettingsInput
              label="Phone"
              value={
                businessForm.phone
              }
              onChange={(value) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  phone: value,
                }))
              }
            />

            <SettingsInput
              label="Website"
              value={
                businessForm.website
              }
              onChange={(value) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  website: value,
                }))
              }
            />

            <div className="md:col-span-2">
              <SettingsInput
                label="Address"
                value={
                  businessForm.address
                }
                onChange={(value) =>
                  setBusinessForm(
                    (prev) => ({
                      ...prev,
                      address: value,
                    }),
                  )
                }
              />
            </div>

            <SettingsInput
              label="TIN"
              value={businessForm.tin}
              onChange={(value) =>
                setBusinessForm((prev) => ({
                  ...prev,
                  tin: value,
                }))
              }
            />
          </div>

          <SaveArea
            saving={saving}
            saved={saved}
            onSave={saveBusiness}
          />
        </div>
      )}

      {/* ===================================================
          INVOICES
          =================================================== */}

      {activeTab === 'invoices' && (
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background:
              'var(--bg-secondary)',
            border:
              '1px solid var(--border-color)',
          }}
        >
          <div className="mb-6">
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              Invoice Settings
            </h2>

            <p
              className="text-sm mt-1"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Configure invoice numbering,
              taxes, payment terms, and
              payment methods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingsInput
              label="Currency"
              value={
                invoiceForm.currency
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  currency: value,
                }))
              }
            />

            <SettingsInput
              label="Tax label"
              value={
                invoiceForm.taxLabel
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  taxLabel: value,
                }))
              }
            />

            <SettingsInput
              label="Tax rate (%)"
              value={
                invoiceForm.taxRate
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  taxRate:
                    Number(value) || 0,
                }))
              }
              type="number"
            />

            <SettingsInput
              label="Payment terms (days)"
              value={
                invoiceForm.paymentTerms
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  paymentTerms:
                    Number(value) || 0,
                }))
              }
              type="number"
            />

            <SettingsInput
              label="Invoice prefix"
              value={
                invoiceForm.invoicePrefix
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  invoicePrefix: value,
                }))
              }
            />

            <SettingsInput
              label="Next invoice number"
              value={
                invoiceForm.nextInvoiceNumber
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  nextInvoiceNumber:
                    Number(value) || 0,
                }))
              }
              type="number"
            />

            <SettingsInput
              label="Receipt prefix"
              value={
                invoiceForm.receiptPrefix
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  receiptPrefix: value,
                }))
              }
            />

            <SettingsInput
              label="Next receipt number"
              value={
                invoiceForm.nextReceiptNumber
              }
              onChange={(value) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  nextReceiptNumber:
                    Number(value) || 0,
                }))
              }
              type="number"
            />

            <div className="md:col-span-2">
              <SettingsInput
                label="Invoice footer"
                value={
                  invoiceForm.footer
                }
                onChange={(value) =>
                  setInvoiceForm(
                    (prev) => ({
                      ...prev,
                      footer: value,
                    }),
                  )
                }
              />
            </div>
          </div>

          {/* PAYMENT METHODS */}

          <div className="mt-6">
            <span
              className="block text-sm font-medium mb-2"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Payment methods
            </span>

            <div className="flex flex-wrap gap-2 mb-3">
              {invoiceForm.paymentMethods.map(
                (method) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                    style={{
                      background:
                        'var(--bg-primary)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color)',
                    }}
                  >
                    {method}

                    <button
                      type="button"
                      onClick={() =>
                        removePayment(
                          method,
                        )
                      }
                      className="opacity-70 hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ),
              )}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                value={
                  paymentMethodInput
                }
                onChange={(e) =>
                  setPaymentMethodInput(
                    e.target.value,
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter'
                  ) {
                    addPayment();
                  }
                }}
                placeholder="Add payment method"
                className="flex-1 rounded-xl px-4 py-2.5 outline-none"
                style={{
                  background:
                    'var(--bg-primary)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border-color)',
                }}
              />

              <button
                type="button"
                onClick={addPayment}
                className="px-4 rounded-xl"
                style={{
                  background:
                    'var(--accent-primary)',
                  color: '#fff',
                }}
              >
                <Plus size={17} />
              </button>
            </div>
          </div>

          <SaveArea
            saving={saving}
            saved={saved}
            onSave={saveInvoices}
          />
        </div>
      )}

      {/* ===================================================
          LISTS
          =================================================== */}

      {activeTab === 'lists' && (
        <div className="space-y-5">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              CRM Lists
            </h2>

            <p
              className="text-sm mt-1"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Customize the options used
              throughout your CRM.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ListCard
              title="Client Types"
              items={
                listsForm.clientTypes
              }
              onAdd={addClientType}
              onRemove={
                removeClientType
              }
              onRestore={() =>
                setListsForm((prev) => ({
                  ...prev,
                  clientTypes: [
                    ...defaultClientTypes,
                  ],
                }))
              }
            />

            <ListCard
              title="Lead Stages"
              items={
                listsForm.leadStages
              }
              onAdd={addLeadStage}
              onRemove={
                removeLeadStage
              }
              onRestore={() =>
                setListsForm((prev) => ({
                  ...prev,
                  leadStages: [
                    ...defaultLeadStages,
                  ],
                }))
              }
            />

            <ListCard
              title="Lead Temperatures"
              items={
                listsForm.leadTemperatures
              }
              onAdd={addTemperature}
              onRemove={
                removeTemperature
              }
              onRestore={() =>
                setListsForm((prev) => ({
                  ...prev,
                  leadTemperatures: [
                    ...defaultTemperatures,
                  ],
                }))
              }
            />
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <SaveArea
              saving={saving}
              saved={saved}
              onSave={saveLists}
            />
          </div>
        </div>
      )}

      {/* ===================================================
          USERS
          =================================================== */}

      {activeTab === 'users' && (
        <div className="space-y-5">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              CRM Users
            </h2>

            <p
              className="text-sm mt-1"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Manage users and their CRM
              roles.
            </p>
          </div>

          {/* CURRENT USER */}

          {users.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{
                background:
                  'var(--bg-secondary)',
                border:
                  '1px solid var(--border-color)',
              }}
            >
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                Current user
              </label>

              <select
                value={
                  selectedUserId ?? ''
                }
                onChange={(e) => {
                  const id =
                    e.target.value;

                  setSelectedUserId(id);

                  updateSettings({
                    users: {
                      ...state.settings.users,
                      currentUserId: id,
                      users,
                    },
                  });
                }}
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{
                  background:
                    'var(--bg-primary)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border-color)',
                }}
              >
                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name} —{' '}
                    {user.role}
                  </option>
                ))}
              </select>

              {selectedUser && (
                <div
                  className="mt-4 text-sm"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                >
                  {roleDescriptions[
                    selectedUser.role
                  ]}
                </div>
              )}
            </div>
          )}

          {/* ADD USER */}

          <div
            className="rounded-2xl p-5"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <h3
              className="font-semibold mb-4"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              Add user
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SettingsInput
                label="Name"
                value={
                  newUser.name
                }
                onChange={(value) =>
                  setNewUser(
                    (prev) => ({
                      ...prev,
                      name: value,
                    }),
                  )
                }
              />

              <SettingsInput
                label="Email"
                value={
                  newUser.email
                }
                onChange={(value) =>
                  setNewUser(
                    (prev) => ({
                      ...prev,
                      email: value,
                    }),
                  )
                }
                type="email"
              />

              <label className="block">
                <span
                  className="block text-sm font-medium mb-2"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                >
                  Role
                </span>

                <select
                  value={
                    newUser.role
                  }
                  onChange={(e) =>
                    setNewUser(
                      (prev) => ({
                        ...prev,
                        role: e.target
                          .value as CRMRole,
                      }),
                    )
                  }
                  className="w-full rounded-xl px-4 py-3 outline-none"
                  style={{
                    background:
                      'var(--bg-primary)',
                    color:
                      'var(--text-primary)',
                    border:
                      '1px solid var(--border-color)',
                  }}
                >
                  <option value="Owner">
                    Owner
                  </option>
                  <option value="Admin">
                    Admin
                  </option>
                  <option value="Manager">
                    Manager
                  </option>
                  <option value="Staff">
                    Staff
                  </option>
                  <option value="Accountant">
                    Accountant
                  </option>
                </select>
              </label>

              <label className="block">
                <span
                  className="block text-sm font-medium mb-2"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                >
                  Status
                </span>

                <select
                  value={
                    newUser.status
                  }
                  onChange={(e) =>
                    setNewUser(
                      (prev) => ({
                        ...prev,
                        status: e.target
                          .value as CRMUserStatus,
                      }),
                    )
                  }
                  className="w-full rounded-xl px-4 py-3 outline-none"
                  style={{
                    background:
                      'var(--bg-primary)',
                    color:
                      'var(--text-primary)',
                    border:
                      '1px solid var(--border-color)',
                  }}
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={addUser}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium"
              style={{
                background:
                  'var(--accent-primary)',
                color: '#fff',
              }}
            >
              <Plus size={16} />
              Add user
            </button>
          </div>

          {/* USERS LIST */}

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            {users.length === 0 ? (
              <div
                className="p-6 text-center text-sm"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                No users added yet.
              </div>
            ) : (
              <div>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                    style={{
                      borderBottom:
                        '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className="font-medium"
                        style={{
                          color:
                            'var(--text-primary)',
                        }}
                      >
                        {user.name}
                      </div>

                      <div
                        className="text-sm mt-1"
                        style={{
                          color:
                            'var(--text-secondary)',
                        }}
                      >
                        {user.email}
                      </div>
                    </div>

                    <select
                      value={
                        user.role
                      }
                      onChange={(e) =>
                        updateUser(
                          user.id,
                          {
                            role: e.target
                              .value as CRMRole,
                          },
                        )
                      }
                      className="rounded-xl px-3 py-2 outline-none"
                      style={{
                        background:
                          'var(--bg-primary)',
                        color:
                          'var(--text-primary)',
                        border:
                          '1px solid var(--border-color)',
                      }}
                    >
                      <option value="Owner">
                        Owner
                      </option>
                      <option value="Admin">
                        Admin
                      </option>
                      <option value="Manager">
                        Manager
                      </option>
                      <option value="Staff">
                        Staff
                      </option>
                      <option value="Accountant">
                        Accountant
                      </option>
                    </select>

                    <select
                      value={
                        user.status
                      }
                      onChange={(e) =>
                        updateUser(
                          user.id,
                          {
                            status:
                              e.target
                                .value as CRMUserStatus,
                          },
                        )
                      }
                      className="rounded-xl px-3 py-2 outline-none"
                      style={{
                        background:
                          'var(--bg-primary)',
                        color:
                          'var(--text-primary)',
                        border:
                          '1px solid var(--border-color)',
                      }}
                    >
                      <option value="Active">
                        Active
                      </option>
                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        removeUser(
                          user.id,
                        )
                      }
                      className="p-2 rounded-xl"
                      style={{
                        color:
                          'var(--text-secondary)',
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================
          ACCOUNT
          =================================================== */}

      {activeTab === 'account' && (
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background:
              'var(--bg-secondary)',
            border:
              '1px solid var(--border-color)',
          }}
        >
          <div className="mb-6">
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              My Account
            </h2>

            <p
              className="text-sm mt-1"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Manage your personal CRM
              account information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingsInput
              label="Name"
              value={
                accountForm.name
              }
              onChange={(value) =>
                setAccountForm(
                  (prev) => ({
                    ...prev,
                    name: value,
                  }),
                )
              }
            />

            <SettingsInput
              label="Email"
              value={
                accountForm.email
              }
              onChange={(value) =>
                setAccountForm(
                  (prev) => ({
                    ...prev,
                    email: value,
                  }),
                )
              }
              type="email"
            />

            <div>
              <span
                className="block text-sm font-medium mb-2"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                Current role
              </span>

              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background:
                    'var(--bg-primary)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border-color)',
                }}
              >
                {selectedUser?.role ||
                  'Owner'}
              </div>
            </div>

            <div>
              <span
                className="block text-sm font-medium mb-2"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                Account status
              </span>

              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background:
                    'var(--bg-primary)',
                  color:
                    'var(--text-primary)',
                  border:
                    '1px solid var(--border-color)',
                }}
              >
                {selectedUser?.status ||
                  'Active'}
              </div>
            </div>
          </div>

          <SaveArea
            saving={saving}
            saved={saved}
            onSave={saveAccount}
          />
        </div>
      )}

      {/* ===================================================
          DATA
          =================================================== */}

      {activeTab === 'data' && (
        <div className="space-y-5">
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <h2
              className="text-lg font-semibold mb-1"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              Data overview
            </h2>

            <p
              className="text-sm mb-6"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Overview of the information
              currently stored in your CRM.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <DataCount
                label="Clients"
                count={
                  state.clients?.length ||
                  0
                }
              />

              <DataCount
                label="Leads"
                count={
                  state.leads?.length ||
                  0
                }
              />

              <DataCount
                label="Invoices"
                count={
                  state.invoices?.length ||
                  0
                }
              />

              <DataCount
                label="Team"
                count={
                  state.team?.length ||
                  0
                }
              />

              <DataCount
                label="Messages"
                count={
                  state.messages
                    ?.length || 0
                }
              />
            </div>
          </div>

          {/* BACKUP */}

          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              Backup
            </h2>

            <p
              className="text-sm mt-1 mb-5"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Download a copy of your
              current CRM data.
            </p>

            <button
              type="button"
              onClick={downloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium"
              style={{
                background:
                  'var(--accent-primary)',
                color: '#fff',
              }}
            >
              <Download size={17} />
              Download backup
            </button>

            {state.settings.data
              .lastBackupAt && (
              <p
                className="text-xs mt-3"
                style={{
                  color:
                    'var(--text-secondary)',
                }}
              >
                Last backup:{' '}
                {new Date(
                  state.settings.data
                    .lastBackupAt,
                ).toLocaleString()}
              </p>
            )}
          </div>

          {/* RESET */}

          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{
                color:
                  'var(--text-primary)',
              }}
            >
              Reset sample data
            </h2>

            <p
              className="text-sm mt-1 mb-5"
              style={{
                color:
                  'var(--text-secondary)',
              }}
            >
              Restore the CRM to its
              original sample data.
            </p>

            <button
              type="button"
              onClick={resetData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium"
              style={{
                background:
                  'var(--bg-primary)',
                color:
                  'var(--text-primary)',
                border:
                  '1px solid var(--border-color)',
              }}
            >
              <RotateCcw size={17} />
              Reset sample data
            </button>
          </div>

          {/* STORAGE NOTE */}

          <div
            className="rounded-2xl p-5"
            style={{
              background:
                'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-start gap-3">
              <Database
                size={20}
                style={{
                  color:
                    'var(--accent-primary)',
                }}
              />

              <div>
                <h3
                  className="font-medium"
                  style={{
                    color:
                      'var(--text-primary)',
                  }}
                >
                  Current storage
                </h3>

                <p
                  className="text-sm mt-1"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                >
                  Settings are loaded from
                  the database when available.
                  Your existing CRM application
                  state remains unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SettingsSection;
