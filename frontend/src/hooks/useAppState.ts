import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { Client, Lead, Invoice, Receipt, TeamMember, Message, Task, LeadStage, View } from '@/types';
import { appReducer, initialState } from '@/store/reducer';
import { loadState, saveState } from '@/store/storage';

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const hasHydrated = useRef(false);

  // Load saved data once on mount, replacing the sample-data initial state.
  useEffect(() => {
    let cancelled = false;
    loadState().then((loaded) => {
      if (cancelled) return;
      dispatch({ type: 'HYDRATE', payload: loaded });
      hasHydrated.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, but only after the initial load has completed —
  // otherwise we'd briefly overwrite real saved data with the sample data.
  useEffect(() => {
    if (!hasHydrated.current) return;
    saveState(state).catch(() => {
      // A visible error toast for a failed save belongs to B2, once there's a
      // real server that can fail; for localStorage this realistically only
      // happens if storage is full or unavailable (e.g. private browsing).
    });
  }, [state]);

  const setView = useCallback((view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const addClient = useCallback((client: Client) => {
    dispatch({ type: 'ADD_CLIENT', payload: client });
  }, []);

  const updateClient = useCallback((client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
  }, []);

  const deleteClient = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
  }, []);

  const addLead = useCallback((lead: Lead) => {
    dispatch({ type: 'ADD_LEAD', payload: lead });
  }, []);

  const updateLead = useCallback((lead: Lead) => {
    dispatch({ type: 'UPDATE_LEAD', payload: lead });
  }, []);

  const deleteLead = useCallback((id: string) => {
    dispatch({ type: 'DELETE_LEAD', payload: id });
  }, []);

  const moveLead = useCallback((id: string, stage: LeadStage) => {
    dispatch({ type: 'MOVE_LEAD', payload: { id, stage } });
  }, []);

  const addInvoice = useCallback((invoice: Invoice) => {
    dispatch({ type: 'ADD_INVOICE', payload: invoice });
  }, []);

  const updateInvoice = useCallback((invoice: Invoice) => {
    dispatch({ type: 'UPDATE_INVOICE', payload: invoice });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    dispatch({ type: 'DELETE_INVOICE', payload: id });
  }, []);

  const addReceipt = useCallback((receipt: Receipt) => {
    dispatch({ type: 'ADD_RECEIPT', payload: receipt });
  }, []);

  const addTeamMember = useCallback((member: TeamMember) => {
    dispatch({ type: 'ADD_TEAM_MEMBER', payload: member });
  }, []);

  const updateTeamMember = useCallback((member: TeamMember) => {
    dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: member });
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TEAM_MEMBER', payload: id });
  }, []);

  const addTask = useCallback((memberId: string, task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: { memberId, task } });
  }, []);

  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const pinMessage = useCallback((id: string) => {
    dispatch({ type: 'PIN_MESSAGE', payload: id });
  }, []);

  const unpinMessage = useCallback((id: string) => {
    dispatch({ type: 'UNPIN_MESSAGE', payload: id });
  }, []);

  return {
    state,
    setView,
    addClient,
    updateClient,
    deleteClient,
    addLead,
    updateLead,
    deleteLead,
    moveLead,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addReceipt,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addTask,
    addMessage,
    pinMessage,
    unpinMessage,
  };
}