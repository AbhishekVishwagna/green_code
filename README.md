# GreenCode
Every time your code runs on a computer or server, it uses electricity. Inefficient code uses way more electricity than it needs to — and that adds up to a lot of CO₂ in the atmosphere. CodeGreen teaches you how to spot and fix those hidden energy wasters, one line at a time.

*   **Score:** 95/100
*   **Reward:** +5 Carbon Credits![cite: 1]

---

## 🌍 Why GreenCode?

Data centers account for nearly **2% of global greenhouse gas emissions**. Inefficient software is a major contributor. **GreenCode** shifts the responsibility to the development phase, empowering engineers to write "Cooler" code that runs faster and consumes less electricity.[cite: 1]

---

# 🌿 GreenCode: Green Software Credit System

**GreenCode** is a privacy-first, in-browser static analysis tool designed to audit source code for energy efficiency. By identifying "Carbon Leaks" (inefficient algorithmic patterns), it helps developers reduce the digital carbon footprint of their applications and rewards sustainable coding practices with **Carbon Credits**.

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/frontend-React-blue)
![Python](https://img.shields.io/badge/engine-Python-yellow)
![BrowserPod](https://img.shields.io/badge/sandbox-BrowserPod-brightgreen)

---

## 🚀 Key Features

*   **In-Browser Analysis:** Leverages **BrowserPod** to run a full Linux-based Python environment directly in your browser. Your code never leaves your machine.[cite: 1]
*   **Green Score (10-100):** A sophisticated scoring engine that evaluates code based on CPU instructional footprint, memory management, and algorithmic complexity.[cite: 1]
*   **Carbon Credits:** Earn digital credits for every optimization made.
*   **Real-time Suggestions:** Provides actionable feedback to refactor inefficient loops, redundant imports, and memory-heavy operations.[cite: 1]
*   **Zero Infrastructure:** No backend server required for analysis—eliminating the carbon cost of traditional cloud-based auditors.[cite: 1]

---

## 🛠️ The "Green Rules" (Audit Logic)

Our auditor analyzes code against industry-standard efficiency patterns:
*   **Complexity Guard:** Penalizes nested loops ($O(n^2)$ patterns) that cause exponential CPU thermal draw.[cite: 1]
*   **Memory Management:** Detects "Memory Spikes" caused by loading entire datasets into RAM (e.g., `.readlines()`) vs. lazy loading.[cite: 1]
*   **Quadratic String Trap:** Deducts points for inefficient string concatenation in loops.[cite: 1]
*   **Algorithmic Optimization:** Rewards the use of Sets for $O(1)$ lookups and built-in C-optimized functions like `.join()`, `sum()`, and `map()`.[cite: 1]

---

## 🏗️ Project Structure
```text
Green Software Credit System/
├── gscs-frontend/         # React + Tailwind CSS UI
│   ├── src/               # UI Components & BrowserPod Integration
│   └── public/            # Static assets
└── gscs-backend/          # Python Logic (Runs inside BrowserPod)
    ├── core/
    │   ├── auditor.py     # Main Static Analysis Engine (AST)
    │   ├── scanner.py     # Code pattern matcher
    │   └── scorer.py      # Scoring & Credit calculation logic
    └── config/
        └── rules.json     # Configurable efficiency rules
