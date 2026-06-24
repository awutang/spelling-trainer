/* =============================================
   雅思拼写训练器 - App
   ============================================= */

// =============================================
// Constants
// =============================================
const TOTAL_WORDS_PER_ROUND = 15;
const COUNTDOWN_SECONDS = 15;
const AUDIO_DELAY_MS = 2000;  // 2s delay before playing audio
const CORRECT_ADVANCE_DELAY_MS = 800;  // 0.8s auto-advance on correct
const API_TIMEOUT_MS = 3000;
const STORAGE_KEY = 'spellingTrainer';
const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

const STATE = {
  LOADING: 'loading',
  ERROR: 'error',
  IDLE: 'idle',
  PLAYING: 'playing',
  CORRECT: 'correct',
  WRONG: 'wrong',
  TIMEOUT: 'timeout',
  TIMEOUT_CORRECT: 'timeout_correct',
  ROUND_END: 'round_end',
};

// =============================================
// DOM References
// =============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  // All screens
  screenLoading: $('#screen-loading'),
  screenIdle: $('#screen-idle'),
  screenPlaying: $('#screen-playing'),
  screenRoundEnd: $('#screen-round-end'),
  screenError: $('#screen-error'),

  // Header
  progressInfo: $('#progress-info'),
  roundProgress: $('#round-progress'),
  roundCounter: $('#round-counter'),

  // Idle screen
  btnStart: $('#btn-start'),
  btnReview: $('#btn-review'),
  btnExport: $('#btn-export'),
  wrongCountBadge: $('#wrong-count-badge'),

  // Playing screen
  timerBar: $('#timer-bar'),
  timerText: $('#timer-text'),
  wordMeaning: $('#word-meaning'),
  wordPhonetic: $('#word-phonetic'),
  wordExample: $('#word-example'),
  audioIndicator: $('#audio-indicator'),
  wordInput: $('#word-input'),
  inputFeedback: $('#input-feedback'),
  actionSection: $('#action-section'),
  errorDisplay: $('#error-display'),
  errorLabel: $('#error-label'),
  correctWordDisplay: $('#correct-word-display'),
  btnNext: $('#btn-next'),

  // Round end screen
  resultCorrect: $('#result-correct'),
  resultWrong: $('#result-wrong'),
  resultRate: $('#result-rate'),
  resultTime: $('#result-time'),
  wrongListSection: $('#wrong-list-section'),
  wrongWordList: $('#wrong-word-list'),
  btnReviewWrong: $('#btn-review-wrong'),
  btnNextRound: $('#btn-next-round'),
  btnBackHome: $('#btn-back-home'),

  // Error screen
  errorMessage: $('#error-message'),
  btnRetry: $('#btn-retry'),

  // Toast
  toast: $('#toast'),
};

// =============================================
// Audio System
// =============================================
class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.timeoutId = null;
  }

  /**
   * Play pronunciation for a word.
   * First tries the API MP3 URL. If not available, falls back silently.
   */
  play(word) {
    this.stop();
    const entry = apiCache.get(word);
    const audioUrl = entry?.audioUrl;
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.volume = 0.8;
    audio.onerror = () => { /* silent fail */ };
    this.currentAudio = audio;
    audio.play().catch(() => { /* silent fail */ });
  }

  /**
   * Schedule audio playback after a delay.
   */
  schedulePlay(word, delayMs = AUDIO_DELAY_MS) {
    this.cancelScheduled();
    this.timeoutId = setTimeout(() => {
      this.play(word);
      dom.audioIndicator.classList.remove('hidden');
      this.timeoutId = null;
    }, delayMs);
  }

  cancelScheduled() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  dispose() {
    this.stop();
    this.cancelScheduled();
  }
}

// =============================================
// API Cache
// =============================================
const apiCache = new Map();

async function fetchWordData(word) {
  if (apiCache.has(word)) {
    return apiCache.get(word);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const resp = await fetch(`${API_BASE}${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      apiCache.set(word, null);
      return null;
    }

    const data = await resp.json();
    const entry = data[0];

    // Extract audio URL
    let audioUrl = null;
    if (entry?.phonetics) {
      for (const p of entry.phonetics) {
        if (p.audio && p.audio.endsWith('.mp3')) {
          audioUrl = p.audio.startsWith('//') ? 'https:' + p.audio : p.audio;
          break;
        }
      }
    }

    // Extract example sentence (first one)
    let example = null;
    if (entry?.meanings) {
      for (const m of entry.meanings) {
        if (m.definitions?.[0]?.example) {
          example = m.definitions[0].example;
          break;
        }
      }
    }

    const result = { audioUrl, example };
    apiCache.set(word, result);
    return result;
  } catch {
    clearTimeout(timeoutId);
    apiCache.set(word, null);
    return null;
  }
}

// =============================================
// Wrong Words Manager (localStorage)
// =============================================
class WrongWordsManager {
  constructor() {
    this.words = [];
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.words = parsed.wrongWords || [];
      }
    } catch {
      this.words = [];
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wrongWords: this.words }));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        showToast('存储空间已满，请导出错词后清除浏览器数据');
      }
    }
  }

  add(wordData) {
    const exists = this.words.some(w => w.word === wordData.word);
    if (!exists) {
      this.words.push({
        word: wordData.word,
        meaning_zh: wordData.meaning_zh,
        phonetic: wordData.phonetic,
        example: wordData.example,
        wrongAt: new Date().toISOString(),
      });
      this.save();
    }
  }

  remove(word) {
    this.words = this.words.filter(w => w.word !== word);
    this.save();
  }

  getAll() {
    return [...this.words];
  }

  getCount() {
    return this.words.length;
  }

  exportJSON() {
    const blob = new Blob([JSON.stringify({ wrongWords: this.words, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wrong-words-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// =============================================
// Toast
// =============================================
let toastTimeoutId = null;

function showToast(message, durationMs = 2500) {
  const el = dom.toast;
  el.textContent = message;
  el.classList.remove('hidden');
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    el.classList.add('hidden');
  }, durationMs);
}

// =============================================
// Game State Machine
// =============================================
class SpellingTrainer {
  constructor() {
    this.state = STATE.LOADING;
    this.wordBank = [];
    this.roundWords = [];
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.timeRemaining = COUNTDOWN_SECONDS;
    this.timerInterval = null;
    this.timerStartTime = 0;
    this.isProcessing = false;
    this.previousRoundWords = [];
    this.isReviewMode = false;
    this.audio = new AudioManager();
    this.wrongWords = new WrongWordsManager();
    this.advanceTimeout = null;
    this.roundWrongWords = [];
    this.roundStartTime = null;
  }

  // =============================================
  // Initialization
  // =============================================
  async init() {
    this.showScreen(STATE.LOADING);
    try {
      const resp = await fetch('data/words.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this.wordBank = await resp.json();
      if (!Array.isArray(this.wordBank) || this.wordBank.length === 0) {
        throw new Error('词库为空');
      }
      this.state = STATE.IDLE;
      this.showScreen(STATE.IDLE);
      this.updateIdleScreen();
    } catch (err) {
      console.error('Failed to load word bank:', err);
      dom.errorMessage.textContent = '词库加载失败: ' + err.message + '。请刷新页面重试。';
      this.state = STATE.ERROR;
      this.showScreen(STATE.ERROR);
    }
  }

  // =============================================
  // Screen Management
  // =============================================
  showScreen(state) {
    // Hide all screens
    dom.screenLoading.classList.remove('active');
    dom.screenIdle.classList.remove('active');
    dom.screenPlaying.classList.remove('active');
    dom.screenRoundEnd.classList.remove('active');
    dom.screenError.classList.remove('active');

    // Show relevant screen
    switch (state) {
      case STATE.LOADING:
        dom.screenLoading.classList.add('active');
        dom.progressInfo.classList.add('hidden');
        break;
      case STATE.ERROR:
        dom.screenError.classList.add('active');
        dom.progressInfo.classList.add('hidden');
        break;
      case STATE.IDLE:
        dom.screenIdle.classList.add('active');
        dom.progressInfo.classList.add('hidden');
        break;
      case STATE.PLAYING:
      case STATE.CORRECT:
      case STATE.WRONG:
      case STATE.TIMEOUT:
      case STATE.TIMEOUT_CORRECT:
        dom.screenPlaying.classList.add('active');
        dom.progressInfo.classList.remove('hidden');
        break;
      case STATE.ROUND_END:
        dom.screenRoundEnd.classList.add('active');
        dom.progressInfo.classList.add('hidden');
        break;
    }
  }

  // =============================================
  // Idle Screen
  // =============================================
  updateIdleScreen() {
    const count = this.wrongWords.getCount();
    dom.wrongCountBadge.textContent = count;
    dom.btnReview.disabled = count === 0;
    dom.btnExport.disabled = count === 0;
  }

  // =============================================
  // Round Management
  // =============================================
  startNewRound(customWords = null) {
    this.isReviewMode = customWords !== null;

    const pool = customWords || this.getNonRepeatingWords();
    if (pool.length === 0) {
      showToast('没有可用的单词');
      return;
    }

    // Shuffle and take 15
    this.roundWords = this.shuffleArray(pool).slice(0, TOTAL_WORDS_PER_ROUND);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.roundWrongWords = [];
    this.roundStartTime = Date.now();

    if (!this.isReviewMode) {
      this.previousRoundWords = this.roundWords.map(w => w.word);
    }

    this.startWord();
  }

  getNonRepeatingWords() {
    if (!this.previousRoundWords.length) return [...this.wordBank];
    const available = this.wordBank.filter(w => !this.previousRoundWords.includes(w.word));
    if (available.length < TOTAL_WORDS_PER_ROUND) {
      // Reset exclusion pool if not enough words
      this.previousRoundWords = [];
      return [...this.wordBank];
    }
    return available;
  }

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // =============================================
  // Word Display
  // =============================================
  startWord() {
    if (this.currentIndex >= this.roundWords.length) {
      this.endRound();
      return;
    }

    const wordData = this.roundWords[this.currentIndex];
    this.state = STATE.PLAYING;
    this.isProcessing = false;

    // Update progress
    dom.roundProgress.textContent = `第 ${this.currentIndex + 1}/${this.roundWords.length} 词`;
    dom.roundCounter.textContent = `✅ ${this.correctCount} | ❌ ${this.wrongCount}`;

    // Show word info
    dom.wordMeaning.textContent = wordData.meaning_zh;
    dom.wordPhonetic.textContent = wordData.phonetic || '';
    dom.wordPhonetic.classList.remove('hidden');
    dom.wordExample.textContent = '';
    dom.wordExample.classList.add('hidden');
    dom.audioIndicator.classList.add('hidden');

    // Reset input
    dom.wordInput.value = '';
    dom.wordInput.disabled = false;
    dom.wordInput.className = 'word-input';
    dom.inputFeedback.classList.add('hidden');
    dom.actionSection.classList.add('hidden');

    // Hide correct word display
    dom.errorDisplay.classList.remove('hidden');

    // Reset timer
    this.timeRemaining = COUNTDOWN_SECONDS;
    this.updateTimerDisplay();
    this.startTimer();

    // Fetch API data and schedule audio
    this.fetchAndScheduleAudio(wordData.word);

    // Show screen before focusing (input needs to be visible)
    this.showScreen(STATE.PLAYING);
    dom.wordInput.focus();
  }

  async fetchAndScheduleAudio(word) {
    const data = await fetchWordData(word);
    const wordData = this.roundWords[this.currentIndex];

    // Show API-provided example
    if (data?.example) {
      dom.wordExample.textContent = `"${data.example}"`;
      dom.wordExample.classList.remove('hidden');
    } else if (wordData.example) {
      dom.wordExample.textContent = `"${wordData.example}"`;
      dom.wordExample.classList.remove('hidden');
    }

    // Schedule audio playback
    if (data?.audioUrl) {
      this.audio.schedulePlay(word);
    } else {
      // No audio available
      dom.audioIndicator.classList.add('hidden');
    }
  }

  // =============================================
  // Timer System
  // =============================================
  startTimer() {
    this.stopTimer();
    this.timerStartTime = Date.now();
    this.timeRemaining = COUNTDOWN_SECONDS;

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.timerStartTime) / 1000;
      this.timeRemaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.handleTimeout();
      }
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const seconds = Math.ceil(this.timeRemaining);
    const pct = (this.timeRemaining / COUNTDOWN_SECONDS) * 100;

    dom.timerText.textContent = seconds + 's';
    dom.timerBar.style.width = Math.max(0, pct) + '%';

    // Color transitions
    dom.timerText.classList.remove('warning', 'danger');
    dom.timerBar.style.backgroundColor = '';
    if (this.timeRemaining <= 3) {
      dom.timerText.classList.add('danger');
      dom.timerBar.style.backgroundColor = 'var(--timer-color-danger)';
    } else if (this.timeRemaining <= 7) {
      dom.timerText.classList.add('warning');
      dom.timerBar.style.backgroundColor = 'var(--timer-color-warning)';
    }
  }

  // =============================================
  // Input Detection
  // =============================================
  handleInput(value) {
    if ((this.state !== STATE.PLAYING && this.state !== STATE.TIMEOUT) || this.isProcessing) return;

    const target = this.roundWords[this.currentIndex].word.toLowerCase();
    const input = value.toLowerCase();

    // Reset classes
    dom.wordInput.classList.remove('error', 'correct');

    if (input === '') {
      // Empty input, normal state
      return;
    }

    if (this.state === STATE.TIMEOUT) {
      // After timeout: only exact match matters, used for practice
      if (input === target) {
        this.handleCorrectAfterTimeout();
      } else {
        // Show mismatch gently for practice
        dom.wordInput.classList.add('error');
      }
      return;
    }

    // Normal PLAYING state logic
    if (input === target) {
      // Full match! Correct answer.
      this.handleCorrect();
    } else if (target.startsWith(input)) {
      // Prefix matches, normal state
      dom.inputFeedback.classList.add('hidden');
    } else {
      // Mismatch - show error immediately
      dom.wordInput.classList.add('error');
      dom.inputFeedback.textContent = '✗ 拼写错误';
      dom.inputFeedback.className = 'input-feedback error';
      dom.inputFeedback.classList.remove('hidden');
    }
  }

  handleEnter() {
    if (this.state === STATE.PLAYING && !this.isProcessing) {
      const input = dom.wordInput.value.trim();
      if (!input) return;

      const target = this.roundWords[this.currentIndex].word.toLowerCase();
      if (input.toLowerCase() === target) {
        this.handleCorrect();
      } else {
        this.handleWrong();
      }
    } else if (this.state === STATE.WRONG || this.state === STATE.TIMEOUT_CORRECT) {
      // Enter as shortcut for "Next" button
      this.handleNextWord();
    } else if (this.state === STATE.CORRECT) {
      // Enter to skip auto-advance delay
      this.advanceToNext();
    } else if (this.state === STATE.TIMEOUT) {
      // Timeout but user pressed Enter without typing correctly
      // Allow advancing if they've seen the answer (click Next)
      // Do nothing - they need to type correct word or click Next
    }
  }

  // =============================================
  // Correct / Wrong / Timeout Handlers
  // =============================================
  handleCorrect() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.state = STATE.CORRECT;
    this.stopTimer();
    this.audio.cancelScheduled();
    this.correctCount++;

    // Visual feedback
    dom.wordInput.classList.add('correct');
    dom.wordInput.disabled = true;
    dom.inputFeedback.textContent = '✓ 正确！';
    dom.inputFeedback.className = 'input-feedback correct';
    dom.inputFeedback.classList.remove('hidden');

    // If in review mode, remove from wrong words
    if (this.isReviewMode) {
      const wordData = this.roundWords[this.currentIndex];
      this.wrongWords.remove(wordData.word);
    }

    // Auto-advance after delay, or Enter to skip
    this.advanceTimeout = setTimeout(() => {
      this.advanceToNext();
    }, CORRECT_ADVANCE_DELAY_MS);
  }

  handleWrong() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.state = STATE.WRONG;
    this.stopTimer();
    this.audio.cancelScheduled();
    this.wrongCount++;

    const wordData = this.roundWords[this.currentIndex];
    this.wrongWords.add(wordData);
    this.roundWrongWords.push(wordData);

    this.showErrorState('✗ 拼写错误');
  }

  handleTimeout() {
    if (this.isProcessing) return;
    this.state = STATE.TIMEOUT;
    this.isProcessing = false; // Keep input active for practice
    this.stopTimer();
    this.audio.cancelScheduled();
    this.wrongCount++;

    const wordData = this.roundWords[this.currentIndex];
    this.wrongWords.add(wordData);
    this.roundWrongWords.push(wordData);

    // Show timeout message + correct word, but keep input active
    dom.inputFeedback.textContent = '⏰ 时间到！请照着敲一遍';
    dom.inputFeedback.className = 'input-feedback error';
    dom.inputFeedback.classList.remove('hidden');

    // Show correct word in red for reference
    dom.errorLabel.textContent = '正确单词:';
    dom.correctWordDisplay.textContent = wordData.word;
    dom.errorDisplay.classList.remove('hidden');

    // Hide action section (Next button hidden until they type correctly)
    dom.actionSection.classList.add('hidden');

    // Keep input active
    dom.wordInput.disabled = false;
    dom.wordInput.className = 'word-input error';

    // Play audio to reinforce
    this.audio.play(wordData.word);
  }

  handleCorrectAfterTimeout() {
    // Word was already counted as wrong, just show success visually
    this.isProcessing = true;
    this.state = STATE.TIMEOUT_CORRECT;

    // Visual success
    dom.wordInput.classList.add('correct');
    dom.wordInput.classList.remove('error');
    dom.wordInput.disabled = true;
    dom.inputFeedback.textContent = '✓ 正确！点击下一词继续';
    dom.inputFeedback.className = 'input-feedback correct';
    dom.inputFeedback.classList.remove('hidden');

    // Hide the correct word hint, show Next button
    dom.errorDisplay.classList.add('hidden');
    dom.actionSection.classList.remove('hidden');
    dom.btnNext.focus();
  }

  showErrorState(label) {
    const wordData = this.roundWords[this.currentIndex];

    // Disable input
    dom.wordInput.disabled = true;

    // Show correct word in red
    dom.errorLabel.textContent = label;
    dom.correctWordDisplay.textContent = wordData.word;

    // Show action section
    dom.actionSection.classList.remove('hidden');

    // Play audio again to reinforce
    this.audio.play(wordData.word);

    // Focus the Next button
    dom.btnNext.focus();
  }

  // =============================================
  // Navigate between words
  // =============================================
  advanceToNext() {
    if (this.advanceTimeout) {
      clearTimeout(this.advanceTimeout);
      this.advanceTimeout = null;
    }
    this.currentIndex++;
    this.startWord();
  }

  handleNextWord() {
    if (this.advanceTimeout) {
      clearTimeout(this.advanceTimeout);
      this.advanceTimeout = null;
    }
    this.currentIndex++;
    this.startWord();
  }

  // =============================================
  // Round End
  // =============================================
  endRound() {
    this.state = STATE.ROUND_END;
    this.stopTimer();
    this.audio.dispose();

    const total = this.correctCount + this.wrongCount;
    const rate = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;

    dom.resultCorrect.textContent = this.correctCount;
    dom.resultWrong.textContent = this.wrongCount;
    dom.resultRate.textContent = rate + '%';

    // Calculate and display round time
    if (this.roundStartTime) {
      const elapsed = Math.floor((Date.now() - this.roundStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      dom.resultTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Show wrong words list
    if (this.roundWrongWords.length > 0) {
      dom.wrongListSection.classList.remove('hidden');
      dom.wrongWordList.innerHTML = '';
      this.roundWrongWords.forEach(w => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="wrong-word-text">${w.word}</span>
          <span class="wrong-word-meaning">${w.meaning_zh}</span>
        `;
        dom.wrongWordList.appendChild(li);
      });
    } else {
      dom.wrongListSection.classList.add('hidden');
    }

    this.showScreen(STATE.ROUND_END);
    this.updateIdleScreen();
  }

  // =============================================
  // Actions
  // =============================================
  doStartRound() {
    this.startNewRound();
  }

  doReviewWrong() {
    const wrong = this.wrongWords.getAll().map(w => ({
      word: w.word,
      meaning_zh: w.meaning_zh,
      phonetic: w.phonetic,
      example: w.example,
    }));

    if (wrong.length === 0) {
      showToast('没有错词需要复习 🎉');
      return;
    }

    this.startNewRound(wrong);
  }

  doExportWrong() {
    if (this.wrongWords.getCount() === 0) {
      showToast('没有错词可导出');
      return;
    }
    this.wrongWords.exportJSON();
    showToast('错词已导出');
  }

  doNextRound() {
    this.startNewRound();
  }

  goHome() {
    this.state = STATE.IDLE;
    this.stopTimer();
    this.audio.dispose();
    this.showScreen(STATE.IDLE);
    this.updateIdleScreen();
  }

  doRetry() {
    this.init();
  }

  // =============================================
  // Cleanup
  // =============================================
  dispose() {
    this.stopTimer();
    this.audio.dispose();
    if (this.advanceTimeout) {
      clearTimeout(this.advanceTimeout);
    }
  }
}

// =============================================
// Boot
// =============================================
let game;

function initApp() {
  game = new SpellingTrainer();

  // Bind event listeners
  dom.btnStart.addEventListener('click', () => game.doStartRound());
  dom.btnReview.addEventListener('click', () => game.doReviewWrong());
  dom.btnExport.addEventListener('click', () => game.doExportWrong());
  dom.btnNext.addEventListener('click', () => game.handleNextWord());
  dom.btnNextRound.addEventListener('click', () => game.doNextRound());
  dom.btnReviewWrong.addEventListener('click', () => game.doReviewWrong());
  dom.btnBackHome.addEventListener('click', () => game.goHome());
  dom.btnRetry.addEventListener('click', () => game.doRetry());

  // Input events
  dom.wordInput.addEventListener('input', (e) => {
    game.handleInput(e.target.value);
  });

  dom.wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      game.handleEnter();
    }
  });

  // Keyboard shortcut for "Next" button on timeout/wrong/correct
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (game.state === STATE.TIMEOUT_CORRECT || game.state === STATE.WRONG) {
        if (document.activeElement !== dom.wordInput) {
          e.preventDefault();
          game.handleNextWord();
        }
      } else if (game.state === STATE.CORRECT && document.activeElement !== dom.wordInput) {
        e.preventDefault();
        game.advanceToNext();
      }
    }
  });

  // Handle window/tab visibility change - pause/resume timer
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === STATE.PLAYING) {
      // Tab hidden, we just let the timer continue
      // The timer uses Date.now so drift correction handles this
    }
  });

  // Init
  game.init();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
