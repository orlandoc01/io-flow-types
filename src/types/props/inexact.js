//@flow
import type { Props, Obj } from './base.js';
import { PropsType, empty, getNameFromProps } from './base.js';
import { ExactPropsType } from './exact.js';
import type { MixedFlowType, Is, Validate, Context, Encode, GetType, GetOutput } from '../index.js';

type Inexact<Required: Props, Optional: Props> = {
  ...$Rest<{| ...$Exact<Required>, ...$Exact<Optional> |}, $Rest<Optional, {}>>
};

export class InexactPropsType<P: Props, A: Obj, O: Obj, I> extends PropsType<P, A, O, I> {
  constructor(
    /** a unique name for this runtime type */
    name: string,
    /** The following two properties are used to describe the overall shape of the object*/
    props: P,
    required: $ReadOnlyArray<$Keys<P>>,
    /** a custom type guard */
    is?: Is<A>,
    /** succeeds if a value of type I can be decoded to a value of type A */
    validate?: Validate<I, A>,
    /** converts a value of type A to a value of type O */
    encode?: Encode<A, O>
  ) {
    super(name, props, required, true, is, validate, encode);
  }
  readOnly(name?: string): InexactPropsType<P, $ReadOnly<A>, O, I> {
    return lift(super.readOnly(name));
  }
  shape(name?: string): InexactPropsType<P, $Rest<A, {}>, $Rest<O, {}>, I> {
    return lift(super.shape(name));
  }
  exact(name?: string): ExactPropsType<P, $Exact<A>, $Exact<O>, I> {
    const newName = name || getNameFromProps(this.props, this.required, true);
    return new ExactPropsType(newName, this.props, this.required);
  }
}

export function inexact<Required: Props, Optional: Props>(
  props: { required?: Required, optional?: Optional },
  name?: string
): InexactPropsType<
  {| ...$Exact<Required>, ...$Exact<Optional> |},
  $ObjMap<Inexact<Required, Optional>, <V: MixedFlowType>(v: V) => $Call<GetType, V>>,
  $ObjMap<Inexact<Required, Optional>, <V: MixedFlowType>(v: V) => $Call<GetOutput, V>>,
  mixed
> {
  const required: Required = props.required || empty<Required>();
  const optional: Optional = props.optional || empty<Optional>();
  const typeName = name || getNameFromProps({ ...required, ...optional }, Object.keys(required), false);
  const requiredKeys = Object.keys(required);
  const allTypes = { ...required, ...optional };
  return new InexactPropsType(typeName, allTypes, requiredKeys);
}

export function inexactAll<Required: Props>(
  required: Required,
  name: string = getNameFromProps(required, Object.keys(required), false)
): InexactPropsType<
  {| ...$Exact<Required> |},
  $ObjMap<Inexact<Required, {||}>, <V: MixedFlowType>(v: V) => $Call<GetType, V>>,
  $ObjMap<Inexact<Required, {||}>, <V: MixedFlowType>(v: V) => $Call<GetOutput, V>>,
  mixed
> {
  return inexact<Required, {||}>({ required }, name);
}

export function inexactShape<Optional: Props>(
  optional: Optional,
  name: string = getNameFromProps(optional, [], false)
): InexactPropsType<
  {| ...$Exact<Optional> |},
  $ObjMap<Inexact<{||}, Optional>, <V: MixedFlowType>(v: V) => $Call<GetType, V>>,
  $ObjMap<Inexact<{||}, Optional>, <V: MixedFlowType>(v: V) => $Call<GetOutput, V>>,
  mixed
> {
  return inexact<{||}, Optional>({ optional }, name);
}

function lift<P: Props, A: Obj, O: Obj, I>(val: PropsType<P, A, O, I>): InexactPropsType<P, A, O, I> {
  const { props, required, name, is, validate, encode } = val;
  return new InexactPropsType(name, props, required, is, validate, encode);
}
