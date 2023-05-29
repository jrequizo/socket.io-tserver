import { Server as SocketServer, Socket } from "socket.io";
import { ZodSchema } from "zod";

import { TSocketError } from "./errors";


const $EventSymbol: unique symbol = Symbol();


export type SocketHandler<InputSchema, OutputSchema> = (params: {
    input: InputSchema,
    io: SocketServer,
    socket: Socket
}) => OutputSchema


export type SocketErrorHandler = <SocketError extends TSocketError, OutputSchema>(params: {
    /**
     * The error responsible for this handler being called.
     */
    error: SocketError,
    io: SocketServer,
    socket: Socket
}) => OutputSchema


export interface SocketEvent<InputSchema, OutputSchema> {
    /**
     * @internal
     * @readonly
     */
    [$EventSymbol]: typeof $EventSymbol,
    input: ZodSchema<InputSchema>,
    handler: SocketHandler<InputSchema, OutputSchema>,
    onError?: SocketErrorHandler
}


export type AnySocketEvent = SocketEvent<any, any>;


interface SocketEventOpts<InputSchema, OutputSchema> {
    /**
     * The input schema to validate all inputs into. Throws a `TSocketError` when validation fails.
     * This error can be handled using the `onError` callback.
     */
    input: ZodSchema<InputSchema>,
    /**
     * Function that is called when the listener to this SocketEvent is fired.
     * The input schema is validated before it is passsed into the `handler` function.
     * Receives `input`, `io`, and `socket` props.
     */
    handler: SocketHandler<InputSchema, OutputSchema>,
    // TODO: onError callback
    /**
     * 1. onError() <- handle on server-side
     * 2. `return` result from onError() handler is sent back to the User
     *      - via an event that is the hash of the `socketEvent`
     */
    /**
     * Function that is called when an error is thrown in the `handler` function.
     */
    onError?: SocketErrorHandler
}


// TODO: JSON transformer i.e. superjson for dates
// TODO: method to switch between JSON and binary input
// TODO: more verbose errors, codes, messages, etc.
// TODO: return for onError handler
/**
 * Create a new `event` handler for the SocketServer.
 * @param opts 
 * @returns 
 */
export function socketEvent<InputSchema, OutputSchema>(
    opts: SocketEventOpts<InputSchema, OutputSchema>
): SocketEvent<InputSchema, OutputSchema> {

    return {
        [$EventSymbol]: $EventSymbol,

        input: opts.input,

        handler: ({ input, io, socket }) => {
            // Parse the schema
            const result = opts.input.safeParse(input);
            if (!result.success) {
                // TODO: more verbose error
                throw new TSocketError({
                    message: "Schema validation error.",
                    code: 400
                });
            }

            return opts.handler({ input, io, socket });
        },

        onError: opts.onError
    }
}


// export type SocketEventBuilder = typeof socketEvent;