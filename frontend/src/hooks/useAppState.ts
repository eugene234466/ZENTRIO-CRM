import {
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import type {
  Client,
  Lead,
  Invoice,
  Receipt,
  TeamMember,
  Message,
  Task,
  LeadStage,
  View,
  Settings,
} from '@/types';

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
  fetchTeamMembers,
  addTeamMemberApi,
  updateTeamMemberApi,
  deleteTeamMemberApi,
  addTeamMemberTaskApi,
  updateTeamMemberTaskApi,
  deleteTeamMemberTaskApi,
} from '@/api';

import {
  appReducer,
  initialState,
} from '@/store/reducer';

import {
  loadState,
  saveState,
} from '@/store/storage';

export function useAppState() {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
  );

  const hasHydrated = useRef(false);

  const previousSettings =
    useRef<Settings | null>(null);

  const isHydrating =
    useRef(false);

 

  useEffect(() => {
    let cancelled = false;

    const hydrateState = async () => {
      try {
        isHydrating.current = true;

       
        const loaded = await loadState();

        if (cancelled) return;

       
        dispatch({
          type: 'HYDRATE',
          payload: loaded,
        });

        

        const [
          businessResult,
          invoiceResult,
          paymentResult,
          listsResult,
          accountResult,
          teamResult,
        ] = await Promise.allSettled([
          getBusinessProfile(),
          getInvoiceSettings(),
          getPaymentMethods(),
          getListSettings(),
          getAccountSettings(),
          fetchTeamMembers(),
        ]);

        if (cancelled) return;

        
        const mergedSettings: Settings = {
          ...loaded.settings,

          business: {
            ...loaded.settings.business,
          },

          invoices: {
            ...loaded.settings.invoices,
          },

          lists: {
            ...loaded.settings.lists,
          },

          users: {
            ...loaded.settings.users,
          },

          account: {
            ...loaded.settings.account,
          },

          data: {
            ...loaded.settings.data,
          },
        };

      
        if (
          businessResult.status ===
          'fulfilled'
        ) {
          const business =
            businessResult.value;

          mergedSettings.business = {
            ...mergedSettings.business,

            name:
              business.company_name || '',

            address:
              business.address || '',

            tin:
              business.tax_id || '',

            logo:
              business.logo_url ||
              business.logoUrl ||
              mergedSettings.business.logo,
          };

        
          if (business.currency) {
            mergedSettings.invoices = {
              ...mergedSettings.invoices,

              currency:
                business.currency,
            };
          }
        } else {
          console.error(
            'Failed to load business profile:',
            businessResult.reason,
          );
        }

        
        if (
          invoiceResult.status ===
          'fulfilled'
        ) {
          const invoice =
            invoiceResult.value;

          mergedSettings.invoices = {
            ...mergedSettings.invoices,

            invoicePrefix:
              invoice.prefix ||
              mergedSettings.invoices
                .invoicePrefix,

            nextInvoiceNumber:
              Number(invoice.next_number) ||
              mergedSettings.invoices
                .nextInvoiceNumber,

            taxRate:
              Number(invoice.tax_rate) ||
              mergedSettings.invoices
                .taxRate,
          };
        } else {
          console.error(
            'Failed to load invoice settings:',
            invoiceResult.reason,
          );
        }


        if (
          paymentResult.status ===
          'fulfilled'
        ) {
          const paymentMethods =
            paymentResult.value;

          mergedSettings.invoices = {
            ...mergedSettings.invoices,

            paymentMethods:
              paymentMethods
                .filter(
                  (method) =>
                    method.is_active !== false,
                )
                .map(
                  (method) =>
                    method.method_type,
                ),
          };
        } else {
          console.error(
            'Failed to load payment methods:',
            paymentResult.reason,
          );
        }

       
        if (
          listsResult.status ===
          'fulfilled'
        ) {
          const lists =
            listsResult.value;

          mergedSettings.lists = {
            clientTypes:
              lists.client_types as Settings['lists']['clientTypes'],

            leadStages:
              lists.lead_stages as Settings['lists']['leadStages'],

            leadTemperatures:
              lists.lead_temperatures as Settings['lists']['leadTemperatures'],
          };
        } else {
          console.error(
            'Failed to load list settings:',
            listsResult.reason,
          );
        }

       
        if (
          accountResult.status ===
          'fulfilled'
        ) {
          const account =
            accountResult.value;

          mergedSettings.account = {
            ...mergedSettings.account,

            name:
              account.display_name ||
              mergedSettings.account.name,

            email:
              account.email ||
              mergedSettings.account.email,
          };
        } else {
          console.error(
            'Failed to load account settings:',
            accountResult.reason,
          );
        }

        

        let databaseTeam:
          | TeamMember[]
          | null = null;

        if (
          teamResult.status ===
          'fulfilled'
        ) {
          databaseTeam =
            teamResult.value as TeamMember[];
        } else {
          console.error(
            'Failed to load team members:',
            teamResult.reason,
          );
        }

       

        if (databaseTeam) {
          dispatch({
            type: 'HYDRATE',
            payload: {
              ...loaded,
              team: databaseTeam,
              settings: mergedSettings,
            },
          });
        } else {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: mergedSettings,
          });
        }

        
        previousSettings.current =
          mergedSettings;

        hasHydrated.current = true;
      } catch (error) {
        console.error(
          'Failed to hydrate application state:',
          error,
        );

        
        hasHydrated.current = true;
      } finally {
        isHydrating.current = false;
      }
    };

    hydrateState();

    return () => {
      cancelled = true;
    };
  }, []);

  
  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    saveState(state).catch((error) => {
      console.error(
        'Failed to save local application state:',
        error,
      );
    });
  }, [state]);

  

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    if (isHydrating.current) {
      return;
    }

    const currentSettings =
      state.settings;

    const oldSettings =
      previousSettings.current;

    if (!oldSettings) {
      previousSettings.current =
        currentSettings;

      return;
    }

    const saveSettingsToDatabase =
      async () => {
        try {
          
          const businessChanged =
            JSON.stringify(
              currentSettings.business,
            ) !==
            JSON.stringify(
              oldSettings.business,
            );

          if (businessChanged) {
            await updateBusinessProfile({
              company_name:
                currentSettings.business
                  .name,

              address:
                currentSettings.business
                  .address,

              tax_id:
                currentSettings.business
                  .tin,

              currency:
                currentSettings.invoices
                  .currency,
            });
          }

          

          const invoiceChanged =
            JSON.stringify(
              currentSettings.invoices,
            ) !==
            JSON.stringify(
              oldSettings.invoices,
            );

          if (invoiceChanged) {
            await updateInvoiceSettings({
              prefix:
                currentSettings.invoices
                  .invoicePrefix,

              next_number:
                currentSettings.invoices
                  .nextInvoiceNumber,

              tax_rate:
                currentSettings.invoices
                  .taxRate,

              tax_enabled:
                currentSettings.invoices
                  .taxRate > 0,
            });


            const oldPaymentMethods =
              oldSettings.invoices
                .paymentMethods || [];

            const newPaymentMethods =
              currentSettings.invoices
                .paymentMethods || [];

            const paymentMethodsChanged =
              JSON.stringify(
                oldPaymentMethods,
              ) !==
              JSON.stringify(
                newPaymentMethods,
              );

            if (
              paymentMethodsChanged
            ) {
              const existingMethods =
                await getPaymentMethods();

              // Remove database methods.
              await Promise.all(
                existingMethods.map(
                  (method) =>
                    deletePaymentMethod(
                      method.id,
                    ),
                ),
              );

              // Add current methods.
              await Promise.all(
                newPaymentMethods
                  .filter(
                    (method) =>
                      method.trim() !== '',
                  )
                  .map((method) =>
                    addPaymentMethod({
                      method_type:
                        method,
                      details: '',
                      is_active: true,
                    }),
                  ),
              );
            }
          }

         

          const listsChanged =
            JSON.stringify(
              currentSettings.lists,
            ) !==
            JSON.stringify(
              oldSettings.lists,
            );

          if (listsChanged) {
            await updateListSettings({
              client_types:
                currentSettings.lists
                  .clientTypes,

              lead_stages:
                currentSettings.lists
                  .leadStages,

              lead_temperatures:
                currentSettings.lists
                  .leadTemperatures,
            });
          }

         

          const accountChanged =
            JSON.stringify(
              currentSettings.account,
            ) !==
            JSON.stringify(
              oldSettings.account,
            );

          if (accountChanged) {
            await updateAccountSettings({
              display_name:
                currentSettings.account
                  .name,

              email:
                currentSettings.account
                  .email,
            });
          }

          
          previousSettings.current =
            currentSettings;
        } catch (error) {
          console.error(
            'Failed to save settings to database:',
            error,
          );
        }
      };

    saveSettingsToDatabase();
  }, [state.settings]);

  

  const setView = useCallback(
    (view: View) => {
      dispatch({
        type: 'SET_VIEW',
        payload: view,
      });
    },
    [],
  );

  
  const addClient = useCallback(
    (client: Client) => {
      dispatch({
        type: 'ADD_CLIENT',
        payload: client,
      });
    },
    [],
  );

  const updateClient = useCallback(
    (client: Client) => {
      dispatch({
        type: 'UPDATE_CLIENT',
        payload: client,
      });
    },
    [],
  );

  const deleteClient = useCallback(
    (id: string) => {
      dispatch({
        type: 'DELETE_CLIENT',
        payload: id,
      });
    },
    [],
  );

  

  const addLead = useCallback(
    (lead: Lead) => {
      dispatch({
        type: 'ADD_LEAD',
        payload: lead,
      });
    },
    [],
  );

  const updateLead = useCallback(
    (lead: Lead) => {
      dispatch({
        type: 'UPDATE_LEAD',
        payload: lead,
      });
    },
    [],
  );

  const deleteLead = useCallback(
    (id: string) => {
      dispatch({
        type: 'DELETE_LEAD',
        payload: id,
      });
    },
    [],
  );

  const moveLead = useCallback(
    (
      id: string,
      stage: LeadStage,
    ) => {
      dispatch({
        type: 'MOVE_LEAD',
        payload: {
          id,
          stage,
        },
      });
    },
    [],
  );

  

  const addInvoice = useCallback(
    (invoice: Invoice) => {
      dispatch({
        type: 'ADD_INVOICE',
        payload: invoice,
      });
    },
    [],
  );

  const updateInvoice = useCallback(
    (invoice: Invoice) => {
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: invoice,
      });
    },
    [],
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      dispatch({
        type: 'DELETE_INVOICE',
        payload: id,
      });
    },
    [],
  );

  

  const addReceipt = useCallback(
    (receipt: Receipt) => {
      dispatch({
        type: 'ADD_RECEIPT',
        payload: receipt,
      });
    },
    [],
  );

  

  const addTeamMember =
    useCallback(
      async (member: TeamMember) => {
        try {
          const saved =
            await addTeamMemberApi({
              name: member.name,
              email: member.email,
              role: member.role,
              avatar: member.avatar,
              status: member.status,
            });

          const databaseMember:
            TeamMember = {
            ...member,

            id: String(
              saved.id,
            ),

            tasks:
              saved.tasks || [],
          };

          dispatch({
            type: 'ADD_TEAM_MEMBER',
            payload: databaseMember,
          });
        } catch (error) {
          console.error(
            'Failed to save team member:',
            error,
          );

          // Keep the UI functional if
          // the backend is unavailable.
          dispatch({
            type: 'ADD_TEAM_MEMBER',
            payload: member,
          });
        }
      },
      [],
    );

  const updateTeamMember =
    useCallback(
      async (member: TeamMember) => {
        try {
          const saved =
            await updateTeamMemberApi(
              Number(member.id),
              {
                name: member.name,
                email: member.email,
                role: member.role,
                avatar: member.avatar,
                status: member.status,
              },
            );

          dispatch({
            type: 'UPDATE_TEAM_MEMBER',
            payload: {
              ...member,

              id: String(
                saved.id,
              ),

              tasks:
                saved.tasks ||
                member.tasks,
            },
          });
        } catch (error) {
          console.error(
            'Failed to update team member:',
            error,
          );

          dispatch({
            type: 'UPDATE_TEAM_MEMBER',
            payload: member,
          });
        }
      },
      [],
    );

  const deleteTeamMember =
    useCallback(
      async (id: string) => {
        try {
          await deleteTeamMemberApi(
            Number(id),
          );

          dispatch({
            type: 'DELETE_TEAM_MEMBER',
            payload: id,
          });
        } catch (error) {
          console.error(
            'Failed to delete team member:',
            error,
          );
        }
      },
      [],
    );

 

  const addTask = useCallback(
    async (
      memberId: string,
      task: Task,
    ) => {
      try {
        const saved =
          await addTeamMemberTaskApi(
            Number(memberId),
            {
              title: task.title,
              status: task.status,
              assignedAt:
                task.assignedAt,
            },
          );

        const databaseTask:
          Task = {
          ...task,

          id: String(
            saved.id,
          ),
        };

        dispatch({
          type: 'ADD_TASK',
          payload: {
            memberId,
            task: databaseTask,
          },
        });
      } catch (error) {
        console.error(
          'Failed to save team task:',
          error,
        );

        dispatch({
          type: 'ADD_TASK',
          payload: {
            memberId,
            task,
          },
        });
      }
    },
    [],
  );

  const updateTask =
    useCallback(
      async (
        memberId: string,
        task: Task,
      ) => {
        try {
          const saved =
            await updateTeamMemberTaskApi(
              Number(memberId),
              Number(task.id),
              {
                title: task.title,
                status: task.status,
                assignedAt:
                  task.assignedAt,
              },
            );

          const databaseTask:
            Task = {
            ...task,

            id: String(
              saved.id,
            ),
          };

          dispatch({
            type: 'UPDATE_TASK',
            payload: {
              memberId,
              task: databaseTask,
            },
          });
        } catch (error) {
          console.error(
            'Failed to update team task:',
            error,
          );

          dispatch({
            type: 'UPDATE_TASK',
            payload: {
              memberId,
              task,
            },
          });
        }
      },
      [],
    );

  const deleteTask =
    useCallback(
      async (
        memberId: string,
        taskId: string,
      ) => {
        try {
          await deleteTeamMemberTaskApi(
            Number(memberId),
            Number(taskId),
          );

          dispatch({
            type: 'DELETE_TASK',
            payload: {
              memberId,
              taskId,
            },
          });
        } catch (error) {
          console.error(
            'Failed to delete team task:',
            error,
          );
        }
      },
      [],
    );



  const addMessage = useCallback(
    (message: Message) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: message,
      });
    },
    [],
  );

  const pinMessage = useCallback(
    (id: string) => {
      dispatch({
        type: 'PIN_MESSAGE',
        payload: id,
      });
    },
    [],
  );

  const unpinMessage =
    useCallback(
      (id: string) => {
        dispatch({
          type: 'UNPIN_MESSAGE',
          payload: id,
        });
      },
      [],
    );

  
  const updateSettings =
    useCallback(
      (
        settings: Partial<Settings>,
      ) => {
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: settings,
        });
      },
      [],
    );



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
    updateTask,
    deleteTask,

  
    addMessage,
    pinMessage,
    unpinMessage,

   
    updateSettings,
  };
}
