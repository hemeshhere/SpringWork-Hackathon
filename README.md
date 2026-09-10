# Vendor Request Queue - QA & Bug Fixing Challenge

A full-stack web application designed as a QA testing and bug-fixing sandbox. This repository contains the initial buggy application, the automated test suites designed to catch the bugs, and the patched source code that resolves all identified issues.

##  Overview

The Vendor Request Queue is a state-machine-driven application where requests move through a specific pipeline: `REQUESTED` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `COMPLETED`. 

This project demonstrates the ability to audit an existing codebase, write failing automated tests to prove the existence of bugs, and then implement robust backend and frontend fixes to pass the test suite.

##  Tech Stack

*   **Backend:** Node.js, Express.js
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Testing:** Playwright (UI E2E), Jest (API Integration)

##  Bugs Identified & Resolved

This repository includes fixes for 10 distinct bugs across the frontend and API layers:

1.  **Missing State Check:** API previously allowed assignment to inactive vendors.
2.  **Forward State Machine Violation:** API failed to lock the terminal `COMPLETED` state and allowed backward transitions.
3.  **Missing Enum Validation:** API allowed creation of requests with invalid `checkType` values.
4.  **Aggregate Mismatch (API & UI):** The summary endpoint double-counted `IN_PROGRESS` states, causing a desync between column header counts and actual visible cards.
5.  **UI Filter Failure:** The frontend failed to filter out inactive vendors in the assignment dropdown.
6.  **Missing Sanitization:** API accepted `candidateName` strings containing only empty whitespace.
7.  **Optimistic UI Failure:** The frontend dropdown retained failed vendor selections locally instead of reverting to the server truth.
8.  **Silent Network Failures:** The UI failed to display error banners or toasts when state transitions failed over the network.
9.  **Missing Required Fields:** API allowed creating requests without mandatory `checkType` and `candidateName` payloads.
10. **State Button UI Logic:** Every state button was clickable instead of only the valid "next" state.

##  Getting Started

### Prerequisites
*   Node.js (v16 or higher recommended)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/vendor-request-queue.git
    cd vendor-request-queue
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the server:
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3008`.

### Running the Tests

Ensure the development server is running in a separate terminal before executing the test suites.

**Run API Tests (Jest):**
```bash
npm run test:api
```

**Run UI Tests (Playwright):**
```bash
npx playwright test
```
