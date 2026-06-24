## ADDED Requirements

### Requirement: Display word prompt
The system SHALL display the Chinese meaning of the current word to the user at the start of each turn.

#### Scenario: Show Chinese meaning
- **WHEN** a new turn begins
- **THEN** the system displays the Chinese meaning (meaning_zh) of the current word prominently on screen

#### Scenario: Show phonetic transcription
- **WHEN** a new turn begins
- **THEN** the system displays the phonetic transcription of the current word alongside the Chinese meaning

### Requirement: Countdown timer
The system SHALL start a 15-second countdown when each word is presented, and show the remaining time visually.

#### Scenario: Timer starts
- **WHEN** the Chinese meaning is displayed
- **THEN** a 15-second countdown timer starts and is visible to the user

#### Scenario: Timer visual feedback
- **WHEN** the countdown is running
- **THEN** the timer SHALL show real-time remaining seconds

#### Scenario: Timer expires
- **WHEN** the countdown reaches 0
- **THEN** the input field SHALL be disabled/frozen, and the correct word SHALL be displayed in red

### Requirement: Play pronunciation audio
The system SHALL automatically play the English pronunciation audio 2 seconds after displaying the word prompt.

#### Scenario: Auto-play pronunciation
- **WHEN** 2 seconds have passed since the word was displayed
- **THEN** the system plays the pronunciation audio via dictionaryapi.dev MP3 URL

#### Scenario: Pronunciation not available
- **WHEN** the API returns no audio URL for the current word
- **THEN** the system SHALL silently skip audio playback (no error shown)

### Requirement: Real-time input detection
The system SHALL monitor user input in real-time and compare against the target word.

#### Scenario: Input matches prefix
- **WHEN** the user's input matches the beginning of the target word (e.g., "appl" for "apple")
- **THEN** the input box remains in its normal state

#### Scenario: Input deviates from target
- **WHEN** the user's input does not match the target word at the current position
- **THEN** the entire input box SHALL turn red immediately

#### Scenario: Full match
- **WHEN** the user's input equals the target word exactly
- **THEN** the system SHALL mark the word as correct and advance to the next word (after a brief success indication)

#### Scenario: Submit via Enter
- **WHEN** the user presses Enter
- **THEN** the system SHALL evaluate the current input against the target word

### Requirement: Handle timeout
The system SHALL freeze the interface when the timer expires and display the correct answer.

#### Scenario: Timeout behavior
- **WHEN** the timer reaches 0
- **THEN** the input field SHALL be disabled
- **THEN** the correct word SHALL be displayed in red
- **THEN** the pronunciation SHALL be played again
- **THEN** a "Next" button SHALL appear to proceed

#### Scenario: Advance after timeout
- **WHEN** user clicks "Next" after a timeout
- **THEN** the system proceeds to the next word in the round

### Requirement: Mark word as wrong
The system SHALL record a word as wrong when the user either times out or submits incorrect input.

#### Scenario: Wrong on timeout
- **WHEN** the timer expires
- **THEN** the word SHALL be marked as wrong and added to the wrong-words list

#### Scenario: Wrong on incorrect submission
- **WHEN** the user submits input that does not match the target word
- **THEN** the word SHALL be marked as wrong and added to the wrong-words list
