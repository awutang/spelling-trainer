## ADDED Requirements

### Requirement: Round structure
Each round SHALL consist of exactly 15 words drawn from the word bank.

#### Scenario: Start a round
- **WHEN** the user starts a new round
- **THEN** the system randomly selects 15 words from the word bank (excluding words used in the immediately previous round, unless the bank is exhausted)

#### Scenario: Round in progress
- **WHEN** a round is in progress
- **THEN** the system tracks how many words have been completed (correct or wrong) out of 15

#### Scenario: Round completion
- **WHEN** all 15 words have been attempted
- **THEN** the round ends and the system displays the round summary

### Requirement: Word selection without repeat
The system SHALL avoid repeating words from the previous round when selecting words for a new round.

#### Scenario: Normal selection
- **WHEN** there are enough unused words in the word bank
- **THEN** no word from the previous round SHALL appear in the current round

#### Scenario: Bank exhausted
- **WHEN** there are not enough unused words to fill a round
- **THEN** the system SHALL reset the exclusion pool and may reuse words

### Requirement: Round summary
The system SHALL display a summary at the end of each round with statistics.

#### Scenario: Show round results
- **WHEN** a round ends
- **THEN** the system displays: total correct count, total wrong count, success rate (percentage)

#### Scenario: Show wrong word list
- **WHEN** a round ends
- **THEN** the system SHALL display a list of all words the user got wrong in this round, with their correct spelling shown in red

### Requirement: Navigate after round
The system SHALL provide options for the user after a round summary is displayed.

#### Scenario: Review wrong words
- **WHEN** the user clicks "Review Wrong Words"
- **THEN** the system starts a new round using ONLY the words that were marked wrong in the previous round

#### Scenario: Next round
- **WHEN** the user clicks "Next Round"
- **THEN** the system starts a fresh round with a new random selection of 15 words
