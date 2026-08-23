import { Response } from "express";
export interface SseEvent {
    event: string;
    data: any;
}
export declare class EventStreamManager {
    private static clients;
    static addClient(runId: string, res: Response): void;
    static broadcast(runId: string, event: string, data: any): void;
    static closeRun(runId: string): void;
}
//# sourceMappingURL=eventStream.d.ts.map