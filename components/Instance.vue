<script setup lang="ts">
const { text, emoji, x, y, z, loading } = defineProps<{
  text: string;
  emoji: string;
  x: number;
  y: number;
  z: number;
  loading: boolean;
}>();
</script>

<template>
  <div
    class="absolute left-0 top-0 rounded border border-[--blue-secondary-hover] bg-[--blue-secondary] p-2"
    :class="{
      'animate-pulse': loading,
      'cursor-pointer hover:bg-gradient-to-b hover:from-[--blue-secondary] hover:to-[--blue-secondary-hover]':
        !loading,
    }"
    :style="{
      translate: `${x}px ${y}px`,
      zIndex: z,
    }"
  >
    {{ emoji }} {{ text }}
  </div>
</template>
