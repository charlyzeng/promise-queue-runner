import { Queue, PopItem } from './queue';
import { PromiseGenerator } from './interface';

interface RunnerConfig<T> {
  maxConcurrency: number,
  promiseGenerators: PromiseGenerator<T>[],
  [propName: string]: unknown
}

interface Result<T> {
  error: unknown,
  value?: T
}

interface Results<T> {
  [key: number]: Result<T>
}

interface ListenerRemover {
  (): boolean;
}

interface FinishedCallback<T> {
  (results: Results<T>): void;
}

interface ProgressCallbackParam<T> {
  finish: number,
  results: Results<T>,
  latestResult: Result<T>
}

interface ProgressCallback<T> {
  (param: ProgressCallbackParam<T>): void;
}

type ListenerCallback<T> = ProgressCallback<T> | FinishedCallback<T>;

export class Runner<T> {
  static readonly PROGRESS = 'progress';
  static readonly FINISHED = 'finished';

  private stoped = false;
  private finish = 0; // count of finished promises
  private stopResolve = null; // resolve callback of `stop` method
  private config: RunnerConfig<T> = null;
  private queue: Queue<T> = null;
  private results: Results<T> = {};
  private runningTasks: PopItem<T>[] = [];
  private progressCallbacks: ProgressCallback<T>[] = [];
  private finishedCallbacks: FinishedCallback<T>[] = [];

  constructor(config: RunnerConfig<T>) {
    this.config = config;
    this.queue = new Queue(config.promiseGenerators.slice());
  }

  public isStoped(): boolean {
    return this.stoped;
  }

  public start(): void {
    this.stoped = false;
    const { maxConcurrency } = this.config;
    const runningCount = this.runningTasks.length;
    for (let i = 0; i < maxConcurrency - runningCount; i += 1) {
      this.execOnce();
    }
  }

  public stop(): Promise<boolean> {
    if (this.stoped) {
      return Promise.resolve(true);
    }
    if (this.runningTasks.length === 0) {
      this.stoped = true;
      return Promise.resolve(true);
    }
    this.stoped = true;
    return new Promise((resolve) => {
      this.stopResolve = resolve;
    });
  }

  public addListener(eventName: string, callback: ListenerCallback<T>): ListenerRemover {
    switch(eventName) {
      case Runner.PROGRESS: {
        this.progressCallbacks.push(callback as ProgressCallback<T>);
        return () => {
          const index = this.progressCallbacks.indexOf(callback as ProgressCallback<T>);
          if (index > -1) {
            this.progressCallbacks.splice(index, 1);
            return true;
          }
          return false;
        };
      }
      case Runner.FINISHED: {
        this.finishedCallbacks.push(callback as FinishedCallback<T>);
        return () => {
          const index = this.finishedCallbacks.indexOf(callback as FinishedCallback<T>);
          if (index > -1) {
            this.finishedCallbacks.splice(index, 1);
            return true;
          }
          return false;
        };
      }
      default: {
        console.warn(`can not listen the event: ${eventName}`);
        return () => false;
      }
    }
  }

  private execOnce() {
    if (this.stoped) {
      if (this.runningTasks.length === 0 && this.stopResolve) {
        this.stopResolve(true);
        this.stopResolve = null;
      }
      return;
    }

    const popItem = this.queue.pop();
    if (!popItem) {
      return;
    }
    const { index, promise } = popItem;
    this.runningTasks.push(popItem);

    const done = (result) => {
      this.results[index] = result;
      this.finish += 1;
      const taskIndex = this.runningTasks.indexOf(popItem);
      if (taskIndex > -1) {
        this.runningTasks.splice(taskIndex, 1);
      }

      for (let i = 0; i < this.progressCallbacks.length; i += 1) {
        try {
          this.progressCallbacks[i]({
            finish: this.finish,
            results: { ...this.results },
            latestResult: result
          });
        } catch (error) {
          console.error(error);
        }
      }

      if (this.queue.count() > 0) {
        for (let i = 0; i < this.config.maxConcurrency - this.runningTasks.length; i += 1) {
          this.execOnce();
        }
      } else if (this.runningTasks.length === 0) {
        for (let i = 0; i < this.finishedCallbacks.length; i += 1) {
          try {
            this.finishedCallbacks[i]({ ...this.results })
          } catch (error) {
            console.error(error);
          }
        }
      }
    };

    promise.then(
      (value) => {
        const result = {
          value,
          error: null
        };
        done(result);
      },
      (error) => {
        const result = { error };
        done(result);
      }
    );
  }
}

export default Runner;
