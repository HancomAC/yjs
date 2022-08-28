import WSSharedDoc from "./doc";
import timeout from "./timeout";

export class DocsStore {
    docs = new Map();
    ttl = new Map();

    has(name) {
        return this.docs.has(name)
    }

    doc(name, gc = true) {
        if (!this.docs.has(name)) {
            const doc = new WSSharedDoc(name)
            doc.gc = gc
            this.docs.set(name, doc)
        }
        this.refresh(name)
        return this.docs.get(name)
    }

    refresh(name) {
        this.ttl.get(name)?.()
        this.ttl.set(name, timeout(() => {
            this.docs.delete(name)
            this.ttl.delete(name)
        }, 1000 * 60 * 60))
    }
}

export default new DocsStore()
