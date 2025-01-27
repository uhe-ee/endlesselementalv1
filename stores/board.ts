import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

interface Instance {
  text: string;
  emoji: string;
  x: number;
  y: number;
  z: number;
  key: string;
  initialX: number;
  initialY: number;
  ref: ComponentPublicInstance | null;
  dragging: boolean;
  loading: boolean;
}

interface Board {
  offset: {
    x: number;
    y: number;
  };
  initialPos: {
    x: number;
    y: number;
  };
  panning: boolean;
  instances: Instance[];
}

export const useBoardStore = defineStore("board", {
  state: () =>
    ({
      offset: {
        x: 0,
        y: 0,
      },
      initialPos: {
        x: 0,
        y: 0,
      },
      panning: false,
      instances: [],
    }) as Board,
  actions: {
    createInstance(
      text: string,
      emoji: string,
      x: number,
      y: number,
      dragging: boolean,
    ) {
      this.instances.map((inst) => (inst.z = 0));
      this.instances.push({
        text,
        emoji,
        x,
        y,
        z: 2,
        key: uuidv4(),
        initialX: 0,
        initialY: 0,
        ref: null,
        dragging,
        loading: false,
      });
    },
    clearInstances() {
      this.instances = [];
    },
    addOffset(x: number, y: number) {
      this.instances.map((inst) => (inst.z = 0));
      this.offset.x += x;
      this.offset.y += y;
      this.instances.map((inst) => {
        inst.x += x;
        inst.y += y;
        return inst;
      });
    },
  },
});
