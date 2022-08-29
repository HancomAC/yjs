import * as Y from 'yjs';
import {
    CALLBACK_DEBOUNCE_MAXWAIT,
    CALLBACK_DEBOUNCE_WAIT,
    CALLBACK_OBJECTS,
    CALLBACK_TIMEOUT,
    CALLBACK_URL,
    gcEnabled, isCallbackSet
} from "../config";
import * as awarenessProtocol from 'y-protocols/dist/awareness.cjs';
import * as syncProtocol from 'y-protocols/dist/sync.cjs';
import {callbackHandler} from "./callback";
import {Encoder} from "./encoder";
import {messageAwareness, messageSync, wsReadyStateConnecting, wsReadyStateOpen} from "./consts";
import _ from 'lodash';
import {send} from "./socket";

export default class WSSharedDoc extends Y.Doc {
    name = ''
    conns = new Map()
    awareness = null

    constructor(name) {
        super({gc: gcEnabled})
        this.name = name
        this.awareness = new awarenessProtocol.Awareness(this)
        this.awareness.setLocalState(null)

        const awarenessChangeHandler = ({added, updated, removed}, conn) => {
            const changedClients = added.concat(updated, removed)
            if (conn !== null) {
                const connControlledIDs = (this.conns.get(conn))
                if (connControlledIDs !== undefined) {
                    added.forEach(clientID => {
                        connControlledIDs.add(clientID)
                    })
                    removed.forEach(clientID => {
                        connControlledIDs.delete(clientID)
                    })
                }
            }
            const encoder = new Encoder()
            encoder.writeVarUint(messageAwareness)
            encoder.writeVarUint8Array(awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
            const buff = encoder.toUint8Array()
            this.conns.forEach((_, c) => {
                send(this, c, buff)
            })
        }
        this.awareness.on('update', awarenessChangeHandler)
        this.on('update', (update, origin, doc) => {
            const encoder = new Encoder();
            encoder.writeVarUint(messageSync)
            syncProtocol.writeUpdate(encoder, update)
            const message = encoder.toUint8Array()
            doc.conns.forEach((_, conn) => send(doc, conn, message))
        })
        if (isCallbackSet) {
            this.on('update', _.debounce(
                callbackHandler,
                CALLBACK_DEBOUNCE_WAIT,
                {maxWait: CALLBACK_DEBOUNCE_MAXWAIT}
            ))
        }
    }
}
