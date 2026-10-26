export type Event = {
  [key: string]: any;
};

type Listener = (data: Event) => void;

const listeners: Record<string, Listener[]> = {};

export function emit(event: string, data: Event) {
  if (listeners[event]) {
    listeners[event].forEach((listener) => listener(data));
  }
}

export function on(event: string, listener: Listener) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(listener);
}

export function off(event: string, listener: Listener) {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter((l) => l !== listener);
  }
}
