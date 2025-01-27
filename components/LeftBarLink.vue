<script setup lang="ts">
const { name, icon, link } = defineProps<{
  name: string;
  icon: string;
  link: string;
}>();
</script>

<template>
  <NuxtLink
    :to="link"
    class="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded bg-[--blue-secondary-hover] p-2"
    :class="{ 'text-xs': name.length > 5 }"
  >
    <Icon :name="icon" size="2rem" />
    {{ name }}
  </NuxtLink>
</template>
