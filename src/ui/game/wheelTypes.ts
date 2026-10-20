export interface WheelOptions {
  letters: string[];
  onChange(word: string): void;
  onSubmit(word: string): void;
  onSelect?(count: number): void;
  onShuffleKey?(): void;
}

export interface WheelView {
  el: HTMLElement;
  setLetters(letters: string[], animate: boolean): void;
  setEnabled(enabled: boolean): void;
  cancel(): void;
  letterRects(indexes: number[]): DOMRect[];
  destroy(): void;
}
