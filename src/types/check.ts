export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: string
  }

  namespace Function {
    type Sync<T> = (s: T) => Status
    type Async<T> = (s: T) => Promise<Status>
    /* DEPRECATED
    type NestedSuite<T> = (s: T) => Promise<Check[]> */
  }
  // Check function
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
  export type Suite<T> = { [id: string]: Function<T> }
  // export type OldParser<T> = (args: any) => Suite.Nested<T>
  export type Parser<S extends object, P> = (source: S) => Suite.Nested<P>
  // Suite: Record of Syncronous Functions that all run on the same `source`, and
  // each return a `Check.Status` object. The `id` of a Function in a Suite is the
  // `id` that should be assigned to turn the `Check.Status` into a `Check.Check`

  export type Collection = Suite.Collection
  export type CollectionFn =
    | ((...args: any[]) => Collection)
    | ((...args: any[]) => Promise<Collection>)

  // TODO: Handle `Parser` errors more gracefully

  export type Check = Status & {
    id: string
  }
}
export type Check = Check.Check
