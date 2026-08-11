# Implementation Plan: Fix Lag and Duplicate Phases in NhatKy Task Detail

Fix the "Chia giai đoạn/bước" button lag and duplicate phase issue in `nhatky/index.html` caused by an undefined `openTaskDetail` call and non-idempotent phase upgrade logic.

## Proposed Changes

### Component: NhatKy Frontend (`nhatky/index.html`)

#### [MODIFY] [index.html](file:///d:/Claude/1_Projects/scan/02_Source/nhatky/index.html)
- Replace all calls of `openTaskDetail(...)` with `renderDetailScreen(...)`.
- Set `window.currentOpenPlanId = id` inside `renderDetailScreen(id)` and reset `window.currentOpenPlanId = null` in `navigateToMain()`.
- Update `upgradeToPhases(planId)` to enforce `if (phases.length === 0)` guard.
- Update `planPhases(plan)` to automatically clean up duplicate empty default phases ("Thực hiện" with 0 steps) when loading/rendering.

### Component: Automated Tests (`tests/nhatky.spec.js`)

#### [MODIFY] [nhatky.spec.js](file:///d:/Claude/1_Projects/scan/02_Source/tests/nhatky.spec.js)
- Add E2E test verifying clicking "Chia giai đoạn/bước" immediately renders the phase list without lag or console errors, and clicking multiple times does not create duplicate phases.

## Verification Plan

### Automated Tests
- Run `npx playwright test tests/nhatky.spec.js`
