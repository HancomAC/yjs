export class Encoder {
    cpos = 0
    cbuf = new Uint8Array(100)
    bufs: Uint8Array[] = []

    length() {
        return this.cpos + this.bufs.reduce((a, b) => a + b.length, 0)
    }

    toUint8Array() {
        const uint8arr = new Uint8Array(this.length())
        let curPos = 0
        for (const i of this.bufs) {
            uint8arr.set(i, curPos)
            curPos += i.length
        }
        uint8arr.set(new Uint8Array(this.cbuf.buffer, 0, this.cpos), curPos)
        return uint8arr
    }

    write(num) {
        const bufferLen = this.cbuf.length
        if (this.cpos === bufferLen) {
            this.bufs.push(this.cbuf)
            this.cbuf = new Uint8Array(bufferLen * 2)
            this.cpos = 0
        }
        this.cbuf[this.cpos++] = num
    }

    writeVarUint(num) {
        while (num > 127) {
            this.write(128 | (127 & num))
            num = Math.floor(num / 128)
        }
        this.write(127 & num)
    }

    writeUint8Array(uint8Array) {
        const bufferLen = this.cbuf.length
        const leftCopyLen = Math.min(bufferLen - this.cpos, uint8Array.length)
        const rightCopyLen = uint8Array.length - leftCopyLen
        this.cbuf.set(uint8Array.subarray(0, leftCopyLen), this.cpos)
        this.cpos += leftCopyLen
        if (rightCopyLen > 0) {
            this.bufs.push(this.cbuf)
            this.cbuf = new Uint8Array(Math.max(bufferLen * 2, rightCopyLen))
            this.cbuf.set(uint8Array.subarray(leftCopyLen))
            this.cpos = rightCopyLen
        }
    }

    writeVarUint8Array(uint8Array) {
        this.writeVarUint(uint8Array.byteLength)
        this.writeUint8Array(uint8Array)
    }
}
