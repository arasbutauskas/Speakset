# Speakset

Speakset is a Discord-inspired recreation for Gen Z, devs, and small communities.

**Brand vibe:** Clean. Fast. Private.

## Brand palette
- Primary: Electric purple `#7C5CFF`
- Background: `#0F0F14`
- Surface: `#1A1A22`
- Accents: Neon cyan + soft pink

## Included product flows
1. **Accounts**
   - Username + password login
   - Optional avatar upload field
   - JWT issuance on login (served by Python backend + C++ native helper)
2. **Spaces**
   - Create Space
   - Invite link preview
   - Owner/Member role badge
3. **Channels**
   - Text channels
   - Private channels
4. **Real-time messaging UX**
   - Typing indicator
   - Edit/Delete messages
   - Emoji reactions rendered with Twitter/X-style Twemoji set

## Backend stack (new)
- **Python**: `backend/server.py` serves static assets and REST APIs (`/api/login`, `/api/messages`, `/api/health`).
- **C++**: `backend/native/speakset_native.cpp` generates auth tokens and message IDs.
- Python compiles the C++ helper automatically on first run.

## Run locally
```bash
python3 backend/server.py
```

Then open `http://localhost:4173`.
