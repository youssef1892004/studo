# AI Voice Studio – TTS Workflow (External FastAPI)

This document describes how to create a single merged Arabic TTS job via the external FastAPI server, following the required “collect → aggregate → send once → retrieve result” logic.

## Overview
- Obtain an access token via `POST /token` using form data.
- Aggregate text blocks locally into `collected_blocks`.
- Create one TTS job via `POST /tts` with all blocks in a single JSON body.
- Poll `GET /status/{job_id}` until `status == 'completed'`.
- Retrieve final merged audio via `GET /result/{job_id}`.

## Environment
- Base URL example: `https://tts-projects5-c0f706f1bd39.hosted.ghaymah.systems`
- Authentication: Bearer token returned from `/token`.

## PowerShell Script
Use `scripts/tts_workflow.ps1` to automate the flow.

### Parameters
- `-BaseUrl` – FastAPI base URL (without trailing slash)
- `-Username` – API username
- `-Password` – API password
- `-ProjectId` – Project ID for the merged job
- `-UserId` – The user submitting the job
- `-BlocksJson` – JSON array of blocks with required keys

### Blocks JSON format
```
[
  { "text": "block1 text", "wait_after_ms": 500, "provider": "ghaymah", "voice": "ar-TN-ReemNeural", "arabic": false },
  { "text": "block2 text", "wait_after_ms": 0,   "provider": "ghaymah", "voice": "ar-TN-ReemNeural", "arabic": false }
]
```

### Example Run
```
pwsh -File scripts/tts_workflow.ps1 \
  -BaseUrl "https://tts-projects5-c0f706f1bd39.hosted.ghaymah.systems" \
  -Username "<USERNAME>" \
  -Password "<PASSWORD>" \
  -ProjectId "053803c6-d680-41fc-b00f-893b79fdcbfc" \
  -UserId "7ac72fd8-0127-451d-b177-128c0f55e7e7" \
  -BlocksJson "[ { \"text\": \"block1 text\", \"wait_after_ms\": 500, \"provider\": \"ghaymah\", \"voice\": \"ar-TN-ReemNeural\", \"arabic\": false }, { \"text\": \"block2 text\", \"wait_after_ms\": 0, \"provider\": \"ghaymah\", \"voice\": \"ar-TN-ReemNeural\", \"arabic\": false } ]"
```

### Output
- Prints JSON containing `project_id`, `job_id`, `final_audio_url`, and raw responses.
- Ensures exactly one merged job per project.

## Notes
- The script strictly sends ONE `POST /tts` for all blocks.
- It does not issue requests inside loops when aggregating blocks.
- Includes error capture (status, body, message) and single timeout retry.