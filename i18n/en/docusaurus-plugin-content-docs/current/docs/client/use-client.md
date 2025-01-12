---
sidebar_position: 2
---

# Using the client

## Creating a client

First, create `HttpClient` or `WsClient`, depending on the [supported-platforms] and the server-side protocol.
The client supports concurrent requests, so usually you just need to create and maintain unique instances of the client globally, e.g.

```ts title="apiClient.ts"
import { HttpClient } from 'tsrpc-browser'
import { serviceProto } from '. /shared/protocols/serviceProto'

// Create a globally unique apiClient and bring it in from this file if needed
export const apiClient = new HttpClient(serviceProto, {
  server: 'https://xxx.com/api',
  logger: console,
})
```

The constructors of `HttpClient` and `WsClient` both have 2 arguments.
The first argument, `serviceProto`, is the protocol definition in `serviceProto.ts` generated by our `npm run proto`.
The 2nd parameter is the client configuration, for configurable options see.

- `HttpClient` configuration options: [HttpClientOptions](/api/http-client#httpclientoptions)
- `WsClient` configuration options: [WsClientOptions](/api/ws-client#wsclientoptions)

## callApi

To call the API interface via `client.callApi`.

```ts
let ret = await client.callApi('interfaceName', {
  // request parameters
})
```

:::tip
All methods of TSRPC, including `callApi`, **do not** throw exceptions, so you always **do not need** `catch()` or `try... .catch... ` .
:::

## ApiReturn

`callApi` is asynchronous, its return type is `Promise<ApiReturn>` and contains 2 cases of success and error.

```ts
export interface ApiReturnSucc<Res> {
  isSucc: true
  res: Res
  err?: undefined
}

export interface ApiReturnError {
  isSucc: false
  res?: undefined
  err: TsrpcError
}

export type ApiReturn<Res> = ApiReturnSucc<Res> | ApiReturnError
```

## Error handling

`callApi` is not always successful and some errors may occur.

### Pitfalls of the traditional approach

The traditional approach based on `Promise` or callback functions has some pitfalls, which are often the source of bugs, e.g.

#### i. Handling errors in a decentralized way

For example, if you use `fetch`, you usually have these errors waiting to be handled.

```js
fetch(...)
    .then(v=>{
        1. HTTP status code error
        2. HTTP status code is fine, but a business error is returned (e.g. "insufficient balance" "wrong password")
    })
    .catch(e=>{
        1. network error
        2. code error reported
    })
```

There are very many potential errors that are scattered all over the place waiting for you to deal with them. Neglecting one can cause problems.

#### II. Forget to deal with errors

Many novices don't have the sense to handle errors, for example, in the above example, they may forget to `catch`.
This small oversight can cause big problems, such as a common requirement: "Show Loading during request".

```js
showLoading(); // Show a full screen Loading
let res = await fetch( ... );
hideLoading(); // hide Loading
```

At first glance it looks fine, but if a network error occurs, `fetch` will throw an exception and the following `hideLoading()` will not be executed. In this way, the loading on the interface will never disappear, often referred to as "stuck".
Don't underestimate it, a good percentage of "stuck" problems in real projects are related to this!

### Solution for TSRPC

First look at the example.

```ts title="frontend/src/index.ts"
let ret = await client.callApi('Hello', {
  name: 'World',
})

// Handle errors, exception branch
if (!ret.isSucc) {
  alert('Error: ' + ret.err.message)
  return
}

// Success
alert('Success: ' + ret.res.reply)
```

In TSRPC.

1. all methods **do not throw exceptions**
   - so there is always **no need** for `catch()` or `try.... .catch... `, avoiding the rookie trap.
2. All errors **need to be handled in one place**
   - Success is determined by `ret.isSucc`, success is taken as response `ret.res`, failure is taken as error `ret.err` (with error type and detail information). 2.
3. cleverly make you **must do error detection** through the TypeScript type system
   - The TypeScript compiler will report an error if you remove the code in the error handling section above, or if you remove `return` after handling the error.

## Canceling requests

There are some scenarios where you may need to cancel an API request in the middle of the process. For example, a single page application developed with React, Vue, and you want to cancel an API request that has not been returned after the component `unmount`.

TSRPC has 3 ways to handle cancellation, and the Promise ** received by the caller of a request after cancellation will neither `resolve` nor `reject` **.

### Canceling a single request via `SN`

Each `callApi` generates a unique request number `SN` for the current request, which can be cancelled by `client.abort(SN)`.
The last request number can be obtained by `client.lastSN`, e.g.

```ts
client.callApi('XXX', { ... }).then(ret => {
    // If the request is cancelled, it will not be processed by the client, whether the server returns or not
    console.log('Request completed', ret)
});

// Log SN immediately after callApi is called
let sn = client.lastSN;

// after 1 second, if the request still hasn't completed, it will be cancelled
setTimeout(()=>{
    client.abort(sn);
}, 1000)
```

### Cancel multiple requests with `abortKey`

The 3rd parameter that `callApi` can take is an optional configuration item, which contains `abortKey`.
You can specify an `abortKey` in advance at the beginning of the request, and then call `client.abortByKey(key)` to cancel all outstanding requests for the specified `abortKey`. (Completed requests are not affected)

This is useful for front-end componentized development, e.g. always specify `abortKey: Component ID` when `callApi` inside a component, and then `client.abortByKey(Component ID)` when the component is destroyed, to enable automatic cancellation of internal unfinished requests when the component is destroyed, e.g.

```ts
// The same abortKey can affect multiple requests
client.callApi('XXX', { ... }, { abortKey: 'MyAbortKey' }).then(ret => { ... });
client.callApi('XXX', { ... }, { abortKey: 'MyAbortKey' }).then(ret => { ... });
client.callApi('XXX', { ... }, { abortKey: 'MyAbortKey' }).then(ret => { ... });

// After 1 second, cancel those requests that have not yet completed
setTimeout(() => {
    client.abortByKey('MyAbortKey');
}, 1000)
```

### Cancel all outstanding requests

Cancel all outstanding requests under the client with `abortAll()`.

```ts
client.abortAll()
```

## Customizing workflows

You can customize the client with [Flow](... /flow/flow) to customize client-side workflows, implementing things like [Session and Cookie](. /flow/session-and-cookie), [client-side permission authentication](... /flow/user-authentication), [Mock](... /flow/mock), etc. /flow/mock) and other features.
