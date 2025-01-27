<script setup lang="ts">
import localforage from "localforage";

const boardStore = useBoardStore();

const { addOffset, createInstance, clearInstances } = boardStore;
const { offset, instances, initialPos, panning } = storeToRefs(boardStore);

const { handleInstanceDown, handleInstanceMove, handleInstanceUp } = useDnD();

function handleBoardDown(e: MouseEvent) {
  if (!e.shiftKey) return;
  panning.value = true;
  initialPos.value.x = e.clientX;
  initialPos.value.y = e.clientY;
}
function handleBoardMove(e: MouseEvent) {
  if (panning.value) {
    const offsetPos = {
      x: e.clientX - initialPos.value.x,
      y: e.clientY - initialPos.value.y,
    };
    addOffset(offsetPos.x, offsetPos.y);
    initialPos.value.x = e.clientX;
    initialPos.value.y = e.clientY;
  }
}

async function handleReset() {
  const confirmReset = window.confirm(
    "Are you sure? This will delete all your progress!",
  );

  if (confirmReset) {
    await localforage.removeItem("data");
    window.location.reload();
  }
}

onMounted(() => {
  document.addEventListener("mousemove", handleInstanceMove);
  document.addEventListener("mousemove", handleBoardMove);
  document.addEventListener("mouseup", () => (panning.value = false));
  document.addEventListener("mouseup", handleInstanceUp);
  document.addEventListener("contextmenu", (e) => e.preventDefault());
});
onUnmounted(() => {
  clearInstances();
});
</script>

<template>
  <div
    id="grid"
    class="relative h-full w-full flex-1"
    :style="{
      backgroundPosition: `${offset.x - 1}px ${offset.y - 1}px`,
    }"
    @mousedown="handleBoardDown"
  >
    <div class="absolute bottom-1 left-1" @click="handleReset">Reset</div>
    <div class="absolute bottom-1 right-1 flex">
      <button @click="clearInstances">
        <Icon
          name="material-symbols:cleaning-services-outline-rounded"
          class="h-12 w-12"
        />
      </button>
    </div>
    <Instance
      v-for="(inst, index) in instances"
      v-bind="{
        text: inst.text,
        emoji: inst.emoji,
        x: inst.x,
        y: inst.y,
        z: inst.z,
        loading: inst.loading,
      }"
      :ref="
        (el) => {
          inst.ref = el as ComponentPublicInstance;
        }
      "
      @mousedown="(e) => handleInstanceDown(e, index)"
    />
  </div>
</template>

<style scoped>
#grid {
  background-image: linear-gradient(
      90deg,
      rgb(0 0 0 / 0.1) 1px,
      transparent 1px
    ),
    linear-gradient(180deg, rgb(0 0 0 / 0.1) 1px, transparent 1px);
  background-size: 60px 60px;
}
</style>
