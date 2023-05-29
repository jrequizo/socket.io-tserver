## tRPC-inspired wrapper for Socket.IO

Build type-safe end-to-end bindings for your sockets.

Bring the best of tRPC for long-lived WebSocket connections.

> "Move fast and break nothing." - tRPC

---

## Quickstart Guide

WIP: installation

```
import { z } from "zod";
import { createTSocketServer, socketEvent } from "socket.io-tserver";

const server = createTSocketServer();
server.init({
    myEvent: socketEvent({
        input: z.object({
            name: z.string()
        }),
        handler({ input }) {
            console.log(`hello ${input.name}!`);
        },
    }),
})
server.listen({
    port: 3000,
    listeningListener() {
        console.log("listening");
    },
});
```


---

## High-level Overview

- Builder pattern for defining Socket.IO events
- Full end-to-end type safety for your event handler and emitters

---

## How Socket.IO works

1. Create a Server to listen to requests
```
import express from "express";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
    // options
});

httpServer.listen(3000);
```
2. Handle WebSocket connections using Socket.IO
```
io.on("connection", (socket) => {
  
    // Define socket events here
    socket.on("my_event", async function(data /** We don't know what the types for this data are! */) {
        // ...

        // Emit a response websocket event.
        socket.emit(
            "return_my_event", 
            new_data // When the client receives this, we need to manually type the data.
        );

    });

});
```
3. Initialize and handle the client events
```
import { io } from "socket.io-client";

const socket = io("ws://localhost:3000");

socket.on("return_my_event", async function(data /** What's the type? */) {
  // ...
});
```

---

## How does tRPC improve on handling HTTP requests?

1. Define your endpoint
```
import { z } from "zod";
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from "@trpc/server/adapters/standalone";
 
const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
    createUser: publicProcedure
        .input(z.object({             // We declare the input schema here...
            id: z.number(),
            name: z.string(),
            email: z.string()
        }))
        .mutation(async (opts) => {
            const { input } = opts;   // ...and receive full typing support in the handler here!

            const user = await db.user.create(input);
        })
});
```
2. Export the type bindings
```
export type AppRouter = typeof appRouter;
```
3. Run the server
```
const server = createHTTPServer({
    router: appRouter,
});
```
4. Initialize the client
```
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server';
//     👆 **type-only** import

// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
});
```
5. Use your queries and mutations
```
// Inferred types
await trpc.createUser.mutate(/** We get full type-safety for the input here! */);
```

We can leverage a similar approach when creating the definitions for our TServer and TClient approach here.

---

## How can we reap the same benefits?

1. Use a similar builder pattern for defining Socket.IO events and their handlers.
2. Use an adapter to turn the schema into a Socket.IO server.
3. Export the types into the client and use an adapter to build our Socket.IO client.
