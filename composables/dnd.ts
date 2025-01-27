import { storeToRefs } from "pinia";
import type { Item } from "@/stores/data";

export const useDnD = () => {
  const boardStore = useBoardStore();

  const { addOffset, createInstance, clearInstances } = boardStore;
  const { offset, instances, initialPos, panning } = storeToRefs(boardStore);

  const sidebarRefStore = useSidebarRef();
  const { ref: sidebarRef } = storeToRefs(sidebarRefStore);

  const dataStore = useDataStore();
  const { addItem } = dataStore;

  function detectCollision(elA: Element, elB: Element) {
    const a = elA.getBoundingClientRect();
    const b = elB.getBoundingClientRect();
    return !(
      a.y + a.height < b.y ||
      a.y > b.y + b.height ||
      a.x + a.width < b.x ||
      a.x > b.x + b.width
    );
  }

  async function wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  function spawnAtMiddle(text: string, emoji: string) {
    return createInstance(
      text,
      emoji,
      (window.innerWidth -
        96 -
        (sidebarRef.value?.getBoundingClientRect().width || 0)) /
        2 -
        (Math.random() + 0.5) * 50,
      window.innerHeight / 2 - (Math.random() + 0.5) * 50,
      false,
    );
  }

  function handleInstanceDown(e: MouseEvent, i: number) {
    if (instances.value[i].loading || e.shiftKey) return;

    if (e.button === 2) return instances.value.splice(i, 1);
    if (e.button === 1 || e.ctrlKey) {
      return createInstance(
        instances.value[i].text,
        instances.value[i].emoji,
        instances.value[i].x,
        instances.value[i].y,
        true,
      );
    }

    instances.value[i].initialX = e.clientX;
    instances.value[i].initialY = e.clientY;
    instances.value.map((inst) => (inst.z = 0));
    instances.value[i].z = 2;
    instances.value[i].dragging = true;
  }
  function handleInstanceMove(e: MouseEvent) {
    const dragging = instances.value.findIndex((inst) => inst.dragging);

    if (dragging > -1) {
      if (instances.value[dragging].initialX === 0) {
        instances.value[dragging].initialX = e.clientX;
        return (instances.value[dragging].initialY = e.clientY);
      } else {
        const offsetX = e.clientX - instances.value[dragging].initialX;
        const offsetY = e.clientY - instances.value[dragging].initialY;

        instances.value[dragging].x += offsetX;
        instances.value[dragging].y += offsetY;

        instances.value[dragging].initialX = e.clientX;
        instances.value[dragging].initialY = e.clientY;
      }
    }
  }
  async function handleInstanceUp() {
    const draggingKey = instances.value.find((inst) => inst.dragging)?.key;

    if (!draggingKey) return;

    const dragging = instances.value.find((inst) => inst.key === draggingKey);

    if (dragging && dragging.ref && sidebarRef.value) {
      if (detectCollision(dragging.ref.$el, sidebarRef.value)) {
        const draggingInstanceCopy = dragging;
        instances.value.splice(
          instances.value.findIndex((inst) => inst.key === draggingKey),
          1,
        );
        if (draggingInstanceCopy.initialX === 0) {
          return spawnAtMiddle(
            draggingInstanceCopy.text,
            draggingInstanceCopy.emoji,
          );
        }
      } else {
        instances.value[
          instances.value.findIndex((inst) => inst.key === draggingKey)
        ].dragging = false;
      }
      instances.value.forEach(async (inst) => {
        if (
          inst.loading ||
          instances.value.find((inst2) => inst2.key === draggingKey)?.loading ||
          inst.key === dragging.key
        )
          return;

        if (detectCollision(inst.ref?.$el, dragging.ref?.$el)) {
          inst.loading = true;
          instances.value.map(
            (inst) => inst.key === draggingKey && (inst.loading = true),
          );

          const recipe = [inst.text, dragging.text].sort();

          const result: {
            text: string;
            emoji: string;
            description: string;
            discovered: boolean;
          } = await $fetch("/api/items/pair", {
            method: "POST",
            body: {
              recipe: recipe as [string, string],
            },
          });

          const avgPos = {
            x: (inst.x + dragging.x) / 2,
            y: (inst.y + dragging.y) / 2,
          };

          if (!result.text || result.text === "SPECIAL::ERR") {
            inst.loading = false;
            return instances.value.map(
              (inst) => inst.key === draggingKey && (inst.loading = false),
            );
          }

          instances.value = instances.value.filter(
            (inst2) => inst2.key !== draggingKey && inst2.key !== inst.key,
          );

          createInstance(result.text, result.emoji, avgPos.x, avgPos.y, false);
          addItem({
            ...result,
            recipes: [recipe as [string, string]],
          });
        }
      });
    }
  }

  function handleItemDown(e: MouseEvent, item: Item, ref: Element) {
    if (e.button !== 0) return;

    createInstance(
      item.text,
      item.emoji,
      ref.getBoundingClientRect().left - 96,
      ref.getBoundingClientRect().top,
      true,
    );
  }

  return {
    handleInstanceDown,
    handleInstanceMove,
    handleInstanceUp,
    handleItemDown,
  };
};
