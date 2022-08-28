import {CALLBACK_OBJECTS, CALLBACK_TIMEOUT, CALLBACK_URL} from "../config";
import http from 'http'

const getContent = (objName, objType, doc) => {
    switch (objType) {
        case 'Array':
            return doc.getArray(objName)
        case 'Map':
            return doc.getMap(objName)
        case 'Text':
            return doc.getText(objName)
        case 'XmlFragment':
            return doc.getXmlFragment(objName)
        case 'XmlElement':
            return doc.getXmlElement(objName)
        default :
            return {}
    }
}

function callbackRequest(url, timeout, data) {
    data = JSON.stringify(data)
    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        timeout,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }
    const req = http.request(options)
    req.on('timeout', () => {
        console.warn('Callback request timed out.')
        req.abort()
    })
    req.on('error', (e) => {
        console.error('Callback request error.', e)
        req.abort()
    })
    req.write(data)
    req.end()
}

export function callbackHandler(update, origin, doc) {
    const room = doc.name
    const dataToSend = {
        room,
        data: {}
    }
    const sharedObjectList = Object.keys(CALLBACK_OBJECTS)
    sharedObjectList.forEach(sharedObjectName => {
        const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName]
        dataToSend.data[sharedObjectName] = {
            type: sharedObjectType,
            content: getContent(sharedObjectName, sharedObjectType, doc).toJSON()
        }
    })
    callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend)
}
