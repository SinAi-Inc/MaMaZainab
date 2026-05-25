# API Reference — MaMa Zainab Admin UI

> Auto-generated — do not edit by hand. Run `python Doc/scripts/generate_docs.py --section api` to refresh.
> Last generated: 2026-05-25

> Base URL (prod): `https://ma-ma-zainab.vercel.app`  
> Base URL (local): `http://localhost:3333`

---

## HTTP Routes

| Path | Methods | Source |
|------|---------|--------|
| `/api/auth/login` | `POST` | `11_AdminUI\app\api\auth\login\route.ts` |
| `/api/auth/logout` | `POST` | `11_AdminUI\app\api\auth\logout\route.ts` |
| `/api/dev/char-prompt` | `GET` | `11_AdminUI\app\api\dev\char-prompt\route.ts` |
| `/api/dev/char-render` | `GET` | `11_AdminUI\app\api\dev\char-render\route.ts` |
| `/api/generate/image` | `POST` | `11_AdminUI\app\api\generate\image\route.ts` |
| `/api/generate/video/[reqId]` | `GET` | `11_AdminUI\app\api\generate\video\[reqId]\route.ts` |
| `/api/generate/video` | `POST` | `11_AdminUI\app\api\generate\video\route.ts` |
| `/api/menu/sync` | `POST` | `11_AdminUI\app\api\menu\sync\route.ts` |
| `/api/notify` | `POST` | `11_AdminUI\app\api\notify\route.ts` |
| `/api/validate-models` | `GET` | `11_AdminUI\app\api\validate-models\route.ts` |

---

## Server Actions

| Action | File |
|--------|------|
| `saveBranch` | `11_AdminUI\lib\branches\actions.ts` |
| `deleteBranch` | `11_AdminUI\lib\branches\actions.ts` |
| `createCharacter` | `11_AdminUI\lib\characters\actions.ts` |
| `updateCharacter` | `11_AdminUI\lib\characters\actions.ts` |
| `deleteCharacter` | `11_AdminUI\lib\characters\actions.ts` |
| `toggleCharacterActive` | `11_AdminUI\lib\characters\actions.ts` |
| `uploadCharacterImage` | `11_AdminUI\lib\characters\actions.ts` |
| `regenerateCharacterReference` | `11_AdminUI\lib\characters\actions.ts` |
| `validateCharacterRender` | `11_AdminUI\lib\characters\actions.ts` |
| `deleteContact` | `11_AdminUI\lib\contacts\actions.ts` |
| `saveGeneratedImage` | `11_AdminUI\lib\generations\actions.ts` |
| `recordGeneration` | `11_AdminUI\lib\generations\actions.ts` |
| `getHistory` | `11_AdminUI\lib\generations\actions.ts` |
| `removeHistoryEntry` | `11_AdminUI\lib\generations\actions.ts` |
| `clearHistory` | `11_AdminUI\lib\generations\actions.ts` |
| `createCategory` | `11_AdminUI\lib\menu\actions.ts` |
| `updateCategory` | `11_AdminUI\lib\menu\actions.ts` |
| `deleteCategory` | `11_AdminUI\lib\menu\actions.ts` |
| `reorderCategories` | `11_AdminUI\lib\menu\actions.ts` |
| `createItem` | `11_AdminUI\lib\menu\actions.ts` |
| `updateItem` | `11_AdminUI\lib\menu\actions.ts` |
| `deleteItem` | `11_AdminUI\lib\menu\actions.ts` |
| `toggleItemAvailable` | `11_AdminUI\lib\menu\actions.ts` |
| `assignItemSku` | `11_AdminUI\lib\menu\actions.ts` |
| `uploadItemImage` | `11_AdminUI\lib\menu\actions.ts` |
| `getPartnerSettings` | `11_AdminUI\lib\partners\actions.ts` |
| `updatePartnerSettings` | `11_AdminUI\lib\partners\actions.ts` |
| `authenticatePartnerPortal` | `11_AdminUI\lib\partners\actions.ts` |
| `saveSettings` | `11_AdminUI\lib\settings\actions.ts` |
| `terminateOtherSessions` | `11_AdminUI\lib\settings\actions.ts` |
| `submitVideoJob` | `11_AdminUI\lib\video\actions.ts` |
| `pollVideoJob` | `11_AdminUI\lib\video\actions.ts` |
| `cancelVideoJob` | `11_AdminUI\lib\video\actions.ts` |
| `deleteVideoJob` | `11_AdminUI\lib\video\actions.ts` |
| `listVideoJobs` | `11_AdminUI\lib\video\actions.ts` |
| `getProjectSpend` | `11_AdminUI\lib\video\actions.ts` |
| `createProject` | `11_AdminUI\lib\videos\actions.ts` |
| `updateProject` | `11_AdminUI\lib\videos\actions.ts` |
| `deleteProject` | `11_AdminUI\lib\videos\actions.ts` |
| `setProjectStatus` | `11_AdminUI\lib\videos\actions.ts` |
| `reparseProjectScript` | `11_AdminUI\lib\videos\actions.ts` |
| `loadScriptFromRepo` | `11_AdminUI\lib\videos\actions.ts` |
| `updateScene` | `11_AdminUI\lib\videos\actions.ts` |
| `deleteScene` | `11_AdminUI\lib\videos\actions.ts` |
| `createShot` | `11_AdminUI\lib\videos\actions.ts` |
| `updateShot` | `11_AdminUI\lib\videos\actions.ts` |
| `deleteShot` | `11_AdminUI\lib\videos\actions.ts` |
| `setShotStatus` | `11_AdminUI\lib\videos\actions.ts` |
| `updateShotAudio` | `11_AdminUI\lib\videos\actions.ts` |
| `generateTake` | `11_AdminUI\lib\videos\actions.ts` |
| `pollTake` | `11_AdminUI\lib\videos\actions.ts` |
| `updateTake` | `11_AdminUI\lib\videos\actions.ts` |
| `deleteTake` | `11_AdminUI\lib\videos\actions.ts` |
| `approveTake` | `11_AdminUI\lib\videos\actions.ts` |
| `setTakeStatus` | `11_AdminUI\lib\videos\actions.ts` |
| `uploadTakeVideo` | `11_AdminUI\lib\videos\actions.ts` |
| `uploadShotReference` | `11_AdminUI\lib\videos\actions.ts` |
| `uploadProjectPoster` | `11_AdminUI\lib\videos\actions.ts` |
| `uploadScriptFile` | `11_AdminUI\lib\videos\actions.ts` |
| `generateShotViaProvider` | `11_AdminUI\lib\videos\actions.ts` |
| `syncTakeFromProvider` | `11_AdminUI\lib\videos\actions.ts` |
| `generateAllPendingShots` | `11_AdminUI\lib\videos\actions.ts` |
| `getProjectJobs` | `11_AdminUI\lib\videos\actions.ts` |
| `buildShotPrompt` | `11_AdminUI\lib\videos\actions.ts` |
| `previewShotPrompt` | `11_AdminUI\lib\videos\actions.ts` |
| `generateShotKeyframe` | `11_AdminUI\lib\videos\actions.ts` |
| `exportForResolve` | `11_AdminUI\lib\videos\actions.ts` |
| `approveShotKeyframe` | `11_AdminUI\lib\videos\actions.ts` |
| `selectKeyframeFromHistory` | `11_AdminUI\lib\videos\actions.ts` |
| `uploadShotKeyframe` | `11_AdminUI\lib\videos\actions.ts` |

---

_Auto-generated 2026-05-25_
