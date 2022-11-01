/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-explicit-any */
export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: string
  }

  namespace Function {
    type Sync<T> = (s: T) => Status
    type Async<T> = (s: T) => Promise<Status>
  }
  export type Function<T> = Function.Sync<T> | Function.Async<T>

  namespace Suite {
    // The actual object type that gets used by invokeCollection
    export type withSource<T> = { source: T; suite: Suite<T> }
    // Nested Suites have been replaced with any function that returns the following
    export type Nested<T> = Promise<withSource<T>>
    // Top-Level Suites (Copc, Las, Getter) have been replaced with Collections
    export type Collection = (withSource<any> | Nested<any>)[] //withSource<any>[]
    // a.k.a Arrays of Suite.withSource<any> (or Promises)
  }
  export type Suite<T> = { [id: string]: Check.Function<T> }
  export type Parser<S extends object, P> = (source: S) => Suite.Nested<P>

  export type Collection = Suite.Collection
  export type CollectionFn =
    | ((...args: any[]) => Collection)
    | ((...args: any[]) => Promise<Collection>)

  export type Check = Status & {
    id: string
  }
}

export type Check = Check.Check
