
# API Documentation

## Introduction

This document provides a comprehensive guide to the Text-to-Speech (TTS) API. It is intended for frontend developers who need to integrate with the API to generate and manage audio files from text.

The API is built using FastAPI and follows a RESTful architecture. It uses a combination of synchronous and asynchronous operations to handle TTS jobs efficiently.

### Core Concepts

- **Projects**: A project is a collection of TTS jobs. If a `project_id` is not provided when creating a new job, a new project is created implicitly.
- **Jobs**: A job represents a single TTS request, which can consist of one or more text blocks. Each job is assigned a unique `job_id` that can be used to track its status and retrieve the results.
- **Blocks**: A block is a single unit of text to be converted into audio. Each block can have its own provider, voice, and other settings.
- **Providers**: A provider is a specific TTS engine (e.g., "elevenlabs"). The API supports multiple providers, and you can list the available providers and their voices.

### API Workflow

The typical workflow for generating a TTS audio file is as follows:

1.  **Authenticate**: Obtain an access token by calling the `/token` endpoint.
2.  **Create a TTS Job**: Send a POST request to the `/tts` endpoint with the text blocks to be converted. The API will return a `job_id`.
3.  **Check Job Status**: Poll the `/status/{job_id}` endpoint to monitor the progress of the job.
4.  **Retrieve Results**: Once the job is complete, call the `/result/{job_id}` endpoint to get the URL of the final audio file. You can also retrieve individual audio blocks.
5.  **Download Audio**: Use the provided URLs to download the generated audio files.

## Authentication

The API uses OAuth2 with Bearer Tokens for authentication. All endpoints, except for `/health` and `/token`, require a valid JWT access token.

To obtain an access token, you need to send a POST request to the `/token` endpoint with a username and password.

**Endpoint**: `POST /token`

**Request Body**:

The request should be a form-encoded body with the following fields:

-   `username`: Your username.
-   `password`: Your password.

**Response**:

A successful request will return a JSON object containing the access token and token type.

```json
{
  "access_token": "your_access_token",
  "token_type": "bearer"
}
```

**Error Responses**:

-   `401 Unauthorized`: If the username or password is incorrect.

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Incorrect username or password"
  }
}
```

You must include the access token in the `Authorization` header of all subsequent requests to protected endpoints.

**Example**:

```
Authorization: Bearer your_access_token
```

## API Endpoints

### Health Check

#### `GET /health`

This endpoint allows you to check the health of the API. It does not require authentication.

**Response**:

A successful request will return a JSON object with the status "ok".

```json
{
  "status": "ok"
}
```

### TTS Discovery

#### `GET /tts/providers`

This endpoint returns a list of available voices for a specific TTS provider. Authentication is required.

**Parameters**:

-   `provider_name` (path parameter): The name of the provider to get voices for.

**Response**:

A successful request will return a JSON array of voice objects.

**Error Responses**:

-   `404 Not Found`: If the specified provider is not found.

```json
{
  "detail": "Provider 'invalid_provider' not found."
}
```

### TTS Generation

#### `POST /tts`

This endpoint creates a new Text-to-Speech (TTS) job. It accepts a list of text blocks and returns a `job_id` that can be used to track the status of the job. This endpoint is asynchronous and will return a response immediately, while the TTS generation happens in the background.

**Request Body**:

The request body should be a JSON object with the following fields:

-   `project_id` (string, optional): The ID of the project this TTS job belongs to. If not provided, a new project will be created.
-   `user_id` (string, required): The ID of the user submitting the job.
-   `blocks` (array, required): A list of `TextBlock` objects.

**TextBlock Object**:

-   `text` (string, required): The text to be converted to speech. Must be between 1 and 1000 characters.
-   `wait_after_ms` (integer, optional): The number of milliseconds of silence to add after this block. Defaults to 0.
-   `provider` (string, optional): The TTS provider to use for this block. Defaults to "elevenlabs".
-   `voice` (string, optional): The voice to use for this block. Defaults to "default".
-   `arabic` (boolean, optional): Set to `true` to preprocess the text for Arabic. Defaults to `false`.

**Response**:

A successful request will return a `202 Accepted` status code with a JSON object containing the `job_id` and the initial status of the job.

```json
{
  "job_id": "your_job_id",
  "status": "queued"
}
```

**Error Responses**:

-   `400 Bad Request`: If the request body is invalid (e.g., missing required fields, invalid provider or voice).
-   `401 Unauthorized`: If the access token is missing or invalid.
-   `503 Service Unavailable`: If the external diacritizer API is unavailable.

#### `GET /status/{job_id}`

This endpoint retrieves the status of a specific TTS job.

**Parameters**:

-   `job_id` (path parameter): The ID of the job to check.

**Response**:

A successful request will return a JSON object with the job's status and progress.

```json
{
  "job_id": "your_job_id",
  "status": "processing",
  "progress": "2/5",
  "result_url": ""
}
```

**Error Responses**:

-   `404 Not Found`: If the job ID is not found.
-   `403 Forbidden`: If you are not authorized to access this job.

#### `GET /result/{job_id}`

This endpoint retrieves the result of a completed TTS job.

**Parameters**:

-   `job_id` (path parameter): The ID of the job to retrieve the result for.

**Response**:

A successful request will return a JSON object with the URL to the final audio file and a list of URLs for each individual block.

```json
{
  "job_id": "your_job_id",
  "result_url": "/result/your_job_id/audio",
  "block_urls": [
    "/result/your_job_id/block/0/audio",
    "/result/your_job_id/block/1/audio"
  ]
}
```

**Error Responses**:

-   `404 Not Found`: If the job ID is not found.
-   `403 Forbidden`: If you are not authorized to access this job.
-   `400 Bad Request`: If the job is not yet complete.

#### `GET /result/{job_id}/block/{block_index}/audio`

This endpoint retrieves the audio file for a specific block of a completed TTS job.

**Parameters**:

-   `job_id` (path parameter): The ID of the job.
-   `block_index` (path parameter): The index of the block to retrieve.

**Response**:

A successful request will return the audio file as a downloadable attachment.

**Error Responses**:

-   `404 Not Found`: If the job ID or the block is not found.
-   `403 Forbidden`: If you are not authorized to access this job.
-   `400 Bad Request`: If the job is not yet complete.

#### `GET /result/{job_id}/audio`

This endpoint retrieves the final, combined audio file for a completed TTS job.

**Parameters**:

-   `job_id` (path parameter): The ID of the job.

**Response**:

A successful request will return the audio file as a downloadable attachment.

**Error Responses**:

-   `404 Not Found`: If the job ID or the final audio file is not found.
-   `403 Forbidden`: If you are not authorized to access this job.
-   `400 Bad Request`: If the job is not yet complete.

## Common Integration Issues

- **401 Unauthorized** – Token expired or missing from headers.
- **400 Bad Request** – Check JSON formatting and required fields (`user_id`, `blocks`).
- **403 Forbidden** – The `job_id` belongs to a different user.
- **404 Not Found** – Job ID does not exist or job was deleted.
- **503 Service Unavailable** – External provider or diacritizer API is temporarily down.

## Job Lifecycle

1. `queued` → Job created, waiting for processing.
2. `processing` → One or more text blocks are being converted.
3. `completed` → All blocks processed, audio files available.
4. `failed` → One or more blocks failed (check logs or re-submit).



## Rate Limiting and Performance Notes
- Avoid submitting more than 5 TTS jobs per minute per user to prevent queuing delays.
- Each job may take 5–20 seconds depending on text length and provider performance.

## Troubleshooting Bad Logic Scenarios

- **Resubmitting the Same Job Multiple Times:**  
  Sending identical payloads can create duplicate audio files and consume extra credits.  
  → Store `job_id` locally after creation to prevent re-submission loops.

- **Using Invalid Job References After Logout:**  
  Accessing old `job_id`s after a new login may fail with `403 Forbidden`.  
  → Always re-fetch project or job list after authentication refresh.

- **Missing or Empty Blocks:**  
  Sending a `blocks` array that is empty or has invalid text (e.g., too short or too long) results in `400 Bad Request`.

## Example Workflow Summary

1. `POST /token` → Get access token.  
2. `POST /tts` → Create job, receive `job_id`.  
3. always check the graphQL for updates and get the file info from there using the project id as a reference
