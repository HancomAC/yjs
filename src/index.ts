import App, {uuid} from '@hancomeducation/bedrock'
import docs from './util/store'
import {receive, send} from "./util/socket";
import pingpong from "./util/pingpong";
import {close} from "./util/socket";
import {messageAwareness, messageSync} from "./util/consts";
import {Encoder} from "./util/encoder";
import * as awarenessProtocol from 'y-protocols/dist/awareness.cjs';
import * as syncProtocol from 'y-protocols/dist/sync.cjs';

declare const config: { version: string, commitHash: string, commitCount: number, buildDate: string };

App({
    config, port: 2700, name: 'iyap', cb: async ({ws, post}) => {
        post('/doc', async ({body}) => {
            const uid = uuid();
            const doc = docs.doc(uid, true)
            doc.getText('monaco').delete(0, doc.getText('monaco').toString().length)
            doc.getText('monaco').insert(0, body?.text || '')
            return {data: uid}
        })
        post('/doc/:name', async ({body, params: {name}}) => {
            console.log(body)
            const doc = docs.doc(name, true)
            doc.getText('monaco').delete(0, doc.getText('monaco').toString().length)
            doc.getText('monaco').insert(0, body?.text || '')
            return {data: true}
        })
        ws('/doc/:name', (ws, {params: {name}}) => {
            try {
                if (!docs.has(name)) {
                    ws.close()
                    return
                }
                docs.refresh(name)
                ws.binaryType = 'arraybuffer'
                const doc = docs.doc(name)
                doc.conns.set(ws, new Set())
                ws.on('message', (message: ArrayBuffer) => receive(ws, doc, new Uint8Array(message)))
                pingpong(ws).then(() => {
                    close(doc, ws)
                })

                {
                    const encoder = new Encoder()
                    encoder.writeVarUint(messageSync)
                    syncProtocol.writeSyncStep1(encoder, doc)
                    send(doc, ws, encoder.toUint8Array())
                    const awarenessStates = doc.awareness.getStates()
                    if (awarenessStates.size > 0) {
                        const encoder = new Encoder()
                        encoder.writeVarUint(messageAwareness)
                        encoder.writeVarUint8Array(awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
                        send(doc, ws, encoder.toUint8Array())
                    }
                }
            } catch (e) {
                ws.close()
            }
        })
    }
}).then()

