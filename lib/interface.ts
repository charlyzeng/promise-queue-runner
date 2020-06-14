export interface PromiseGenerator<T> {
  (): Promise<T>;
}
