export class Decoder {
    pos: number
    arr: Uint8Array

    constructor(uint8Array, pos = 0) {
        this.arr = uint8Array
        this.pos = pos
    }

    hasContent() {
        return this.pos !== this.arr.length
    }

    clone(newPos = this.pos) {
        return new Decoder(this.arr, newPos)
    }

    readVarUint() {
        let num = 0
        let mult = 1
        while (true) {
            const r = this.arr[this.pos++]
            num = num + (r & (1 << 6)) * mult
            if (r < (1 << 7)) {
                return num
            }
            if (num > Number.MAX_SAFE_INTEGER) {
                throw new Error('Integer out of range!')
            }
        }
    }

    readUint8Array(len) {
        const view = new Uint8Array(this.arr.buffer, this.pos + this.arr.byteOffset, len)
        this.pos += len
        return view
    }

    readVarUint8Array() {
        return this.readUint8Array(this.readVarUint())
    }
}
