import type { AppState, Action } from '@/types';
import { seedClients, seedLeads, seedInvoices, seedReceipts, seedTeam, seedMessages } from './seedData';

export const initialState: AppState = {
  currentView: 'dashboard',
  clients: seedClients,
  leads: seedLeads,
  invoices: seedInvoices,
  receipts: seedReceipts,
  team: seedTeam,
  messages: seedMessages,
};

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'SET_VIEW':
      return { ...state, currentView: action.payload };

    case 'ADD_CLIENT':
      return { ...state, clients: [action.payload, ...state.clients] };

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
      };

    case 'ADD_LEAD':
      return { ...state, leads: [action.payload, ...state.leads] };

    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map((l) => (l.id === action.payload.id ? action.payload : l)),
      };

    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter((l) => l.id !== action.payload),
      };

    case 'MOVE_LEAD':
      return {
        ...state,
        leads: state.leads.map((l) =>
          l.id === action.payload.id
            ? { ...l, stage: action.payload.stage, updatedAt: new Date().toISOString().split('T')[0] }
            : l
        ),
      };

    case 'ADD_INVOICE':
      return { ...state, invoices: [action.payload, ...state.invoices] };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload.id ? action.payload : inv
        ),
      };

    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter((inv) => inv.id !== action.payload),
      };

    case 'ADD_RECEIPT':
      return { ...state, receipts: [action.payload, ...state.receipts] };

    case 'ADD_TEAM_MEMBER':
      return { ...state, team: [action.payload, ...state.team] };

    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        team: state.team.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };

    case 'DELETE_TEAM_MEMBER':
      return {
        ...state,
        team: state.team.filter((t) => t.id !== action.payload),
      };

    case 'ADD_TASK':
      return {
        ...state,
        team: state.team.map((t) =>
          t.id === action.payload.memberId
            ? { ...t, tasks: [...t.tasks, action.payload.task] }
            : t
        ),
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        team: state.team.map((t) =>
          t.id === action.payload.memberId
            ? {
                ...t,
                tasks: t.tasks.map((task) =>
                  task.id === action.payload.task.id ? action.payload.task : task
                ),
              }
            : t
        ),
      };

    case 'ADD_MESSAGE':
      return { ...state, messages: [action.payload, ...state.messages] };

    case 'PIN_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload ? { ...m, isPinned: true } : m
        ),
      };

    case 'UNPIN_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload ? { ...m, isPinned: false } : m
        ),
      };

    default:
      return state;
  }
}