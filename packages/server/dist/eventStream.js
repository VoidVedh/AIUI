export class EventStreamManager {
    static clients = new Map();
    static eventBuffers = new Map();
    static addClient(runId, res) {
        if (!this.clients.has(runId)) {
            this.clients.set(runId, new Set());
        }
        this.clients.get(runId).add(res);
        // Replay buffered events to late-joining client
        const buffered = this.eventBuffers.get(runId);
        if (buffered) {
            for (const item of buffered) {
                res.write(`event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`);
            }
        }
        res.on("close", () => {
            const runClients = this.clients.get(runId);
            if (runClients) {
                runClients.delete(res);
                if (runClients.size === 0) {
                    this.clients.delete(runId);
                }
            }
        });
    }
    static broadcast(runId, event, data) {
        if (!this.eventBuffers.has(runId)) {
            this.eventBuffers.set(runId, []);
        }
        this.eventBuffers.get(runId).push({ event, data });
        const runClients = this.clients.get(runId);
        if (!runClients || runClients.size === 0)
            return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const client of runClients) {
            try {
                client.write(payload);
                if (typeof client.flush === "function") {
                    client.flush();
                }
            }
            catch (err) {
                console.error(`Failed to write to SSE client for run ${runId}:`, err);
            }
        }
    }
    static closeRun(runId) {
        const runClients = this.clients.get(runId);
        if (runClients) {
            for (const client of runClients) {
                try {
                    client.end();
                }
                catch { }
            }
            this.clients.delete(runId);
        }
        this.eventBuffers.delete(runId);
    }
}
//# sourceMappingURL=eventStream.js.map