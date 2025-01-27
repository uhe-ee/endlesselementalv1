<script setup lang="ts">
const modalStore = useModalStore();
const { name } = storeToRefs(modalStore);

const { text, emoji } = defineProps<{
  text: string;
  emoji: string;
}>();
</script>

<template>
  <div
    class="h-fit w-fit cursor-pointer rounded border border-[--blue-secondary-hover] bg-[--blue-secondary] p-2 hover:bg-gradient-to-b hover:from-[--blue-secondary] hover:to-[--blue-secondary-hover]"
    @contextmenu="() => (name = text)"
  >
    {{ emoji }} {{ text }}
  </div>
</template>
