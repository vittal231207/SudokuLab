
# SudokuLab

An interactive Sudoku solver that visualizes recursive backtracking step by step.

SudokuLab demonstrates how a backtracking algorithm explores possible number placements, handles dead ends, and finds a valid solution through recursion.

## Features

- **Interactive Sudoku Board** — Enter numbers, select cells, and edit custom puzzles.
- **Recursive Backtracking** — Visualize the algorithm's decision-making process.
- **Step-by-Step Execution** — Play, pause, advance, replay, and fast-forward through the solving process.
- **Random Puzzle Generation** — Generate Sudoku puzzles with different difficulty settings.
- **Hints and Solutions** — Reveal a hint, view the complete solution, or validate your board.
- **Solver Analytics** — Track recursive calls, candidate attempts, backtracks, and execution time.
- **Execution History** — Review recent solver runs.
- **Light and Dark Themes** — Switch between warm light and near-black dark modes, with your preference saved.
- **Responsive Interface** — Use the application across different screen sizes.

## Tech Stack

- React
- JavaScript
- Vite
- CSS
- Recursive Backtracking
- Depth-First Search (DFS)

## Getting Started

### Prerequisites

Install [Node.js](https://nodejs.org/) and npm.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/vittal231207/SudokuLab.git
   ```

2. Open the project directory:

   ```bash
   cd SudokuLab
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in your terminal.

### Production Build

To create a production build, run:

```bash
npm run build
```

## How It Works

SudokuLab uses recursive backtracking to solve Sudoku puzzles.

1. Find an empty cell.
2. Identify numbers that satisfy the row, column, and 3 × 3 box constraints.
3. Place a valid candidate and recursively solve the remaining board.
4. If a candidate leads to a dead end, undo the placement and try another candidate.
5. Continue until the puzzle is solved or no valid solution exists.

The visualizer records algorithmic steps so you can explore this process interactively.

## Project Structure

```text
SudokuLab/
├── public/
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── LICENSE
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
