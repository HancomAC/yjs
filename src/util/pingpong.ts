import {pingTimeout} from "./consts";

export default function (conn: any) {
    return new Promise<void>(resolve => {
        let pongReceived = true
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
                resolve()
                clearInterval(pingInterval)
            } else {
                pongReceived = false
                try {
                    conn.ping()
                } catch (e) {
                    resolve()
                    clearInterval(pingInterval)
                }
            }
        }, pingTimeout)
        conn.on('close', () => {
            resolve()
            clearInterval(pingInterval)
        })
        conn.on('pong', () => {
            pongReceived = true
        })
    })
}
