## 1. Project Setup

- [x] 1.1 Create project directory structure (`index.html`, `style.css`, `app.js`, `data/`)
- [x] 1.2 Generate `data/words.json` with 565 selected IELTS vocabulary words (word, meaning_zh, phonetic, example)
- [x] 1.3 Create initial `index.html` with proper meta tags, viewport configuration, and external resource links

## 2. Style System

- [x] 2.1 Define CSS custom properties (colors, fonts, spacing, timing tokens)
- [x] 2.2 Implement main layout container with responsive grid/flex
- [x] 2.3 Style word display area (Chinese meaning, phonetic, example)
- [x] 2.4 Style countdown timer bar and numerical display
- [x] 2.5 Style input field — normal state, red (error/wrong) state, green (correct) state, disabled (timeout) state
- [x] 2.6 Style round summary screen (statistics, wrong word list)
- [x] 2.7 Style buttons ("Next", "Review Wrong Words", "Next Round", "Export")
- [x] 2.8 Mobile keyboard avoidance — ensure input field stays visible when virtual keyboard opens

## 3. Game State Machine

- [x] 3.1 Implement core state machine with states: IDLE, PLAYING, CORRECT, TIMEOUT, WRONG, ROUND_END
- [x] 3.2 Implement state transition logic and guards
- [x] 3.3 Bind state changes to UI updates (render function per state)

## 4. Word Bank & API Enhancement

- [x] 4.1 Implement `data/words.json` loading via fetch/XMLHttpRequest with error handling
- [x] 4.2 Implement word randomization and round selection (15 words, no repeat from previous round)
- [x] 4.3 Implement dictionaryapi.dev fetch: request pronunciation MP3 URL, phonetic, example
- [x] 4.4 Implement API response cache (Map<word, response>) to avoid duplicate requests
- [x] 4.5 Implement silent degradation when API is unavailable (fall back to local data, skip audio)

## 5. Audio System

- [x] 5.1 Implement audio playback using HTMLAudioElement from dictionaryapi.dev MP3 URL
- [x] 5.2 Implement 2-second delay auto-play after word is displayed
- [x] 5.3 Re-play pronunciation on timeout/wrong display
- [x] 5.4 Handle audio load errors gracefully (skip playback without error UI)

## 6. Timer System

- [x] 6.1 Implement 15-second countdown with visual progress bar
- [x] 6.2 Implement timer tick with setInterval (~100ms) + Date.now drift correction
- [x] 6.3 Implement timer expiry handler (freeze input, show correct word in red)
- [x] 6.4 Implement timer reset logic on word transition

## 7. Input Detection

- [x] 7.1 Implement real-time input listener (input event)
- [x] 7.2 Implement prefix-match comparison logic (input vs target word)
- [x] 7.3 Handle full-match: auto-advance to next word with success indication
- [x] 7.4 Handle mismatch: turn input box red immediately
- [x] 7.5 Handle Enter key submission (same as full-match check)
- [x] 7.6 Disable input on timeout and show "Next" button

## 8. Round Management

- [x] 8.1 Implement round initialization (reset counter, shuffle/select 15 words)
- [x] 8.2 Track progress (current word index, correct/wrong counts)
- [x] 8.3 Implement round completion detection and transition to ROUND_END
- [x] 8.4 Implement "Next Round" — select new 15 words without repeating previous round

## 9. Round Summary

- [x] 9.1 Display correct count, wrong count, and success percentage
- [x] 9.2 Display wrong word list with correct spelling shown in red
- [x] 9.3 Wire "Review Wrong Words" button to start review mode round
- [x] 9.4 Wire "Next Round" button to start fresh round

## 10. Wrong Words (localStorage)

- [x] 10.1 Implement wrong word persistence — save to localStorage on each wrong answer
- [x] 10.2 Implement wrong word loading on app startup
- [x] 10.3 Implement review mode: play round using only stored wrong words
- [x] 10.4 Remove word from wrong list when answered correctly in review mode
- [x] 10.5 Implement wrong words export as downloadable JSON file
- [x] 10.6 Handle empty wrong words state (disable export, show message)
- [x] 10.7 Handle localStorage quota exceeded (error message with export suggestion)

## 11. Polish & Edge Cases

- [x] 11.1 Handle rapid Enter spamming (debounce/prevent double-processing)
- [x] 11.2 Handle window/tab visibility change (pause/resume timer?)
- [x] 11.3 Add keyboard shortcut for "Next" button (Space or Enter after timeout)
- [ ] 11.4 Test with empty word bank (graceful error state)
- [ ] 11.5 Test offline mode (no API, no audio — core game still works)
- [ ] 11.6 Test on mobile Safari and Chrome viewport sizes
