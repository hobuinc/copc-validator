export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: string
  }

  namespace Function {
    type Sync<T> = (s: T) => Check.Status
    type Async<T> = (s: T) => Promise<Check.Status>
    /* DEPRECATED
    type NestedSuite<T> = (s: T) => Promise<Check[]> */
  }
  // Syncronous check function
  export type Function<T> = Function.Sync<T> | Function.Async<T> //| Function.NestedSuite<T>

  namespace Suite {
    // The actual object type that gets used by invokeCollection
    export type withSource<T> = { source: T; suite: Suite<T> }
    // Nested Suites have been replaced with any function that returns the following
    export type Nested<T> = Promise<withSource<T>>
    // Top-Level Suites (Copc, Las, Getter) have been replaced with Collections
    export type Collection = (withSource<any> | Nested<any>)[] //withSource<any>[]
    // a.k.a Arrays of Suite.withSource<any> (or Promises)
  }
  export type OldParser<T> = (args: any) => Suite.Nested<T>
  export type Parser<S extends object, P> = (source: S) => Suite.Nested<P>
  // Suite: Record of Syncronous Functions that all run on the same `source`, and
  // each return a `Check.Status` object. The `id` of a Function in a Suite is the
  // `id` that should be assigned to turn the `Check.Status` into a `Check.Check`
  export type Suite<T> = { [id: string]: Function<T> }

  export type Collection = Suite.Collection
  // Terminology - `Sourcer`: An Asyncronous Function that returns a `Suite.Nested`
  // object. Replaces `Function.NestedSuite` to simplify Suites and should be more
  // performant with PromisePools
  // TODO: Handle `Sourcer` errors more gracefully

  export type Check = Status & {
    id: string
  }
}
export type Check = Check.Check
