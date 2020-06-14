import { expect } from 'chai';
import { Runner } from '../lib/runner';

function getPromiseGenerators() {
  const generators = [];
  for (let i = 0; i < 100; i += 1) {
    generators.push(
      () => new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(i);
        }, 10);
      })
    )
  }
  return generators;
}

describe('lib/runner.ts', function() {
  it('`runner` queue should not modify the param `promiseGenerators`', function(done) {
    const generators = getPromiseGenerators();
    const { length } = generators;
    const runner = new Runner({
      maxConcurrency: 3,
      promiseGenerators: generators
    });
    runner.addListener(Runner.FINISHED, () => {
      expect(generators.length).to.equal(length);
      done();
    });
    runner.start();
  });

  it('`progress` and `finished` event should be ok', function(done) {
    const generators = getPromiseGenerators();
    const runner = new Runner({
      maxConcurrency: 3,
      promiseGenerators: generators
    });
    
    runner.start();
    const progressResults = [];
    const compare = [];
    let finish = 0;
    for (let i = 1; i <= 100; i += 1) {
      compare.push(i);
    }
    runner.addListener(Runner.PROGRESS, (data) => {
      progressResults.push(data.finish);

      expect(data.finish).to.be.equal(++finish);
    });
    runner.addListener(Runner.FINISHED, (results) => {
      expect(progressResults).to.be.deep.equal(compare);
      expect(Object.keys(results).map(i => Number(i) + 1)).to.be.deep.equal(compare);
      expect(Object.values(results).map(item => (item as any).value + 1)).to.be.deep.equal(compare);
      done();
    });
  });

  it('`maxConcurrency` should effect', function(done) {
    const generators = getPromiseGenerators();
    const maxConcurrency = 5;
    const runner = new Runner({
      maxConcurrency,
      promiseGenerators: generators
    });
    runner.addListener(Runner.PROGRESS, () => {
      expect((runner as any).runningTasks.length).to.be.lte(maxConcurrency - 1);
    });
    runner.addListener(Runner.FINISHED, () => {
      done();
    });
    runner.start();
  });

  it('listener remover should effect', function(done) {
    const generators = getPromiseGenerators();
    const maxConcurrency = 5;
    const runner = new Runner({
      maxConcurrency,
      promiseGenerators: generators
    });
    let execed1 = false;
    const progressRemover1 = runner.addListener(Runner.PROGRESS, () => {
      execed1 = true;
    });
    let execed2 = false;
    runner.addListener(Runner.PROGRESS, () => {
      execed2 = true;
    });
    let execed3 = false;
    const progressRemover3 = runner.addListener(Runner.PROGRESS, () => {
      execed3 = true;
    });
    progressRemover1();
    progressRemover3();
    runner.addListener(Runner.FINISHED, () => {
      expect(execed1).to.be.false;
      expect(execed2).to.be.true;
      expect(execed3).to.be.false;
      done();
    });
    runner.start();
  });

  it('`stop` should effect', function(done) {
    const generators = getPromiseGenerators();
    const runner = new Runner({
      maxConcurrency: 3,
      promiseGenerators: generators
    });
    runner.start();
    const startAt = Date.now();
    setTimeout(() => {
      runner.stop().then((result) => {
        expect(result).to.be.true;
        const endAt = Date.now();
        console.log(endAt - startAt);
        done();
      });
    }, 100);
  });
});
