<script lang="ts" setup>
import { onClickOutside, type MaybeElement } from "@vueuse/core";

const modalStore = useModalStore();
const { name } = storeToRefs(modalStore);

const dataStore = useDataStore();
const { items } = storeToRefs(dataStore);

const item = computed(() => items.value.find((i) => i.text === name.value));

const target: Ref<MaybeElement | null> = ref(null);

onClickOutside(target, (e) => (name.value = null));
</script>

<template>
  <div
    v-if="name && item"
    class="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/50"
  >
    <div
      class="flex w-[70dvw] flex-col items-center gap-2 rounded bg-[--blue-secondary] p-4 text-center"
      :ref="(el) => (target = el as MaybeElement)"
    >
      <h1 class="text-2xl font-semibold">{{ item.emoji }} {{ item.text }}</h1>
      <span>{{ item.description }}</span>
      <div class="flex flex-col items-center gap-2">
        <div
          v-for="recipe in item.recipes"
          :key="`${recipe[0]} + ${recipe[1]}`"
          class="flex items-center gap-1"
        >
          <Item
            :text="recipe[0]"
            :emoji="items.find((i) => i.text === recipe[0])?.emoji || ''"
          />
          +
          <Item
            :text="recipe[1]"
            :emoji="items.find((i) => i.text === recipe[1])?.emoji || ''"
          />
        </div>
      </div>
    </div>
  </div>
</template>
