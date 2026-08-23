export class EventStreamManager {
    static clients = new Map();
    static addClient(runId, res) {
        if (!this.clients.has(runId)) {
            this.clients.set(runId, new Set());
        }
        this.clients.get(runId).add(res);
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
        const runClients = this.clients.get(runId);
        if (!runClients || runClients.size === 0)
            return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const client of runClients) {
            try {
                client.write(payload);
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
    }
}
//# sourceMappingURL=eventStream.js.map