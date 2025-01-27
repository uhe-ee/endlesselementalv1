<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDataStore, type Item } from "@/stores/data";
import { useSidebarRef } from "@/stores/sidebarRef";

interface ItemRefs {
  [key: number]: Element;
}

const dataStore = useDataStore();
const { updateData } = dataStore;
const { items } = storeToRefs(dataStore);
const itemRefs: ItemRefs = {};

const refStore = useSidebarRef();
const { ref: sidebarRef } = storeToRefs(refStore);

const width = ref(300);
const resizing = ref(false);
const initialX = ref(0);

const query = ref("");
const sortBy = ref("newest");
const sortedItems = computed(() => {
  if (!items.value) return [];
  if (sortBy.value === "newest") return items.value;
  if (sortBy.value === "alphabetical") {
    return items.value.toSorted((a, b) => {
      return [a.text, b.text].sort()[0] === a.text ? -1 : 1;
    });
  }
  return [];
});
const filteredItems = computed(() => {
  if (!sortedItems.value) return [];
  if (!query.value) return sortedItems.value;

  const chunkOne = sortedItems.value
    .filter(
      (item) =>
        item.text.toLowerCase().indexOf(query.value.toLowerCase()) === 0,
    )
    .toSorted((a, b) => {
      return [a.text, b.text].sort()[0] === a.text ? -1 : 1;
    });
  const chunkTwo = sortedItems.value.filter(
    (item) => item.text.toLowerCase().indexOf(query.value.toLowerCase()) > 0,
  );

  return [...chunkOne, ...chunkTwo];
});

const { handleItemDown } = useDnD();

function resizeDown(e: MouseEvent) {
  resizing.value = true;
  initialX.value = e.clientX;
}
function resizeMove(e: MouseEvent) {
  if (resizing.value) {
    width.value = Math.max(
      Math.min(width.value + initialX.value - e.clientX, window.innerWidth / 3),
      250,
    );
    initialX.value = window.innerWidth - width.value;
  }
}

onMounted(async () => {
  document.addEventListener("mousemove", resizeMove);
  document.addEventListener("mouseup", () => (resizing.value = false));
  window.addEventListener(
    "resize",
    () =>
      (width.value = Math.max(
        Math.min(width.value, window.innerWidth / 3),
        250,
      )),
  );
  await updateData();
});
</script>

<template>
  <div
    class="relative z-[1] flex h-full flex-col rounded-l bg-[--blue-secondary]"
    :style="{
      width: width + 'px',
    }"
    :ref="(el) => el && (sidebarRef = el as Element)"
  >
    <div
      class="absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-ew-resize"
      @mousedown="resizeDown"
    ></div>
    <div class="flex flex-1 flex-wrap content-start gap-2 overflow-auto p-2">
      <div
        v-for="(item, index) in filteredItems"
        :ref="(el) => el && (itemRefs[index] = el as Element)"
      >
        <Item
          v-bind="{
            text: item.text,
            emoji: item.emoji,
          }"
          @mousedown="
            (e: MouseEvent) => handleItemDown(e, item, itemRefs[index])
          "
        />
      </div>
    </div>
    <div class="flex h-12 w-full rounded-t border-l-2 bg-white">
      <select class="flex flex-1 bg-transparent" v-model="sortBy">
        <option value="newest">Newest</option>
        <option value="alphabetical">Alphabetical</option>
      </select>
    </div>
    <input
      class="w-full rounded-t border-l-2 border-t-2 border-[--blue-secondary] p-2 focus:outline-none"
      :placeholder="`Search (${items.length}) items...`"
      v-model="query"
    />
  </div>
</template>
