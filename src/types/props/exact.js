//@flow
import type { Props, Obj } from './base.js';
import { PropsType, empty, getNameFromProps } from './base.js';
import { InexactPropsType } from './inexact.js';
import type { MixedFlowType, Is, Validate, Context, Encode } from '../index.js';

type ExactObj<Required: Props, Optional: Props> = $Rest<
  {| ...$Exact<Required>, ...$Exact<Optional> |},
  $Rest<Optional, {}>
>;

export class ExactPropsType<P: Props, A: Obj, O: Obj, I> extends PropsType<P, A, O, I> {
  constructor(
    name: string,
    props: P,
    required: $ReadOnlyArray<$Keys<P>>,
    is?: Is<A>,
    validate?: Validate<I, A>,
    encode?: Encode<A, O>
  ) {
    super(name, props, required, false, is, validate, encode);
  }
  readOnly(name?: string): ExactPropsType<P, $ReadOnly<A>, O, I> {
    return lift(super.readOnly(name));
  }
  shape(name?: string): ExactPropsType<P, $Rest<A, {}>, $Rest<O, {}>, I> {
    return lift(super.shape(name));
  }
  inexact(name?: string): InexactPropsType<P, { ...A }, { ...O }, I> {
    const newName = name || getNameFromProps(this.props, this.required, false);
    return new InexactPropsType(newName, this.props, this.required);
  }
}

export function exact<Required: Props, Optional: Props>(
  props: { required?: Required, optional?: Optional },
  name?: string
): ExactPropsType<
  {| ...$Exact<Required>, ...$Exact<Optional> |},
  $ObjMap<ExactObj<Required, Optional>, <V: MixedFlowType>(v: V) => $PropertyType<V, '_A'>>,
  $ObjMap<ExactObj<Required, Optional>, <V: MixedFlowType>(v: V) => $PropertyType<V, '_O'>>,
  mixed
> {
  const required: Required = props.required || empty<Required>();
  const optional: Optional = props.optional || empty<Optional>();
  const typeName = name || getNameFromProps({ ...required, ...optional }, Object.keys(required), true);
  const requiredKeys = Object.keys(required);
  const allTypes = { ...required, ...optional };
  return new ExactPropsType(typeName, allTypes, requiredKeys);
}

export function exactAll<Required: Props>(
  required: Required,
  name: string = getNameFromProps(required, Object.keys(required), true)
): ExactPropsType<
  {| ...$Exact<Required> |},
  $ObjMap<ExactObj<Required, {||}>, <V: MixedFlowType>(v: V) => $PropertyType<V, '_A'>>,
  $ObjMap<ExactObj<Required, {||}>, <V: MixedFlowType>(v: V) => $PropertyType<V, '_O'>>,
  mixed
> {
  return exact<Required, {||}>({ required }, name);
}

export function exactShape<Optional: Props>(
  optional: Optional,
  name: string = getNameFromProps(optional, [], true)
): ExactPropsType<
  {| ...$Exact<Optional> |},
  $ObjMap<ExactObj<{||}, Optional>, <V: MixedFlowType>(v: V) => $PropertyType<V, '_A'>>,
  $ObjMap<ExactObj<{||}, Optional>, <V: MixedFlowType>(v: V) => $PropertyType<V, '_O'>>,
  mixed
> {
  return exact<{||}, Optional>({ optional }, name);
}

function lift<P: Props, A: Obj, O: Obj, I>(val: PropsType<P, A, O, I>): ExactPropsType<P, A, O, I> {
  const { props, required, name, is, validate, encode } = val;
  return new ExactPropsType(name, props, required, is, validate, encode);
}
