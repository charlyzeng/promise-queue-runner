# PromiseQueueRunner
A pure JavaScript module with no dependencies, that aims to parallelly run promise list with ***max concurrency*** by a run queue. 

# Features
- No dependencies
- Support NodeJS and Browser
- Support `progress`,`finished` event

# Installing
Using npm:
```bash
npm install promise-queue-runner
```

Using yarn:
```bash
yarn add promise-queue-runner
```

# Example

## Import

### Import By CommonJS
In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use the following approach:

```javascript
const Runner = require('promise-queue-runner').default;
// or
const { Runner } = require('promise-queue-runner');
```

### Import By ES6 Module
```javascript
import { Runner } from 'promise-queue-runner';
// or
import Runner from 'promise-queue-runner';
```

## Run
```javascript
const promiseGenerators = [];
for (let i = 0; i < 100; i += 1) {
  promiseGenerators.push(
    () => new Promise(
      (resolve, reject) => {
        // do something
        resolve('value');
      }
    )
  );
}
const runner = new Runner({
  promiseGenerators,
  maxConcurrency: 5
});
runner.addListener(
  Runner.PROGRESS,
  /**
   * @param {Number} finish - count of promise that has been run current
   * @param {Object} latestResult - the result of latest promise that has been run
   * @param {Object} results - the results of all promise that has been run
   */
  ({ finish, latestResult, results }) => {
    console.log(latestRusult);
    console.log(results);
    // results example
    // {
    //   0: { error: null, value: 'value1' },
    //   1: { error: null, value: 'value2' }
    // }
    console.log(`progress: ${finish} / ${promiseGenerators.length}`);
  }
);
runner.addListener(
  Runner.FINISHED,
  (results) => {
    // `results` is same as the results of `PROGRESS` event callback
    console.log(results);
  }
);
runner.start();
```

# License

[MIT](LICENSE)
