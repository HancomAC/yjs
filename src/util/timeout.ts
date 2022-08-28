export default function timeout(cb: any, ms: number, acc = Math.min(10000, ms / 20)) {
    let timer;
    if (ms < 10000) timer = setTimeout(cb, ms);
    else {
        let time = Date.now();
        timer = setInterval(() => {
            if (Date.now() - time > ms) {
                clearInterval(timer);
                cb();
            }
        }, acc)
    }
    return () => {
        if (ms < 10000) clearTimeout(timer);
        else clearInterval(timer);
    }
}
