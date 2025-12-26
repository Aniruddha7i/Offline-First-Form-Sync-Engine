# SiteMaster Offline-First Sync Engine

An offline-first form application built with **React (Vite) + Dexie.js (IndexedDB)** on the frontend and **FastAPI + SQLite** on the backend. 

This system guarantees data integrity even when users create, edit, or delete items while disconnected from the internet.

## 🚀 Features

* **Offline-First Architecture:** Users can fully interact with the app without an internet connection.
* **Optimistic UI:** Changes are applied immediately to the local UI while being queued for background sync.
* **Operation-Based Sync:** Synchronization is performed by replaying an append-only log of operations (`CREATE`, `UPDATE`, `DELETE`), not just by overwriting state.
* **Robust Conflict Resolution:** Implements a deterministic strategy to handle concurrent edits and offline deletions.
* **Idempotency:** The backend tracks processed Operation IDs (`opId`) to safely handle network retries and duplicate requests.

---

## 🛠 Tech Stack

**Frontend:**
* **React + TypeScript:** For a type-safe, component-based UI.
* **Dexie.js (IndexedDB):** For reliable, persistent local storage.
* **Tailwind CSS:** For clean, responsive styling.
* **Vite:** For fast build tooling.

**Backend:**
* **FastAPI:** For a high-performance, stateless REST API.
* **SQLite:** For persistent server-side storage (file-based for portability).
* **SQLAlchemy:** ORM for database interactions.
* **Pydantic:** For strict data validation.

---

## 🧠 Design & Architecture

### 1. Data Model
The system uses two primary data structures:
* **Items (State):** The current snapshot of the data (e.g., `{ id, title, description, version }`).
* **Mutation Queue (Log):** An ordered list of actions pending synchronization (e.g., `{ type: 'UPDATE', payload: {...}, timestamp: '...' }`).

### 2. Synchronization Protocol
The sync process follows a **Client-Push / Server-Authoritative** model:
1.  **Queue:** When a user modifies data, an Operation is added to the local IndexedDB `mutationQueue`.
2.  **Push:** When online, the client sends all pending operations to `POST /sync`.
3.  **Process:** The server:
    * Checks if the `opId` was already processed (Idempotency).
    * Replays valid operations against the database.
    * Resolves conflicts (see below).
4.  **Reconcile:** The server responds with the **Authoritative State** and a list of **Acknowledged Ops**. The client clears the acknowledged ops and updates its local view to match the server.

### 3. Conflict Resolution Strategy (Mandatory)
We implement a **Deterministic Last-Write-Wins (LWW)** strategy with **Delete-Wins** precedence.

* **Scenario A: Concurrent Updates**
    * *Rule:* Last Write Wins.
    * *Logic:* If two clients update the same field, the operation with the later `timestamp` is applied. In a production environment, we would use Vector Clocks, but Client Timestamp is sufficient for this scope.
    
* **Scenario B: Update vs. Delete**
    * *Rule:* Delete Wins.
    * *Logic:* If an item is marked `deleted=True` on the server, any incoming `UPDATE` operations for that ID are rejected. You cannot update a dead item.

* **Scenario C: Create Existing**
    * *Rule:* Treat as Update.
    * *Logic:* If a `CREATE` op arrives for an ID that already exists (e.g., duplicate sync or UUID collision), it is treated as an `UPDATE` to ensure data convergence.

---

## 📦 Setup & Installation

### Prerequisites
* Node.js (v16+)
* Python (v3.9+)

### 1. Backend Setup
```bash
cd server
python -m venv venv

# Windows
.\venv\Scripts\activate

pip install -r requirements.txt
python main.py