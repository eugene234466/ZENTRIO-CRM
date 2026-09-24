import type {
  AppState,
  Action,
  Settings,
} from '@/types';

import {
  seedClients,
  seedLeads,
  seedInvoices,
  seedReceipts,
  seedTeam,
  seedMessages,
} from './seedData';

const defaultUsers = seedTeam.map((member) => ({
  id: `user-${member.id}`,
  name: member.name,
  email: member.email,
  role:
    member.role === 'Manager'
      ? ('Manager' as const)
      : ('Staff' as const),
  status:
    member.status === 'Offline'
      ? ('Inactive' as const)
      : ('Active' as const),
}));

const defaultSettings: Settings = {
  business: {
    name: 'Zentrio Solutions',
    email: '',
    phone: '',
    address: '',
    website: '',
    tin: '',
    logo: '',
  },

  invoices: {
    currency: 'GHS',
    taxRate: 0,
    taxLabel: 'Tax',
    paymentTerms: 30,
    paymentMethods: [
      'Cash',
      'Bank Transfer',
      'Mobile Money',
    ],
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1,
    receiptPrefix: 'REC-',
    nextReceiptNumber: 1,
    footer: '',
  },

  lists: {
    clientTypes: [
      'SME',
      'School',
      'Healthcare',
      'Enterprise',
    ],

    leadStages: [
      'New',
      'Contacted',
      'Qualified',
      'Proposal Sent',
      'Won',
      'Lost',
    ],

    leadTemperatures: [
      'Hot',
      'Warm',
      'Cold',
    ],
  },

  users: {
    currentUserId: defaultUsers[0]?.id ?? '',
    users: defaultUsers,
  },

  account: {
    name: '',
    email: '',
  },

  data: {
    lastBackupAt: undefined,
  },
};

export const initialState: AppState = {
  currentView: 'dashboard',
  clients: [],
  leads: [],
  invoices: seedInvoices,
  receipts: seedReceipts,
  team: seedTeam,
  messages: seedMessages,
  settings: defaultSettings,
};

export function appReducer(
  state: AppState,
  action: Action,
): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
      };

    // -------------------------
    // CLIENTS
    // -------------------------

    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [
          ...state.clients,
          action.payload,
        ],
      };

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((client) =>
          client.id === action.payload.id
            ? action.payload
            : client,
        ),
      };

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(
          (client) => client.id !== action.payload,
        ),
      };

    // -------------------------
    // LEADS
    // -------------------------

    case 'ADD_LEAD':
      return {
        ...state,
        leads: [
          ...state.leads,
          action.payload,
        ],
      };

    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? action.payload
            : lead,
        ),
      };

    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter(
          (lead) => lead.id !== action.payload,
        ),
      };

    case 'MOVE_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? {
                ...lead,
                stage: action.payload.stage,
                updatedAt: new Date().toISOString(),
              }
            : lead,
        ),
      };

    // -------------------------
    // INVOICES
    // -------------------------

    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [
          ...state.invoices,
          action.payload,
        ],
      };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((invoice) =>
          invoice.id === action.payload.id
            ? action.payload
            : invoice,
        ),
      };

    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(
          (invoice) => invoice.id !== action.payload,
        ),
      };

    // -------------------------
    // RECEIPTS
    // -------------------------

    case 'ADD_RECEIPT':
      return {
        ...state,
        receipts: [
          ...state.receipts,
          action.payload,
        ],
      };

    // -------------------------
    // TEAM MEMBERS
    // -------------------------

    case 'ADD_TEAM_MEMBER':
      return {
        ...state,
        team: [
          ...state.team,
          action.payload,
        ],
      };

    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        team: state.team.map((member) =>
          member.id === action.payload.id
            ? action.payload
            : member,
        ),
      };

    case 'DELETE_TEAM_MEMBER':
      return {
        ...state,
        team: state.team.filter(
          (member) => member.id !== action.payload,
        ),
      };

    // -------------------------
    // TASKS
    // -------------------------

    case 'ADD_TASK':
      return {
        ...state,
        team: state.team.map((member) =>
          member.id === action.payload.memberId
            ? {
                ...member,
                tasks: [
                  ...member.tasks,
                  action.payload.task,
                ],
              }
            : member,
        ),
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        team: state.team.map((member) =>
          member.id === action.payload.memberId
            ? {
                ...member,
                tasks: member.tasks.map((task) =>
                  task.id === action.payload.task.id
                    ? action.payload.task
                    : task,
                ),
              }
            : member,
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        team: state.team.map((member) =>
          member.id === action.payload.memberId
            ? {
                ...member,
                tasks: member.tasks.filter(
                  (task) =>
                    task.id !== action.payload.taskId,
                ),
              }
            : member,
        ),
      };

    // -------------------------
    // MESSAGE BOARD
    // -------------------------

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          action.payload,
        ],
      };

    case 'PIN_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload
            ? {
                ...message,
                isPinned: true,
              }
            : message,
        ),
      };

    case 'UNPIN_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload
            ? {
                ...message,
                isPinned: false,
              }
            : message,
        ),
      };

    // -------------------------
    // SETTINGS
    // -------------------------

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,

          business: action.payload.business
            ? {
                ...state.settings.business,
                ...action.payload.business,
              }
            : state.settings.business,

          invoices: action.payload.invoices
            ? {
                ...state.settings.invoices,
                ...action.payload.invoices,
              }
            : state.settings.invoices,

          lists: action.payload.lists
            ? {
                ...state.settings.lists,
                ...action.payload.lists,
              }
            : state.settings.lists,

          users: action.payload.users
            ? {
                ...state.settings.users,
                ...action.payload.users,
              }
            : state.settings.users,

          account: action.payload.account
            ? {
                ...state.settings.account,
                ...action.payload.account,
              }
            : state.settings.account,

          data: action.payload.data
            ? {
                ...state.settings.data,
                ...action.payload.data,
              }
            : state.settings.data,
        },
      };

    default:
      return state;
  }
}