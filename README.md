# 🌿 GreenCode: Green Software Credit System

**GreenCode** is a privacy-first, in-browser static analysis tool designed to audit Python code for energy efficiency. By identifying "Carbon Leaks"—inefficient algorithmic patterns that cause unnecessary CPU load—it empowers developers to reduce their digital carbon footprint and rewards sustainable coding with **Carbon Credits**.

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/frontend-React-blue)
![Python](https://img.shields.io/badge/engine-Python-yellow)
![BrowserPod](https://img.shields.io/badge/sandbox-BrowserPod-brightgreen)

---

## 🚀 Key Features

*   **Client-Side Compute:** Powered by **BrowserPod**, the analysis runs in a virtualized Linux container entirely within the user's browser tab.
*   **Absolute Privacy:** Sensitive source code never leaves the local machine; no data is uploaded to external servers for auditing.
*   **Granular Energy Scoring (10-100):** A sophisticated engine evaluates code against 30+ "Green Rules" covering complexity, memory thrashing, and I/O efficiency.
*   **Actionable Refactoring:** Provides real-time suggestions to transform "Carbon Monster" code into "Green Master" code.
*   **Digital Sustainability Ledger:** Tracks optimization progress and awards credits based on calculated energy savings.

---

## 🏗️ Technical Architecture

The project is split into two primary environments that communicate via the BrowserPod SDK:

### **1. Frontend (gscs-frontend)**
Built with **React** and **Tailwind CSS**, it handles the user interface, code editing (via Monaco/CodeMirror), and visualizes the energy audit results.

### **2. Auditor Engine (gscs-backend)**
A Python-based logic core that runs inside the **BrowserPod** sandbox.
*   `auditor.py`: Parses code into an Abstract Syntax Tree (AST) to identify structural inefficiencies.
*   `scorer.py`: Applies penalties and bonuses to generate the 10-100 efficiency score.
*   `scanner.py`: Detects specific patterns like nested loops, redundant imports, and immutable string traps.

---

## 🛠️ The Green Scoring Logic

Our auditor targets physical hardware behaviors to ensure 90-95% accuracy in energy estimation:

*   **Quadratic Penalty (-35 pts):** Detects $O(n^2)$ nested loops that exponentially increase CPU thermal output.
*   **Memory Spike Penalty (-30 pts):** Flags operations that load massive datasets into RAM (like `.readlines()`) instead of using lazy evaluation.
*   **I/O Bottleneck Penalty (-25 pts):** Deducts points for `print` or network calls inside high-frequency loops.
*   **C-Optimization Bonus (+10 pts):** Rewards the use of native, energy-efficient functions like `sum()`, `map()`, or `.join()`.

---

## 🚦 Getting Started

### Prerequisites
*   **Node.js** (v18.0.0 or higher)
*   **Git**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/greencode.git
    cd greencode
    ```

2.  **Install & Run Frontend:**
    ```bash
    cd gscs-frontend
    npm install
    npm run dev
    ```

3.  **Analyze Code:**
    Open the local server URL. The **BrowserPod** will initialize automatically. Paste your Python code to start the "Green Audit."

---

## 👥 The Team

*   **Abhishek Basavaraj Vishwagna** 
*   **Siddhant**

