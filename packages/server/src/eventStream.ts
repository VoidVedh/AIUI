import { Response } from "express";

export interface SseEvent {
  event: string;
  data: any;
}

export class EventStreamManager {
  private static clients = new Map<string, Set<Response>>();

  public static addClient(runId: string, res: Response): void {
    if (!this.clients.has(runId)) {
      this.clients.set(runId, new Set());
    }
    this.clients.get(runId)!.add(res);

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

  public static broadcast(runId: string, event: string, data: any): void {
    const runClients = this.clients.get(runId);
    if (!runClients || runClients.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of runClients) {
      try {
        client.write(payload);
      } catch (err) {
        console.error(`Failed to write to SSE client for run ${runId}:`, err);
      }
    }
  }

  public static closeRun(runId: string): void {
    const runClients = this.clients.get(runId);
    if (runClients) {
      for (const client of runClients) {
        try {
          client.end();
        } catch {}
      }
      this.clients.delete(runId);
    }
  }
}
