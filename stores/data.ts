import localforage from "localforage";
import { defineStore } from "pinia";

export interface Item {
  text: string;
  emoji: string;
  description: string;
  discovered: boolean;
  recipes: [string, string][];
}

export interface Data {
  items: Item[];
}

const defaultData: Data = {
  items: [
    {
      text: "Water",
      emoji: "💧",
      description: "A clear liquid essential for life.",
      discovered: false,
      recipes: [],
    },
    {
      text: "Fire",
      emoji: "🔥",
      description: "A powerful burning substance.",
      discovered: false,
      recipes: [],
    },
    {
      text: "Earth",
      emoji: "🌱",
      description: "The foundation of our planet's surface.",
      discovered: false,
      recipes: [],
    },
    {
      text: "Air",
      emoji: "💨",
      description: "The invisible gaseous element surrounding us.",
      discovered: false,
      recipes: [],
    },
  ],
};

export const useDataStore = defineStore("data", {
  state: () =>
    ({
      items: [],
      recipes: [],
    }) as Data,
  actions: {
    async updateData() {
      const { items } = JSON.parse(
        (await localforage.getItem("data")) || JSON.stringify(defaultData),
      );

      this.items = items;

      await localforage.setItem("data", JSON.stringify(this.$state));
    },
    async addItem(item: Item) {
      const existingItem = this.items.findIndex((i) => i.text === item.text);

      if (existingItem > -1) {
        if (
          !this.items[existingItem].recipes.find(
            (i) => i[0] === item.recipes[0][0] && i[1] === item.recipes[0][1],
          )
        ) {
          return this.items[existingItem].recipes.push(item.recipes[0]);
        }
        return;
      }

      this.items.push(item);

      await localforage.setItem("data", JSON.stringify(this.$state));
    },
  },
});
