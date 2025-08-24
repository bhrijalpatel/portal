"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type DialogAction =
  | "update"
  | "delete"
  | "ban"
  | "unban"
  | "make-admin"
  | "remove-admin";

interface DialogState {
  isOpen: boolean;
  action: DialogAction;
  userId: string | null;
}

interface DialogContextType {
  dialogState: DialogState;
  openDialog: (userId: string, action: DialogAction) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogStateProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: "update",
    userId: null,
  });

  const openDialog = (userId: string, action: DialogAction) => {
    console.log(`🎭 Opening dialog for user ${userId}, action: ${action}`);
    setDialogState({
      isOpen: true,
      action,
      userId,
    });
  };

  const closeDialog = () => {
    console.log(`🎭 Closing dialog for user ${dialogState.userId}`);
    setDialogState({
      isOpen: false,
      action: "update",
      userId: null,
    });
  };

  return (
    <DialogContext.Provider value={{ dialogState, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialogState() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialogState must be used within a DialogStateProvider");
  }
  return context;
}
