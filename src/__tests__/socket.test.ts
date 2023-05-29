import { z } from "zod";

import { createTSocketServer } from "../server";

import { socketEvent } from "../socketEvent";

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