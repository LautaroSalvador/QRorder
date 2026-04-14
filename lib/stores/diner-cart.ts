"use client";

import { create } from "zustand";

import type { DinerMenuCategory, DinerOrderResponse } from "@/lib/validations/diner";

type DinerMenuItem = DinerMenuCategory["items"][number];
type DinerOrderItem = DinerOrderResponse["items"][number];

type DinerCartStore = {
  items: DinerOrderItem[];
  selectedItem: DinerMenuItem | null;
  selectedTableId: string | null;
  sessionId: string | null;
  isItemDialogOpen: boolean;
  setOrderSnapshot: (order: DinerOrderResponse) => void;
  openItemDialog: (item: DinerMenuItem) => void;
  closeItemDialog: () => void;
  resetCart: () => void;
};

export const useDinerCartStore = create<DinerCartStore>((set) => ({
  items: [],
  selectedItem: null,
  selectedTableId: null,
  sessionId: null,
  isItemDialogOpen: false,
  setOrderSnapshot: (order) =>
    set({
      items: order.items,
      selectedTableId: order.table.id,
      sessionId: order.sessionId,
    }),
  openItemDialog: (item) =>
    set({
      isItemDialogOpen: true,
      selectedItem: item,
    }),
  closeItemDialog: () =>
    set({
      isItemDialogOpen: false,
      selectedItem: null,
    }),
  resetCart: () =>
    set({
      isItemDialogOpen: false,
      items: [],
      selectedItem: null,
      selectedTableId: null,
      sessionId: null,
    }),
}));
