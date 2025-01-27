import { defineStore } from "pinia";

export const useSidebarRef = defineStore("sidebarRef", {
  state: () =>
    ({
      ref: null,
    }) as {
      ref: Element | null;
    },
});
