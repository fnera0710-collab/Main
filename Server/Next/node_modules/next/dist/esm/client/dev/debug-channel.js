import { NEXT_REQUEST_ID_HEADER } from '../components/app-router-headers';
import { InvariantError } from '../../shared/lib/invariant-error';
const pairs = new Map();
const DEBUG_CHANNEL_STORAGE_KEY_PREFIX = '__next_debug_channel:';
// Buffer for the initial document's debug channel data. Written to
// sessionStorage once complete so it can be restored when the browser serves
// the page from HTTP cache (back-forward navigation, tab duplication, etc.).
let initialDocumentDebugChunks = [];
function persistDebugChannelToSessionStorage(requestId) {
    const key = DEBUG_CHANNEL_STORAGE_KEY_PREFIX + requestId;
    const value = JSON.stringify(initialDocumentDebugChunks.map((chunk)=>{
        let binary = '';
        for(let i = 0; i < chunk.byteLength; i++){
            binary += String.fromCharCode(chunk[i]);
        }
        return btoa(binary);
    }));
    try {
        sessionStorage.setItem(key, value);
    } catch  {
        // Likely a quota error. Drop entries from previous documents in this tab
        // (we only need to restore the current one's entry on cache restore) and
        // retry once. If it still fails, skip silently — the location.reload()
        // fallback in createDebugChannel handles this case.
        for(let i = sessionStorage.length - 1; i >= 0; i--){
            const k = sessionStorage.key(i);
            if (k?.startsWith(DEBUG_CHANNEL_STORAGE_KEY_PREFIX) && k !== key) {
                sessionStorage.removeItem(k);
            }
        }
        try {
            sessionStorage.setItem(key, value);
        } catch  {}
    }
}
function wasServedFromCache() {
    try {
        // There is exactly one PerformanceNavigationTiming entry per page load.
        const entry = performance.getEntriesByType('navigation')[0];
        return entry?.transferSize === 0;
    } catch  {
        return false;
    }
}
function restoreDebugChannelFromSessionStorage(requestId) {
    try {
        const serializedData = sessionStorage.getItem(DEBUG_CHANNEL_STORAGE_KEY_PREFIX + requestId);
        if (!serializedData) {
            return undefined;
        }
        const chunks = JSON.parse(serializedData).map((base64)=>{
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for(let i = 0; i < binary.length; i++){
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        });
        return new ReadableStream({
            start (controller) {
                for (const chunk of chunks){
                    controller.enqueue(chunk);
                }
                controller.close();
            }
        });
    } catch  {
        return undefined;
    }
}
export function getOrCreateDebugChannelReadableWriterPair(requestId) {
    let pair = pairs.get(requestId);
    if (!pair) {
        // Only buffer chunks for the initial document's debug channel, not for
        // client-side navigation requests.
        const shouldBuffer = requestId === self.__next_r;
        const { readable, writable } = new TransformStream({
            transform (chunk, controller) {
                if (shouldBuffer) {
                    initialDocumentDebugChunks.push(chunk.slice());
                }
                controller.enqueue(chunk);
            }
        });
        pair = {
            readable,
            writer: writable.getWriter()
        };
        pairs.set(requestId, pair);
        pair.writer.closed.then(()=>{
            if (shouldBuffer) {
                persistDebugChannelToSessionStorage(requestId);
            }
        }).finally(()=>pairs.delete(requestId));
    }
    return pair;
}
export function createDebugChannel(requestHeaders) {
    let requestId;
    if (requestHeaders) {
        requestId = requestHeaders[NEXT_REQUEST_ID_HEADER] ?? undefined;
        if (!requestId) {
            throw Object.defineProperty(new InvariantError(`Expected a ${JSON.stringify(NEXT_REQUEST_ID_HEADER)} request header.`), "__NEXT_ERROR_CODE", {
                value: "E854",
                enumerable: false,
                configurable: true
            });
        }
    } else {
        requestId = self.__next_r;
        if (!requestId) {
            throw Object.defineProperty(new InvariantError(`Expected a request ID to be defined for the document via self.__next_r.`), "__NEXT_ERROR_CODE", {
                value: "E806",
                enumerable: false,
                configurable: true
            });
        }
    }
    // Only attempt to restore the sessionStorage debug channel entry for the
    // initial document load (no request headers). Client-side navigations pass
    // request headers and should always use the WebSocket-backed debug channel.
    if (!requestHeaders && wasServedFromCache()) {
        const readable = restoreDebugChannelFromSessionStorage(requestId);
        if (readable) {
            return {
                readable
            };
        }
        // Debug channel can't be restored — debug deps would block hydration.
        // Force a fresh page load from the server. Return a never-closing stream
        // so the Flight client stays parked until the reload tears the document
        // down, instead of synchronously erroring with "Connection closed.".
        location.reload();
        return {
            readable: new ReadableStream()
        };
    }
    const { readable } = getOrCreateDebugChannelReadableWriterPair(requestId);
    return {
        readable
    };
}

//# sourceMappingURL=debug-channel.js.map