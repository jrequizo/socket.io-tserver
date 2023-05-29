import { Server as HttpServer, createServer, IncomingMessage, ServerResponse } from "http";
import { Server as SocketServer, ServerOptions } from "socket.io";

import { AnySocketEvent } from "./socketEvent";
import { TSocketError } from "./errors";


export interface TSocketServer {
    /**
     * @internal
     * @readonly
     */
    _httpServer: HttpServer
    /**
     * @internal
     * @readonly
     */
    _socketServer: SocketServer;
    /**
     * Add event handlers for the socket server.
     * @readonly
     */
    init: (events: EventRecord) => void;
    /**
     * Start the socket server listening for connections.
     * @readonly
     */
    listen: (opts?: {
        port?: number,
        hostname?: string,
        backlog?: number,
        listeningListener?: () => void
    }) => void

    /**
     * Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, 
     * the server is finally closed when all connections are ended and the server emits a `'close'` event. The optional 
     * `callback` will be called once the `'close'` event occurs. Unlike that event, it will be called with an Error as 
     * its only argument if the server was not open when it was closed.
     * @param callback — Called when the server is closed.
     */
    close?: (callback?: ((err?: Error | undefined) => void) | undefined) => HttpServer<typeof IncomingMessage, typeof ServerResponse>
}


/**
 * Object containing the SocketEvents of the `TSocketServer`.
 * The keys of the object are used as the name of the event to listen to.
 */
export interface EventRecord {
    [key: string]: AnySocketEvent
}


/**
 * Returns a new instance of `TSocketServer`.
 * Uses NodeJS's `http` Server as the base.
 * @param options 
 * @returns A TSocketServer.
 */
export function createTSocketServer<InputSchema, OutputSchema>(options?: ServerOptions) {
    const httpServer = createServer();
    const io = new SocketServer(httpServer, options);

    const init = (events: EventRecord) => {
        // Bind the events defined in the `EventRecord`
        io.on("connection", (socket) => {
            Object.keys(events).forEach(key => {
                socket.on(key, (...input) => {
                    try {
                        events[key].handler({ input, io, socket });
                    } catch (error) {
                        let result = undefined
                        if (events[key].onError !== undefined) {
                            result = events[key].onError!({
                                error: error as TSocketError,
                                io,
                                socket
                            });
                        }

                        const hash = "";
                        // TODO: generate hash of the `socketEvent` and use that as the key to emit the error event.
                        // TODO: what to return for error handling?
                        socket.emit(hash, result);
                    }
                });
            });
        });
    }

    // Handle calls to the `listen` function and pass it to the `http` server.
    const listen = (opts?: {
        port?: number,
        hostname?: string,
        backlog?: number,
        listeningListener?: () => void
    }) => {
        httpServer.listen(opts?.port, opts?.hostname, opts?.backlog, opts?.listeningListener);
    }
    // Forward the close function from the httpServer to the user.
    const close = httpServer.close;

    return {
        _httpServer: httpServer,
        _socketServer: io,
        init,
        listen,
        close
    } as TSocketServer;
}