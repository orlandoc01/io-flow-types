//@flow
import * as assert from 'assert';
import * as t from '../src';
import { PathReporter } from '../src/PathReporter';

describe('PathReporter', () => {
  it('should use the function name as error message', () => {
    assert.deepEqual(PathReporter.report(t.Number.decode(function() {})), [
      'Invalid value <function0> supplied to : number'
    ]);
    assert.deepEqual(PathReporter.report(t.Number.decode(function f() {})), ['Invalid value f supplied to : number']);
  });

  it('should say something whene there are no errors', () => {
    assert.deepEqual(PathReporter.report(t.Number.decode(1)), ['No errors!']);
  });
});
