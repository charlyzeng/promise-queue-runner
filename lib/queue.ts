import { PromiseGenerator } from './interface';

export interface PopItem<T> {
  index: number,
  promise: Promise<T>
}

export class Queue<T> {
  private promiseGenerators: PromiseGenerator<T>[] = [];
  private counter = -1;

  constructor(promiseGenerators: PromiseGenerator<T>[]) {
    this.promiseGenerators = promiseGenerators;
  }

  public count(): number {
    return this.promiseGenerators.length;
  }

  public pop(): PopItem<T> {
    const pg = this.promiseGenerators.shift();
    if (pg) {
      this.counter += 1;
      return {
        index: this.counter,
        promise: pg()
      };
    }
    return null;
  }

  public push(pg: PromiseGenerator<T>): void {
    this.promiseGenerators.push(pg);
  }
}
