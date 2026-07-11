# DONE: Task 8.1 — Work Orders Backend API (GAS)

**Completed:** 2026-05-11  
**Commit:** `feat: add Work Orders and Inventory API to GAS backend`  
**Branch:** master (pushed)

## What was done

Added 4 new API actions to `GAS_Backend.js` while preserving all existing logic:

### doGet — new actions

| Action | Description |
|--------|-------------|
| `getWorkOrders` | Returns all rows from the `WorkOrders` sheet. When `role=Technician` and `username` are passed, filters to only rows where `AssignedTo` matches the user. |
| `getInventory` | Returns all rows from the `Inventory` sheet. Column headers from row 1 are used as JSON keys (dynamic columns). |

### doPost — new actions

| Action | Description |
|--------|-------------|
| `createWO` | Creates a new Work Order row in `WorkOrders` sheet. Auto-generates `WO_ID` in format `WO-YYYYMM-NNNNN` (NNNNN = padded last row count). Defaults: priority=Medium, status=New. Writes an AuditLog entry. Returns `{ status, woId }`. |
| `updateWOStatus` | Finds WO by `woId`, updates column D (Status). Writes an AuditLog entry with status + optional notes. Returns error if WO not found. |

### writeAuditLog helper

New private function appends to `AuditLog` sheet (Timestamp, User, Action, Target, Details). Errors are silently caught so audit failure never blocks the main response.

## Design decisions

- All endpoints still check `token === API_TOKEN` first (doGet via parameter, doPost via JSON body).
- Inventory uses dynamic headers so the sheet schema is not hard-coded in GAS.
- WO_ID sequence uses `getLastRow()` (total rows including header) — simple, monotonically increasing within a month, no lock needed for low-volume CMMS use.
- `writeAuditLog` is non-fatal by design; a missing AuditLog sheet does not break WO operations.
