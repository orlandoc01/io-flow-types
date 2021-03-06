//@flow
import type { Validation } from './index';

export interface Reporter<A> {
  report: (validation: Validation<any>) => A;
}
