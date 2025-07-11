import type { PendingRpcRequest, Rpc } from "@solana/kit";

const isPending = (x: unknown): x is PendingRpcRequest<any> => {
    return !!x && typeof (x as any).send === "function";
};

export const wrapAutoSend = <T extends Rpc<any>>(raw: T): T => {
    return new Proxy(raw, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value !== "function") return value;

            return (...args: unknown[]) => {
                const result = (value as (...args: unknown[]) => unknown)(...args);
                return isPending(result) ? result.send() : result;
            };
        },
    }) as T;
};