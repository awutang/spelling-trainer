## ADDED Requirements

### Requirement: Persistent wrong word storage
The system SHALL persist wrong words across sessions using the browser's localStorage.

#### Scenario: Store wrong word
- **WHEN** a word is marked as wrong
- **THEN** the word data (word, meaning_zh, phonetic, timestamp, round context) SHALL be saved to localStorage

#### Scenario: Load wrong words on startup
- **WHEN** the page loads
- **THEN** the system SHALL read previously stored wrong words from localStorage

### Requirement: Review wrong words mode
The system SHALL provide a dedicated mode that lets the user practice only previously-missed words.

#### Scenario: Enter review mode
- **WHEN** the user clicks "Review Wrong Words"
- **THEN** the system enters a special mode using only the stored wrong words as the word pool

#### Scenario: Wrong words exhausted in review
- **WHEN** all words in review mode have been answered correctly
- **THEN** the system marks the review as complete and returns to normal mode

#### Scenario: Clear a word from wrong list on correct answer
- **WHEN** the user correctly spells a word that was previously wrong
- **THEN** the system MAY remove it from the wrong words list

### Requirement: Export wrong words
The system SHALL allow the user to export their wrong words list.

#### Scenario: Export as JSON
- **WHEN** the user clicks "Export Wrong Words"
- **THEN** the system downloads a JSON file containing all stored wrong words with their data

#### Scenario: Empty export
- **WHEN** there are no wrong words stored
- **THEN** the export button SHALL be disabled or show a message indicating no data to export
