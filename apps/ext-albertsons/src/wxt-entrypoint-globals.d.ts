declare function defineBackground(
  bootstrap: () => void | Promise<void>
): () => void | Promise<void>;

declare function defineContentScript<
  T extends { matches: string[]; main: () => void | Promise<void> },
>(definition: T): T;
