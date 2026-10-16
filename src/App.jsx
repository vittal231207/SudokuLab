
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const EMPTY_BOARD = Array(81).fill(0);

const EXAMPLE_PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const copyBoard = (board) => [...board];

function isSafe(board, index, number) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === number) return false;
    if (board[i * 9 + col] === number) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r * 9 + c] === number) return false;
    }
  }

  return true;
}

function findEmpty(board) {
  let bestIndex = -1;
  let bestOptions = null;

  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;

    const options = [];

    for (let n = 1; n <= 9; n++) {
      if (isSafe(board, i, n)) options.push(n);
    }

    if (options.length === 0) return { index: i, options: [] };

    if (bestOptions === null || options.length < bestOptions.length) {
      bestIndex = i;
      bestOptions = options;

      if (options.length === 1) break;
    }
  }

  return bestIndex === -1
    ? null
    : { index: bestIndex, options: bestOptions };
}

function solveBoard(input) {
  const board = copyBoard(input);
  const stats = { calls: 0, backtracks: 0, attempts: 0 };
  const started = performance.now();

  function search() {
    stats.calls++;
    const next = findEmpty(board);

    if (next === null) return true;

    if (next.options.length === 0) {
      stats.backtracks++;
      return false;
    }

    for (const n of next.options) {
      stats.attempts++;
      board[next.index] = n;

      if (search()) return true;

      board[next.index] = 0;
      stats.backtracks++;
    }

    return false;
  }

  const solved = search();
  stats.time = Number((performance.now() - started).toFixed(2));

  return {
    solved,
    solution: solved ? board : null,
    stats,
  };
}

function findConflicts(board) {
  const conflicts = new Set();

  function checkGroup(indices) {
    const seen = new Map();

    for (const index of indices) {
      const value = board[index];
      if (!value) continue;

      if (seen.has(value)) {
        conflicts.add(index);
        conflicts.add(seen.get(value));
      } else {
        seen.set(value, index);
      }
    }
  }

  for (let r = 0; r < 9; r++) {
    checkGroup(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  }

  for (let c = 0; c < 9; c++) {
    checkGroup(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  }

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells = [];

      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          cells.push(r * 9 + c);
        }
      }

      checkGroup(cells);
    }
  }

  return conflicts;
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function generatePuzzle(clues = 35) {
  const bands = shuffle([0, 1, 2]);
  const rows = bands.flatMap((band) =>
    shuffle([0, 1, 2]).map((row) => band * 3 + row)
  );

  const stacks = shuffle([0, 1, 2]);
  const cols = stacks.flatMap((stack) =>
    shuffle([0, 1, 2]).map((col) => stack * 3 + col)
  );

  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const solved = Array(81).fill(0);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const pattern =
        (rows[r] * 3 + Math.floor(rows[r] / 3) + cols[c]) % 9;

      solved[r * 9 + c] = numbers[pattern];
    }
  }

  const puzzle = copyBoard(solved);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));

  positions.slice(clues).forEach((index) => {
    puzzle[index] = 0;
  });

  return { puzzle, solved };
}

function buildSteps(startBoard, solution) {
  const board = copyBoard(startBoard);
  const steps = [];
  const MAX_STEPS = 12000;

  function record(type, index, value, message) {
    if (steps.length >= MAX_STEPS) return;

    steps.push({
      type,
      index,
      value,
      message,
      board: copyBoard(board),
    });
  }

  function search() {
    if (steps.length >= MAX_STEPS) return false;

    const next = findEmpty(board);

    if (next === null) {
      record("solved", -1, 0, "Puzzle solved successfully!");
      return true;
    }

    const { index, options } = next;

    record(
      "select",
      index,
      0,
      `Inspecting row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}.`
    );

    for (const n of options) {
      board[index] = n;

      record(
        "place",
        index,
        n,
        `Trying ${n} at row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}.`
      );

      if (search()) return true;

      board[index] = 0;

      record("backtrack", index, 0, `Backtracking: ${n} leads to a dead end.`);
    }

    return false;
  }

  search();

  if (steps.length >= MAX_STEPS && solution) {
    steps.push({
      type: "solved",
      index: -1,
      value: 0,
      message: "Solution reached.",
      board: copyBoard(solution),
    });
  }

  return steps;
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("sudokulab-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sudokulab-theme", theme);
    } catch {
      // The theme remains usable if browser storage is unavailable.
    }
  }, [theme]);

  const [board, setBoard] = useState(() => copyBoard(EXAMPLE_PUZZLE));
  const [original, setOriginal] = useState(() => copyBoard(EXAMPLE_PUZZLE));
  const [givens, setGivens] = useState(
    () => new Set(EXAMPLE_PUZZLE.map((v, i) => (v ? i : -1)).filter((i) => i >= 0))
  );
  const [difficulty, setDifficulty] = useState("Medium");
  const [message, setMessage] = useState(
    "Ready to solve. Choose a cell or start the visualizer."
  );
  const [activeCell, setActiveCell] = useState(-1);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [fastForward, setFastForward] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [solution, setSolution] = useState(null);
  const [stats, setStats] = useState({
    calls: 0,
    backtracks: 0,
    attempts: 0,
    time: 0,
  });
  const [history, setHistory] = useState([]);
  const [hintCell, setHintCell] = useState(-1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const timerRef = useRef(null);

  const conflicts = useMemo(() => findConflicts(board), [board]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const loadPuzzle = useCallback(
    (nextBoard, nextDifficulty = "Custom", knownSolution = null) => {
      clearTimer();
      setPlaying(false);
      setFastForward(false);

      const next = copyBoard(nextBoard);

      setBoard(next);
      setOriginal(copyBoard(next));
      setGivens(new Set(next.map((v, i) => (v ? i : -1)).filter((i) => i >= 0)));
      setDifficulty(nextDifficulty);
      setMessage("New puzzle loaded. Ready when you are!");
      setActiveCell(-1);
      setSteps([]);
      setStepIndex(-1);
      setSolution(knownSolution);
      setHintCell(-1);
      setStats({ calls: 0, backtracks: 0, attempts: 0, time: 0 });
    },
    [clearTimer]
  );

  const ensureSteps = useCallback(
    (source = original) => {
      const result = solveBoard(source);

      if (!result.solved) {
        setMessage("This board has no valid solution. Check the conflicting cells.");
        setStats(result.stats);
        return false;
      }

      const generatedSteps = buildSteps(source, result.solution);

      setSteps(generatedSteps);
      setStepIndex(-1);
      setSolution(result.solution);
      setStats(result.stats);
      setMessage(`Visualization ready: ${generatedSteps.length.toLocaleString()} steps.`);

      return true;
    },
    [original]
  );

  const goToStep = useCallback(
    (index) => {
      if (!steps.length) return;

      const bounded = Math.max(0, Math.min(index, steps.length - 1));
      const step = steps[bounded];

      setStepIndex(bounded);
      setBoard(copyBoard(step.board));
      setActiveCell(step.index);
      setMessage(step.message);

      if (step.type === "solved") {
        setPlaying(false);
        clearTimer();

        setHistory((prev) =>
          [
            ...prev,
            {
              calls: stats.calls,
              backtracks: stats.backtracks,
              attempts: stats.attempts,
              time: stats.time,
            },
          ].slice(-8)
        );
      }
    },
    [steps, stats, clearTimer]
  );

  const nextStep = useCallback(() => {
    if (!steps.length) {
      if (ensureSteps()) {
        setMessage("Visualization generated. Press Next Step again to begin.");
      }
      return;
    }

    if (stepIndex >= steps.length - 1) {
      setMessage("End of visualization. Press Replay to run it again.");
      return;
    }

    goToStep(stepIndex + 1);
  }, [steps, stepIndex, ensureSteps, goToStep]);

  const replay = useCallback(() => {
    clearTimer();
    setPlaying(false);

    if (!steps.length) {
      if (!ensureSteps()) return;
    } else {
      setBoard(copyBoard(original));
      setStepIndex(-1);
      setActiveCell(-1);
      setMessage("Replay ready. Press Play or Next Step.");
    }
  }, [clearTimer, steps.length, ensureSteps, original]);

  const togglePlayback = useCallback(() => {
    if (playing) {
      clearTimer();
      setPlaying(false);
      setMessage("Playback paused.");
      return;
    }

    if (!steps.length) {
      if (!ensureSteps()) return;
      setMessage("Steps generated. Press Play again to start playback.");
      return;
    }

    if (stepIndex >= steps.length - 1) {
      setBoard(copyBoard(original));
      setStepIndex(-1);
    }

    setPlaying(true);
  }, [playing, clearTimer, steps.length, ensureSteps, stepIndex, original]);

  useEffect(() => {
    if (!playing || !steps.length) return undefined;

    const delay = fastForward ? 15 : Math.max(70, 950 - speed * 150);

    timerRef.current = setInterval(() => {
      setStepIndex((current) => {
        const next = current + 1;

        if (next >= steps.length) {
          clearTimer();
          setPlaying(false);
          return current;
        }

        const step = steps[next];

        setBoard(copyBoard(step.board));
        setActiveCell(step.index);
        setMessage(step.message);

        if (step.type === "solved") {
          clearTimer();
          setPlaying(false);

          setHistory((prev) =>
            [
              ...prev,
              {
                calls: stats.calls,
                backtracks: stats.backtracks,
                attempts: stats.attempts,
                time: stats.time,
              },
            ].slice(-8)
          );
        }

        return next;
      });
    }, delay);

    return () => clearTimer();
  }, [playing, steps, speed, fastForward, clearTimer, stats]);

  const handleInput = (index, value) => {
    if (givens.has(index)) return;

    const number = value === "" ? 0 : Number(value);

    if (number !== 0 && (!Number.isInteger(number) || number < 1 || number > 9)) {
      return;
    }

    clearTimer();
    setPlaying(false);
    setSteps([]);
    setStepIndex(-1);
    setSolution(null);
    setHintCell(-1);

    setBoard((prev) => {
      const next = copyBoard(prev);
      next[index] = number;
      return next;
    });

    setOriginal((prev) => {
      const next = copyBoard(prev);
      next[index] = number;
      return next;
    });

    setMessage("Board updated. Validate it or generate a new visualization.");
  };

  const validateBoard = () => {
    if (conflicts.size > 0) {
      setMessage(
        `Found ${conflicts.size} conflicting cells. Try correcting the highlighted numbers.`
      );
      return;
    }

    if (board.some((n) => n === 0)) {
      setMessage("No conflicts found so far, but the puzzle is not complete.");
      return;
    }

    setMessage("Congratulations! The completed board has no conflicts.");
  };

  const showSolution = () => {
    clearTimer();
    setPlaying(false);

    const result = solveBoard(original);
    setStats(result.stats);

    if (!result.solved) {
      setMessage("This puzzle has no solution. Check the original board.");
      return;
    }

    const animation = buildSteps(original, result.solution);

    setSteps(animation);
    setStepIndex(animation.length - 1);
    setSolution(result.solution);
    setBoard(copyBoard(result.solution));
    setActiveCell(-1);
    setMessage("Solution revealed! Press Replay to watch the solving process.");

    setHistory((prev) =>
      [
        ...prev,
        {
          calls: result.stats.calls,
          backtracks: result.stats.backtracks,
          attempts: result.stats.attempts,
          time: result.stats.time,
        },
      ].slice(-8)
    );
  };

  const giveHint = () => {
    const result = solveBoard(board);

    if (!result.solved) {
      setMessage("No valid solution found. Fix conflicts before requesting a hint.");
      return;
    }

    const emptyCells = board
      .map((v, i) => (v === 0 ? i : -1))
      .filter((i) => i >= 0);

    if (!emptyCells.length) {
      setMessage("There are no empty cells left!");
      return;
    }

    const index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const next = copyBoard(board);

    next[index] = result.solution[index];

    clearTimer();
    setPlaying(false);
    setBoard(next);
    setOriginal(copyBoard(next));
    setGivens((prev) => new Set([...prev, index]));
    setHintCell(index);
    setMessage(
      `Hint added at row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}.`
    );
    setSteps([]);
    setStepIndex(-1);
    setSolution(result.solution);
    setStats(result.stats);
  };

  const randomPuzzle = () => {
    const clueCount =
      difficulty === "Easy" ? 42 : difficulty === "Hard" ? 28 : 35;

    const generated = generatePuzzle(clueCount);

    loadPuzzle(generated.puzzle, difficulty, generated.solved);
    setMessage(`Random ${difficulty.toLowerCase()} puzzle generated!`);
  };

  const resetPuzzle = () => {
    clearTimer();
    setPlaying(false);
    setFastForward(false);
    setBoard(copyBoard(original));
    setSteps([]);
    setStepIndex(-1);
    setActiveCell(-1);
    setHintCell(-1);
    setMessage("Puzzle reset to its current starting board.");
  };

  const clearBoard = () => {
    loadPuzzle(EMPTY_BOARD, "Custom");
    setMessage("Empty board ready. Enter numbers to create your own puzzle.");
  };

  const progress = steps.length
    ? Math.round(((stepIndex + 1) / steps.length) * 100)
    : 0;

  return (
    <main className={`app-shell theme-${theme}`}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">▦</div>
          <div>
            <h1>
              Sudoku<span>Lab</span>
            </h1>
            <p>ALGORITHM VISUALIZER</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <div className="status-pill">
            <span className="status-dot" />
            INTERACTIVE SOLVER
          </div>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">DSA PROJECT · BACKTRACKING</div>
          <h2>
            See the algorithm
            <br />
            <span>think.</span>
          </h2>
          <p>
            Explore how recursive backtracking solves Sudoku, one decision at a
            time.
          </p>
        </div>

        <div className="hero-badge">
          <div className="badge-grid">
            {[5, 0, 2, 0, 7, 0, 1, 0, 9].map((n, i) => (
              <span key={i}>{n || ""}</span>
            ))}
          </div>
          <div>
            <strong>9 × 9</strong>
            <small>LOGIC GRID</small>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon">↻</span>
          <div>
            <p>Recursive Calls</p>
            <strong>{stats.calls.toLocaleString()}</strong>
            <small>Function invocations</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon">↶</span>
          <div>
            <p>Backtracks</p>
            <strong>{stats.backtracks.toLocaleString()}</strong>
            <small>Dead ends reversed</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon">⌁</span>
          <div>
            <p>Attempts</p>
            <strong>{stats.attempts.toLocaleString()}</strong>
            <small>Candidate placements</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon">◷</span>
          <div>
            <p>Execution Time</p>
            <strong>
              {stats.time.toFixed(2)}
              <small className="unit"> ms</small>
            </strong>
            <small>Solver runtime</small>
          </div>
        </article>
      </section>

      <section className="workspace">
        <div className="panel board-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">01 / PUZZLE</span>
              <h3>Sudoku Board</h3>
            </div>
            <span className="difficulty-tag">{difficulty}</span>
          </div>

          <div className="board" role="grid" aria-label="Sudoku board">
            {board.map((value, index) => {
              const row = Math.floor(index / 9);
              const col = index % 9;
              const selected = activeCell === index;

              const related =
                activeCell >= 0 &&
                (Math.floor(activeCell / 9) === row ||
                  activeCell % 9 === col ||
                  (Math.floor(Math.floor(activeCell / 9) / 3) ===
                    Math.floor(row / 3) &&
                    Math.floor((activeCell % 9) / 3) === Math.floor(col / 3)));

              const classNames = [
                "cell",
                givens.has(index) ? "given" : "editable",
                conflicts.has(index) ? "conflict" : "",
                selected ? "active" : "",
                related ? "related" : "",
                hintCell === index ? "hint-cell" : "",
                col === 2 || col === 5 ? "box-right" : "",
                row === 2 || row === 5 ? "box-bottom" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <input
                  key={index}
                  className={classNames}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Row ${row + 1}, column ${col + 1}`}
                  value={value || ""}
                  onFocus={() => setActiveCell(index)}
                  onChange={(event) =>
                    handleInput(index, event.target.value.replace(/[^1-9]/g, ""))
                  }
                />
              );
            })}
          </div>

          <div className="legend">
            <span>
              <i className="legend-given" /> Given
            </span>
            <span>
              <i className="legend-editable" /> Editable
            </span>
            <span>
              <i className="legend-conflict" /> Conflict
            </span>
          </div>

          <div className="board-actions">
            <label className="select-wrap">
              <span>Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>

            <button className="btn btn-secondary" onClick={randomPuzzle}>
              ⟳ Random Puzzle
            </button>
          </div>

          <div className="button-row">
            <button className="btn btn-primary" onClick={showSolution}>
              ✓ Show Solution
            </button>
            <button className="btn btn-secondary" onClick={giveHint}>
              ✦ Hint
            </button>
          </div>

          <div className="button-row">
            <button className="btn btn-secondary" onClick={validateBoard}>
              Validate
            </button>
            <button className="btn btn-secondary" onClick={resetPuzzle}>
              ↺ Reset
            </button>
            <button className="btn btn-quiet" onClick={clearBoard}>
              Clear
            </button>
          </div>
        </div>

        <div className="panel visualizer-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">02 / EXECUTION</span>
              <h3>Algorithm Visualizer</h3>
            </div>

            <span className={`run-tag ${playing ? "is-running" : ""}`}>
              <i /> {playing ? "RUNNING" : "READY"}
            </span>
          </div>

          <div className="algorithm-card">
            <div className="algorithm-icon">⌘</div>
            <div>
              <strong>Recursive Backtracking</strong>
              <p>Depth-first search with constraint checking</p>
            </div>
          </div>

          <div className="progress-heading">
            <span>Execution Progress</span>
            <strong>{progress}%</strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progress}%` }} />
          </div>

          <p className="step-counter">
            {steps.length
              ? `Step ${Math.max(0, stepIndex + 1)} of ${steps.length.toLocaleString()}`
              : "No steps generated yet"}
          </p>

          <div className="control-grid">
            <button className="btn btn-primary play-button" onClick={togglePlayback}>
              {playing ? "Ⅱ Pause" : "▶ Play"}
            </button>

            <button className="btn btn-secondary" onClick={nextStep}>
              Next Step →
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                if (!steps.length) {
                  if (!ensureSteps()) return;
                  setFastForward(true);
                  setPlaying(true);
                } else {
                  setFastForward((prev) => !prev);
                  if (!playing) setPlaying(true);
                }
              }}
            >
              {fastForward ? "⏩ Fast mode ON" : "⏩ Fast Forward"}
            </button>

            <button className="btn btn-secondary" onClick={replay}>
              ↻ Replay
            </button>
          </div>

          <div className="speed-control">
            <div>
              <label htmlFor="speed">Playback Speed</label>
              <span>{speed}/6</span>
            </div>

            <input
              id="speed"
              type="range"
              min="1"
              max="6"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />

            <div className="range-labels">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="step-message">
            <div className="message-icon">i</div>
            <div>
              <strong>Current Step</strong>
              <p>{message}</p>
            </div>
          </div>

          <div className="algorithm-note">
            <strong>How it works</strong>
            <p>
              The solver selects an empty cell, tries a valid number, and
              recursively continues. If a choice leads to a dead end, it
              backtracks and tests another candidate.
            </p>
          </div>
        </div>
      </section>

      <section className="panel analytics-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">03 / INSIGHTS</span>
            <h3>Solver Analytics</h3>
          </div>

          <button
            className="btn btn-secondary small-btn"
            onClick={() => setShowAnalytics((v) => !v)}
          >
            {showAnalytics ? "Hide Details" : "Show Details"}
          </button>
        </div>

        <div className="analytics-grid">
          <div className="analytics-metric">
            <span>Candidate Attempts</span>
            <strong>{stats.attempts.toLocaleString()}</strong>
            <div className="mini-bar">
              <i
                style={{
                  width: `${Math.min(
                    100,
                    (stats.attempts / Math.max(1, stats.calls)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="analytics-metric">
            <span>Backtracking Rate</span>
            <strong>
              {stats.calls
                ? `${((stats.backtracks / stats.calls) * 100).toFixed(1)}%`
                : "0.0%"}
            </strong>
            <div className="mini-bar">
              <i
                style={{
                  width: `${
                    stats.calls
                      ? Math.min((stats.backtracks / stats.calls) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="analytics-metric">
            <span>Cells Filled</span>
            <strong>{board.filter(Boolean).length}/81</strong>
            <div className="mini-bar">
              <i style={{ width: `${(board.filter(Boolean).length / 81) * 100}%` }} />
            </div>
          </div>
        </div>

        {showAnalytics && (
          <div className="history-section">
            <h4>Recent Solver Runs</h4>

            {history.length ? (
              <div className="history-list">
                {history
                  .slice()
                  .reverse()
                  .map((item, i) => (
                    <div className="history-row" key={`${item.time}-${i}`}>
                      <span>Run {history.length - i}</span>
                      <span>{item.calls.toLocaleString()} calls</span>
                      <span>{item.backtracks.toLocaleString()} backtracks</span>
                      <span>{item.time.toFixed(2)} ms</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="muted">Solve or reveal a puzzle to record a run.</p>
            )}
          </div>
        )}
      </section>

      <footer className="footer">
        <div>
          <strong>SudokuLab</strong>
          <span> A visual approach to recursive backtracking.</span>
        </div>
        <span>BUILT WITH REACT · DSA</span>
      </footer>
    </main>
  );
}

export default App;
