## ADDED Requirements

### Requirement: Load word bank
The system SHALL load word data from a local JSON file on startup.

#### Scenario: Successful load
- **WHEN** the page loads
- **THEN** the system reads `data/words.json` and initializes the word bank in memory
- **THEN** each word entry SHALL contain: word, meaning_zh, phonetic, example

#### Scenario: Load failure
- **WHEN** the word bank file fails to load
- **THEN** the system SHALL display an error message and not start the game

### Requirement: API enhancement
The system SHALL attempt to fetch pronunciation audio and supplementary data from dictionaryapi.dev.

#### Scenario: Fetch pronunciation
- **WHEN** a word is presented to the user
- **THEN** the system SHALL make a request to `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` to obtain the MP3 audio URL

#### Scenario: API available
- **WHEN** the API responds successfully
- **THEN** the system SHALL use the returned MP3 URL for pronunciation audio
- **THEN** the system SHALL display additional phonetic and example data from the API response (preferring API data over local data where both exist)

#### Scenario: API unavailable
- **WHEN** the API request fails or times out
- **THEN** the system SHALL fall back to locally stored phonetic/example data
- **THEN** the system SHALL skip audio playback
- **THEN** no error SHALL be shown to the user (silent degradation)

### Requirement: Word bank structure
The word bank data SHALL follow a defined JSON schema.

#### Scenario: Word entry format
- **WHEN** the word bank is loaded
- **THEN** each entry SHALL conform to: `{ "word": string, "meaning_zh": string, "phonetic": string, "example": string }`
