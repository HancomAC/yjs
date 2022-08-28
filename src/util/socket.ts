import {Encoder} from "./encoder";
import {Decoder} from "./decoder";
import {messageAwareness, messageSync, wsReadyStateConnecting, wsReadyStateOpen} from "./consts";
import awarenessProtocol from 'y-protocols/dist/awareness.cjs';
import syncProtocol from 'y-protocols/dist/sync.cjs';

export function receive(conn, doc, message) {
    try {
        const encoder = new Encoder()
        const decoder = new Decoder(message)
        const messageType = decoder.readVarUint()
        switch (messageType) {
            case messageSync:
                encoder.writeVarUint(messageSync)
                syncProtocol.readSyncMessage(decoder, encoder, doc, null)
                if (encoder.length() > 1) send(doc, conn, encoder.toUint8Array())
                break
            case messageAwareness: {
                awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoder.readVarUint8Array(), conn)
                break
            }
        }
    } catch (err) {
        console.error(err)
        doc.emit('error', [err])
    }
}

export function send(doc, conn, m) {
    if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
        close(doc, conn)
    }
    try {
        conn.send(m, err => {
            err != null && close(doc, conn)
        })
    } catch (e) {
        close(doc, conn)
    }
}

export function close(doc, conn) {
    if (doc.conns.has(conn)) {
        const controlledIds = doc.conns.get(conn)
        doc.conns.delete(conn)
        awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)
    }
    conn.close()
}
