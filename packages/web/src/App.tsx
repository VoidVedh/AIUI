import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LeftStudioPanel, FixturePreset } from "./components/LeftStudioPanel";
import { RightStudioPanel, GeneratedCodeFile } from "./components/RightStudioPanel";
import { DebugDrawer } from "./components/DebugDrawer";

export function App() {
  const [serverStatus, setServerStatus] = useState<"connected" | "disconnected" | "running">("connected");
  const [fixtures, setFixtures] = useState<FixturePreset[]>([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>("card-ui");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [similarityThreshold] = useState(0.95);
  const [maxIterations] = useState(5);

  // Pipeline execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("idle");
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [ssimScore, setSsimScore] = useState(0);
  const [pixelMatchScore, setPixelMatchScore] = useState(0);
  const [layoutIouScore, setLayoutIouScore] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Artifacts & Code
  const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);
  const [diffImageUrl, setDiffImageUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedCodeFile[]>([]);

  // Load available benchmark fixtures on mount
  useEffect(() => {
    fetch("/api/fixtures")
      .then((res) => res.json())
      .then((data) => {
        setFixtures(data);
        if (data.length > 0) {
          const defaultFixture = data.find((f: any) => f.id === "card-ui") || data[0];
          setSelectedFixtureId(defaultFixture.id);
          setTargetImageUrl(defaultFixture.imageUrl);
        }
      })
      .catch(() => {
        setServerStatus("disconnected");
      });
  }, []);

  // Update target image when fixture selection changes
  useEffect(() => {
    if (selectedFixtureId && !customFile) {
      const fixture = fixtures.find((f) => f.id === selectedFixtureId);
      if (fixture) {
        setTargetImageUrl(fixture.imageUrl);
      }
    }
  }, [selectedFixtureId, fixtures, customFile]);

  // Handle custom upload file preview
  const handleUploadFile = (file: File | null) => {
    setCustomFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setTargetImageUrl(url);
      setSelectedFixtureId(null);
    }
  };

  const startPipelineRun = async () => {
    setIsRunning(true);
    setServerStatus("running");
    setLogs(["[PIPELINE_INIT] Starting autonomous UI-to-Code pipeline..."]);
    setCurrentStage("analyzing");
    setCurrentScore(0);
    setHistory([]);
    setFiles([]);

    const formData = new FormData();
    formData.append("target", "react");
    formData.append("similarityThreshold", similarityThreshold.toString());
    formData.append("maxIterations", maxIterations.toString());

    if (customFile) {
      formData.append("image", customFile);
    } else if (selectedFixtureId) {
      formData.append("fixtureId", selectedFixtureId);
    }

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status} ${res.statusText}`);
      }

      const { runId } = await res.json();
      setCurrentRunId(runId);

      let pollInterval: any = null;

      const stopRun = () => {
        setIsRunning(false);
        setServerStatus("connected");
        if (pollInterval) clearInterval(pollInterval);
      };

      const syncState = async () => {
        try {
          const stateRes = await fetch(`/api/runs/${runId}/state`);
          if (!stateRes.ok) return;
          const state = await stateRes.json();

          if (state.currentStage) setCurrentStage(state.currentStage);
          if (state.totalIterations) setCurrentIteration(state.totalIterations);
          if (state.similarityScore) setCurrentScore(state.similarityScore);
          if (state.logs && state.logs.length > 0) setLogs(state.logs);

          if (state.history && state.history.length > 0) {
            const latest = state.history[state.history.length - 1];
            setSsimScore(latest.ssimScore || 0);
            setPixelMatchScore(latest.pixelMatchScore || 0);
            setLayoutIouScore(latest.layoutIouScore || 0);
            setHistory(state.history);

            setRenderedImageUrl(`/api/runs/${runId}/artifacts/rendered_iter_${latest.iteration}.png`);
            setDiffImageUrl(`/api/runs/${runId}/artifacts/diff_iter_${latest.iteration}.png`);
          }

          if (state.costLogs) {
            const tokens = state.costLogs.reduce((acc: number, c: any) => acc + (c.promptTokens || 0) + (c.completionTokens || 0), 0);
            const cost = state.costLogs.reduce((acc: number, c: any) => acc + (c.estimatedCostUsd || 0), 0);
            setTotalTokens(tokens);
            setTotalCost(cost);
          }

          if (state.currentProject?.files && state.currentProject.files.length > 0) {
            setFiles(state.currentProject.files);
          }

          if (
            state.status === "completed" ||
            state.status === "success" ||
            state.status === "max_iterations_reached" ||
            state.status === "failed"
          ) {
            setCurrentStage(state.status === "failed" ? "failed" : "completed");
            stopRun();
          }
        } catch {}
      };

      pollInterval = setInterval(syncState, 800);
      syncState();

      // Connect to SSE stream
      try {
        const eventSource = new EventSource(`/api/runs/${runId}/events`);

        eventSource.addEventListener("progress", (e) => {
          const payload = JSON.parse(e.data);
          if (payload.stage) setCurrentStage(payload.stage);
          if (payload.log) setLogs((prev) => [...prev, payload.log]);
          if (payload.iteration) setCurrentIteration(payload.iteration);
          if (payload.currentScore) setCurrentScore(payload.currentScore);
        });

        eventSource.addEventListener("complete", (e) => {
          const payload = JSON.parse(e.data);
          setCurrentStage("completed");
          if (payload.similarityScore) setCurrentScore(payload.similarityScore);
          if (payload.files) setFiles(payload.files);
          eventSource.close();
          syncState();
          stopRun();
        });

        eventSource.addEventListener("error", () => {
          eventSource.close();
        });
      } catch {}
    } catch (err: any) {
      setLogs((prev) => [...prev, `[ERROR] ${err.message}`]);
      setIsRunning(false);
      setServerStatus("connected");
    }
  };

  return (
    <div className="studio-layout">
      <Header serverStatus={serverStatus} threshold={similarityThreshold} />

      <div className="studio-main">
        <LeftStudioPanel
          fixtures={fixtures}
          selectedFixtureId={selectedFixtureId}
          onSelectFixture={(id) => {
            setSelectedFixtureId(id);
            setCustomFile(null);
          }}
          customFile={customFile}
          onUploadFile={handleUploadFile}
          previewUrl={targetImageUrl}
          isRunning={isRunning}
          currentStage={currentStage}
          currentIteration={currentIteration}
          maxIterations={maxIterations}
          totalTokens={totalTokens}
          totalCost={totalCost}
          onStartSynthesis={startPipelineRun}
        />

        <RightStudioPanel
          runId={currentRunId}
          overallScore={currentScore}
          ssimScore={ssimScore}
          pixelMatchScore={pixelMatchScore}
          layoutIouScore={layoutIouScore}
          targetImageUrl={targetImageUrl}
          renderedImageUrl={renderedImageUrl}
          diffImageUrl={diffImageUrl}
          files={files}
        />
      </div>

      <DebugDrawer logs={logs} history={history} />
    </div>
  );
}

export default App;
