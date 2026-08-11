# Design Spec: Fix Lag and Duplicate Phases in NhatKy Task Detail

## 1. Problem Statement
When a user clicks "⚙️ Việc này phức tạp? Chia giai đoạn/bước" (`upgradeToPhases`) in `nhatky/index.html`:
- The UI does not update immediately ("lag" / no visual response).
- Upon reloading the page, multiple duplicate "Thực hiện" phases appear (e.g. 8 identical "Thực hiện 0/0" sections).

## 2. Root Cause Analysis
1. **Uncaught ReferenceError**: `updatePlanPhases` in `nhatky/index.html` invokes `openTaskDetail(planId)`. `openTaskDetail` does not exist in `nhatky/index.html` (the correct function name is `renderDetailScreen(planId)`).
2. **Execution Halt & Missing UI Refresh**: Calling `openTaskDetail` throws `Uncaught ReferenceError: openTaskDetail is not defined`, halting JavaScript execution. As a result, the detail screen is never re-rendered synchronously to show the newly created phase.
3. **Duplicate Accumulation**: Before throwing the `ReferenceError`, `updatePlanPhases` mutates `plan.phases` in memory and saves it to `localStorage` via `saveToCache()`. Because the UI stays stuck on the initial state, users click the button repeatedly. Each click appends another default phase (`{ id: "PHASE-...", name: "Thực hiện", ... }`).
4. **Lack of Idempotency**: `upgradeToPhases` did not check `if (phases.length === 0)` before pushing a default phase.
5. **No Cleanup for Existing Corrupted State**: Tasks previously affected by this bug remain stored in `localStorage` and backend with multiple duplicate empty default phases.

## 3. Proposed Fix
1. **Replace Function Reference**: Replace all invalid calls to `openTaskDetail(planId)` with `renderDetailScreen(planId)` in `nhatky/index.html`.
2. **Track Currently Open Plan**: In `renderDetailScreen(id)`, set `window.currentOpenPlanId = id` (and clear it when leaving detail screen) so background updates (e.g. `loadStaff`) can re-render properly.
3. **Ensure Idempotency**: Update `upgradeToPhases(planId)` to check `if (phases.length === 0)` before pushing a new phase.
4. **Auto-Deduplicate Corrupted Phases**: When reading/parsing `planPhases(plan)`, automatically deduplicate or prune consecutive empty default phases (phases with name "Thực hiện" and empty `steps` array) if more than one exists without user content.

## 4. Verification Plan
- Automated Test: Run Playwright test in `tests/nhatky.spec.js` simulating clicking `upgradeToPhases` and verifying immediate UI update and absence of duplicate phases.
- Manual Verification: Test in browser/preview.
