# Meta AI Integration Setup Guide

This document explains how to set up and configure the Meta AI features in the WhatsApp Clone application.

## Overview

The Meta AI integration uses either **OpenAI API** or **Google Gemini API** to generate intelligent responses to user messages. The system:

- Saves user messages to the database
- Fetches the last 5 messages as context for better AI understanding
- Processes AI responses asynchronously via queued jobs
- Broadcasts responses in real-time via Laravel Reverb
- Displays AI messages with a special gradient badge in the chat UI

## Architecture

### Components

1. **MetaAIController** - API endpoint handler
   - Endpoint: `POST /api/conversations/{conversation}/ai/messages`
   - Validates and saves user messages
   - Dispatches background job for AI processing
   - Returns immediately to prevent request timeout

2. **AIService** - Core AI logic
   - Fetches conversation context (last 5 messages)
   - Builds message history for AI models
   - Supports OpenAI and Google Gemini APIs
   - Handles API calls with error logging

3. **ProcessMetaAIResponse** - Queued Job
   - Runs asynchronously in background
   - Calls AI service with conversation context
   - Saves AI response to database
   - Broadcasts response via Reverb
   - Implements retry mechanism on failure

4. **MessageBubble Component** - Frontend UI
   - Displays gradient background for AI messages
   - Shows "AI" badge next to timestamp
   - Uses colors: `from-[#703efe] to-[#ff4694]` (purple to pink gradient)

## Setup Instructions

### 1. Environment Configuration

#### Option A: Using OpenAI

Add to `.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TIMEOUT=30
```

Get your API key from: https://platform.openai.com/api-keys

#### Option B: Using Google Gemini

Add to `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

Get your API key from: https://aistudio.google.com/apikey

### 2. Queue Configuration

Ensure you have a queue driver configured (not 'sync'):

```env
QUEUE_CONNECTION=database
# or use: redis, beanstalkd, sqs, etc.
```

For database queue, run the migration:

```bash
php artisan queue:table
php artisan migrate
```

### 3. Start Queue Worker

Run the queue worker to process AI responses:

```bash
php artisan queue:work
```

Or in production, use a process manager like Supervisor:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
stopasgroup=true
stopwaitsecs=60
numprocs=1
```

### 4. Ensure Meta AI User Exists

The system automatically creates a Meta AI user on first use via the `startAIConversation()` method in ChatController. To manually create it:

```bash
php artisan tinker

$aiUser = User::firstOrCreate(
    ['email' => 'ai@whatsapp-clone.local'],
    [
        'name' => 'Meta AI',
        'password' => bcrypt(uniqid()),
    ]
);
```

## Usage

### For End Users

1. Open or start a conversation with Meta AI
2. Send a message
3. The message appears immediately in the chat
4. AI processes the message in the background
5. AI response appears automatically via Reverb (no refresh needed)

### API Endpoint

**Request:**

```bash
POST /api/conversations/{conversation_id}/ai/messages
Content-Type: application/json
Authorization: Bearer {sanctum-token}

{
  "body": "Apa yang bisa kamu bantu?"
}
```

**Response:**

```json
{
  "userMessage": {
    "id": 123,
    "conversation_id": 1,
    "user_id": 1,
    "body": "Apa yang bisa kamu bantu?",
    "type": "text",
    "status": "sent",
    "created_at": "2026-04-19T10:30:00Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "avatar": "..."
    }
  },
  "processing": true,
  "message": "Your message has been sent. AI response is being generated..."
}
```

## System Prompt

The AI operates with this system instruction (in Indonesian):

> Kamu adalah Meta AI, asisten virtual yang membantu pengguna. Respons dalam bahasa Indonesia dengan cara yang ramah dan profesional. Jawab singkat dan jelas. Jika ditanya informasi yang tidak kamu tahu, katakan dengan jujur.

Translation:
> You are Meta AI, a virtual assistant that helps users. Respond in Indonesian in a friendly and professional manner. Answer briefly and clearly. If asked about information you don't know, say so honestly.

You can customize this in `AIService.php` in the `buildMessageHistory()` method.

## Message Context

When generating responses, the AI considers:

1. **System Prompt** - Instructions on how to behave
2. **Last 5 Messages** - Conversation history for context
3. **Current User Message** - The message being responded to

This allows the AI to:
- Remember previous messages in the conversation
- Provide contextually appropriate responses
- Maintain conversation continuity

## Error Handling

### Retry Mechanism

If API calls fail, the system retries up to 3 times with 5-second backoff:

```php
public int $maxExceptions = 3;
public int $backoff = 5;
```

### Logging

All errors are logged to `storage/logs/laravel.log`:

```
Meta AI API Error: Failed to generate AI response...
Error processing Meta AI response: ...
Meta AI job failed after max retries: ...
```

### User-Facing Errors

- User message is always saved and broadcast
- If AI response fails, the user sees the failed job in the queue
- They can resend the message or contact support

## Troubleshooting

### "AI response is being generated..." stays forever

- Check if queue worker is running: `php artisan queue:work`
- Check logs: `tail storage/logs/laravel.log`
- Verify API key is set correctly
- Ensure database queue table exists: `php artisan queue:table && php artisan migrate`

### API key not configured error

- Verify `.env` file has the correct API key set
- No spaces or extra characters
- API key has appropriate permissions/quota

### CORS or 403 errors

- Check API key is valid
- Verify API hasn't rate-limited your account
- Check account billing status (for paid APIs)

### Messages not broadcasting via Reverb

- Ensure Reverb is running: `php artisan reverb:start`
- Check WebSocket connection in browser DevTools
- Verify authenticated user has access to conversation

## Configuration Reference

### AIService.php

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `AI_PROVIDER` | string | `openai` | Choose `openai` or `gemini` |
| `OPENAI_API_KEY` | string | - | OpenAI API key |
| `OPENAI_MODEL` | string | `gpt-3.5-turbo` | Model variant |
| `OPENAI_TIMEOUT` | int | `30` | API timeout in seconds |
| `GEMINI_API_KEY` | string | - | Google Gemini API key |
| `GEMINI_MODEL` | string | `gemini-1.5-flash` | Model variant |

### ProcessMetaAIResponse Job

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `$timeout` | int | `60` | Max job execution time (seconds) |
| `$backoff` | int | `5` | Seconds to wait before retry |
| `$maxExceptions` | int | `3` | Max retry attempts |

## Performance Considerations

### Costs

- **OpenAI**: ~$0.50 per 1M input tokens (GPT-3.5-turbo)
- **Gemini**: ~$0.075 per 1M input tokens (free tier available)

Monitor usage at:
- OpenAI: https://platform.openai.com/usage/limits
- Gemini: https://aistudio.google.com/dashboard

### Optimization Tips

1. **Message Context**: Last 5 messages balances context vs. token cost
2. **Token Limits**: `max_tokens: 500` limits response length
3. **Temperature**: `0.7` balances creativity vs. consistency
4. **Queue Processing**: Run multiple workers if handling high traffic

```bash
# Run 3 concurrent workers
php artisan queue:work --workers=3
```

## Security Notes

- Never commit `.env` with API keys to version control
- Rotate API keys regularly
- Use rate limiting on the endpoint (already configured: `rate-limit-messages`)
- Log all AI interactions for audit purposes
- Consider request throttling if serving many concurrent users

## Future Enhancements

Possible improvements:

1. **Custom System Prompts** - Per-conversation AI personality
2. **Streaming Responses** - Show AI typing in real-time
3. **Multi-language Support** - Auto-detect and respond in user language
4. **Fine-tuned Models** - Custom trained models for specific domains
5. **Conversation Analytics** - Track AI effectiveness and user satisfaction
6. **Voice Integration** - Speech-to-text and text-to-speech

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review Laravel documentation: https://laravel.com/docs
3. Check AI provider documentation:
   - OpenAI: https://platform.openai.com/docs
   - Gemini: https://ai.google.dev/docs
4. Review application logs: `storage/logs/laravel.log`
