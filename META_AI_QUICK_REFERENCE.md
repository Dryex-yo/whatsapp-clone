# Meta AI Implementation - Quick Reference

## What Was Changed

### 1. New Files Created

| File | Purpose |
|------|---------|
| `app/Services/AIService.php` | Core AI logic, API calls to OpenAI/Gemini |
| `app/Jobs/ProcessMetaAIResponse.php` | Queued job for async AI response processing |
| `META_AI_SETUP.md` | Complete setup guide (see this for detailed instructions) |

### 2. Files Updated

| File | Changes |
|------|---------|
| `.env.example` | Added AI provider configuration |
| `config/services.php` | Added AI service configuration |
| `routes/api.php` | Added import for MetaAIController |
| `app/Http/Controllers/MetaAIController.php` | Replaced mock with real AI API calls + job dispatch |
| `resources/js/Components/Chat/MessageBubble.tsx` | Added Meta AI detection and gradient styling (from previous request) |

## Quick Start

### 1. Set API Key

Choose one:

**OpenAI:**
```bash
# In .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
```

**Google Gemini:**
```bash
# In .env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key-here
```

### 2. Configure Queue

```bash
# In .env
QUEUE_CONNECTION=database

# Run migration if using database queue
php artisan queue:table
php artisan migrate

# Start queue worker
php artisan queue:work
```

### 3. Test It

```bash
# Start your application
php artisan serve

# In another terminal, start queue worker
php artisan queue:work

# In another terminal, start Reverb for WebSocket
php artisan reverb:start

# Send a message to Meta AI via the chat UI
# User message appears immediately
# AI response appears in 1-5 seconds via Reverb broadcast
```

## How It Works

```
User sends message
        ↓
MetaAIController.store() called
        ↓
1. Save user message to DB
2. Broadcast user message via Reverb
3. Dispatch ProcessMetaAIResponse job
4. Return immediately to client
        ↓
[Background Processing]
ProcessMetaAIResponse::handle() executes
        ↓
1. Call AIService.generateResponse()
   - Fetch last 5 messages
   - Build message history
   - Call OpenAI/Gemini API
2. Save AI response to DB
3. Broadcast AI response via Reverb
        ↓
[Frontend]
User sees AI response appear automatically
(via Reverb WebSocket connection)
```

## API Endpoint

```
POST /api/conversations/{conversation_id}/ai/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "body": "Message content here"
}
```

Response:
```json
{
  "userMessage": { ... },
  "processing": true,
  "message": "Your message has been sent. AI response is being generated..."
}
```

## Code Examples

### Generating Response Manually

```php
use App\Services\AIService;
use App\Models\Conversation;

$aiService = app(AIService::class);
$response = $aiService->generateResponse(
    $conversation,
    "User message",
    auth()->user()
);

echo $response;
```

### Dispatching Job Manually

```php
use App\Jobs\ProcessMetaAIResponse;
use App\Models\Conversation;

ProcessMetaAIResponse::dispatch(
    $conversation,
    $userMessage,
    $userMessage->body,
    auth()->user()
);
```

### Processing Immediately (Sync)

```php
# In .env
QUEUE_CONNECTION=sync

# This will run jobs immediately without background processing
# Useful for testing but slower in production
```

## Environment Variables

```env
# AI Provider Selection
AI_PROVIDER=openai                          # or 'gemini'

# OpenAI Configuration
OPENAI_API_KEY=sk-...                      # Get from platform.openai.com
OPENAI_MODEL=gpt-3.5-turbo                 # Model version
OPENAI_TIMEOUT=30                          # API timeout in seconds

# Gemini Configuration
GEMINI_API_KEY=AIza...                    # Get from aistudio.google.com
GEMINI_MODEL=gemini-1.5-flash             # Model version

# Queue Configuration
QUEUE_CONNECTION=database                  # or redis, etc
```

## Key Features

✅ **Context-Aware Responses** - Last 5 messages provided as context
✅ **Asynchronous Processing** - Doesn't block user requests
✅ **Real-time Broadcasting** - Responses appear instantly via Reverb
✅ **Error Handling** - Automatic retries on failure
✅ **Multi-Provider Support** - OpenAI or Google Gemini
✅ **Logging** - All interactions logged for debugging
✅ **UI Styling** - Gradient background + AI badge for AI messages

## System Prompt

The AI responds as "Meta AI", an Indonesian-speaking virtual assistant that:
- Responds in Indonesian (Bahasa Indonesia)
- Keeps responses friendly and professional
- Answers briefly and clearly (2-3 sentences max)
- Admits when it doesn't know something

Customizable in: `AIService::buildMessageHistory()`

## Monitoring

### Check Queue Status

```bash
# List pending jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Monitor in real-time
php artisan queue:work -v
```

### View Logs

```bash
# Follow logs
tail -f storage/logs/laravel.log

# Search for AI errors
grep "Meta AI" storage/logs/laravel.log
grep "API Error" storage/logs/laravel.log
```

### Test API Connection

```bash
# OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Gemini  
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Queue jobs not running | Verify `QUEUE_CONNECTION != sync`, start worker: `php artisan queue:work` |
| AI response not appearing | Check worker is running, verify Reverb connection, check logs |
| API key error | Verify `.env` has correct key, no extra spaces, valid permissions |
| Slow responses | Check API quota, increase worker threads, consider paid tier |
| Messages stuck as "processing" | Restart queue worker, check failed jobs: `php artisan queue:failed` |

## Performance Tips

- **Token Limits** - Max 500 tokens per response (configurable in AIService)
- **Context Size** - Last 5 messages (configurable)
- **Temperature** - 0.7 (balanced creativity vs consistency)
- **Multiple Workers** - `php artisan queue:work --workers=3`
- **Rate Limiting** - Enabled via middleware (see routes/api.php)

## For Full Documentation

See: [META_AI_SETUP.md](./META_AI_SETUP.md)
