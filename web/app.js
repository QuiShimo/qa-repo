let data = { chapters: [] };

let currentChapter = null;
let currentTopic = null;

let currentMode = 'list';
let quizScope = 'topic';

let quizCards = [];
let quizIndex = 0;
let answerVisible = false;

async function loadData() {
  const nav = document.getElementById('nav');

  bindViewSwitch();
  bindQuizScopeSwitch();

  try {
    const res = await fetch('./data/index.json');

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    data = await res.json();

    if (!data.chapters || !Array.isArray(data.chapters)) {
      throw new Error('Неверный формат data/index.json');
    }

    renderNav();

    if (data.chapters.length > 0 && data.chapters[0].topics.length > 0) {
      const firstChapter = data.chapters[0];
      const firstTopic = firstChapter.topics[0];

      openTopic(firstChapter, firstTopic);
      setActiveTopicButton(firstChapter.slug, firstTopic.slug);
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    nav.innerHTML = '<p>Не удалось загрузить список глав и тем.</p>';
    document.getElementById('topic-title').textContent = 'Ошибка загрузки';
    document.getElementById('cards').innerHTML =
      '<p>Проверь файл <code>web/data/index.json</code> и консоль браузера.</p>';
  }
}

function bindViewSwitch() {
  const listBtn = document.getElementById('list-mode-btn');
  const quizBtn = document.getElementById('quiz-mode-btn');

  listBtn.addEventListener('click', () => switchMode('list'));
  quizBtn.addEventListener('click', () => switchMode('quiz'));
}

function bindQuizScopeSwitch() {
  document.querySelectorAll('.quiz-scope-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchQuizScope(btn.dataset.scope);
    });
  });

  updateQuizScopeButtons();
  updateQuizScopeVisibility();
}

function switchMode(mode) {
  currentMode = mode;
  updateViewButtons();
  updateQuizScopeVisibility();

  if (!currentTopic) {
    document.getElementById('cards').innerHTML =
      '<p>Сначала выберите тему в меню слева.</p>';
    return;
  }

  if (currentMode === 'quiz') {
    resetQuiz();
  }

  renderCurrentView();
}

function switchQuizScope(scope) {
  quizScope = scope;
  updateQuizScopeButtons();

  if (currentMode === 'quiz' && currentTopic) {
    resetQuiz();
    renderCurrentView();
  }
}

function updateViewButtons() {
  const listToolbar = document.getElementById('list-toolbar');
  const quizToolbar = document.getElementById('quiz-toolbar');

  listToolbar.classList.toggle('hidden', currentMode !== 'list');
  quizToolbar.classList.toggle('hidden', currentMode !== 'quiz');
}

function updateQuizScopeButtons() {
  document.querySelectorAll('.quiz-scope-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.scope === quizScope);
  });
}

function updateQuizScopeVisibility() {
  const quizToolbar = document.getElementById('quiz-toolbar');
  quizToolbar.classList.toggle('hidden', currentMode !== 'quiz');
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';

  if (!data.chapters.length) {
    nav.innerHTML = '<p>Глав пока нет.</p>';
    return;
  }

  data.chapters.forEach((chapter, chapterIndex) => {
    const chapterEl = document.createElement('div');
    chapterEl.className = 'chapter';

    if (chapterIndex === 0) {
      chapterEl.classList.add('open');
    }

    const headerBtn = document.createElement('button');
    headerBtn.className = 'chapter-toggle';
    headerBtn.type = 'button';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = chapter.title || chapter.slug || 'Без названия';

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'chapter-arrow';
    arrowSpan.textContent = '▾';

    headerBtn.appendChild(titleSpan);
    headerBtn.appendChild(arrowSpan);

    const topicsEl = document.createElement('div');
    topicsEl.className = 'topics';

    (chapter.topics || []).forEach((topic) => {
      const topicBtn = document.createElement('button');
      topicBtn.className = 'topic-btn';
      topicBtn.type = 'button';
      topicBtn.textContent = topic.title || topic.slug || 'Без названия';

      topicBtn.dataset.chapter = chapter.slug || '';
      topicBtn.dataset.topic = topic.slug || '';

      topicBtn.addEventListener('click', () => {
        openTopic(chapter, topic);
        setActiveTopicButton(chapter.slug, topic.slug);
      });

      topicsEl.appendChild(topicBtn);
    });

    headerBtn.addEventListener('click', () => {
      const isOpen = chapterEl.classList.contains('open');

      document.querySelectorAll('.chapter.open').forEach((el) => {
        if (el !== chapterEl) {
          el.classList.remove('open');
        }
      });

      if (isOpen) {
        chapterEl.classList.remove('open');
      } else {
        chapterEl.classList.add('open');
      }
    });

    chapterEl.appendChild(headerBtn);
    chapterEl.appendChild(topicsEl);
    nav.appendChild(chapterEl);
  });
}

function setActiveTopicButton(chapterSlug, topicSlug) {
  document.querySelectorAll('.topic-btn').forEach((btn) => {
    btn.classList.remove('active');

    if (
      btn.dataset.chapter === chapterSlug &&
      btn.dataset.topic === topicSlug
    ) {
      btn.classList.add('active');
    }
  });
}

function openTopic(chapter, topic) {
  currentChapter = chapter;
  currentTopic = topic;

  if (currentMode === 'quiz') {
    resetQuiz();
  }

  renderCurrentView();
}

function renderCurrentView() {
  if (!currentChapter || !currentTopic) {
    document.getElementById('topic-title').textContent = 'Выберите тему';
    document.getElementById('cards').innerHTML = '';
    return;
  }

  document.getElementById('topic-title').textContent = getCurrentTitle();

  if (currentMode === 'quiz') {
    renderQuiz();
  } else {
    renderTopicList(currentTopic);
  }
}

function getCurrentTitle() {
  if (!currentChapter || !currentTopic) {
    return 'Выберите тему';
  }

  if (currentMode === 'list') {
    return `${currentChapter.title} / ${currentTopic.title}`;
  }

  if (quizScope === 'topic') {
    return `Викторина: ${currentChapter.title} / ${currentTopic.title}`;
  }

  if (quizScope === 'chapter') {
    return `Викторина по главе: ${currentChapter.title}`;
  }

  return 'Викторина по всем темам';
}

function renderTopicList(topic) {
  const cardsEl = document.getElementById('cards');
  cardsEl.innerHTML = '';

  const cards = Array.isArray(topic.cards) ? topic.cards : [];

  if (!cards.length) {
    cardsEl.innerHTML = '<p>В этой теме пока нет вопросов.</p>';
    return;
  }

  cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'card';

    const q = document.createElement('div');
    q.className = 'question';
    q.textContent = `${index + 1}. ${card.question || ''}`;

    const btn = document.createElement('button');
    btn.className = 'toggle-btn';
    btn.type = 'button';
    btn.textContent = 'Показать ответ';

    const a = document.createElement('div');
    a.className = 'answer';
    a.textContent = card.answer || '';

    btn.addEventListener('click', () => {
      a.classList.toggle('open');
      btn.textContent = a.classList.contains('open')
        ? 'Скрыть ответ'
        : 'Показать ответ';
    });

    el.appendChild(q);
    el.appendChild(btn);
    el.appendChild(a);

    cardsEl.appendChild(el);
  });
}

function getQuizSourceCards() {
  if (!currentChapter || !currentTopic) {
    return [];
  }

  if (quizScope === 'topic') {
    return (currentTopic.cards || []).map((card) => ({
      question: card.question || '',
      answer: card.answer || '',
      chapterTitle: currentChapter.title || currentChapter.slug || '',
      topicTitle: currentTopic.title || currentTopic.slug || '',
    }));
  }

  if (quizScope === 'chapter') {
    return (currentChapter.topics || []).flatMap((topic) =>
      (topic.cards || []).map((card) => ({
        question: card.question || '',
        answer: card.answer || '',
        chapterTitle: currentChapter.title || currentChapter.slug || '',
        topicTitle: topic.title || topic.slug || '',
      }))
    );
  }

  return (data.chapters || []).flatMap((chapter) =>
    (chapter.topics || []).flatMap((topic) =>
      (topic.cards || []).map((card) => ({
        question: card.question || '',
        answer: card.answer || '',
        chapterTitle: chapter.title || chapter.slug || '',
        topicTitle: topic.title || topic.slug || '',
      }))
    )
  );
}

function resetQuiz() {
  const sourceCards = getQuizSourceCards();
  quizCards = shuffleArray(sourceCards);
  quizIndex = 0;
  answerVisible = false;
}

function renderQuiz() {
  const cardsEl = document.getElementById('cards');
  cardsEl.innerHTML = '';

  if (!quizCards.length) {
    cardsEl.innerHTML = '<p>Нет вопросов для выбранного режима викторины.</p>';
    return;
  }

  if (quizIndex >= quizCards.length) {
    const resultEl = document.createElement('div');
    resultEl.className = 'quiz-result';

    const title = document.createElement('h2');
    title.textContent = 'Викторина завершена';

    const text = document.createElement('p');
    text.textContent = `Вы просмотрели все вопросы: ${quizCards.length} из ${quizCards.length}.`;

    const note = document.createElement('p');
    note.className = 'quiz-meta';
    note.textContent = `Режим: ${getScopeLabel()}`;

    const restartBtn = document.createElement('button');
    restartBtn.className = 'toggle-btn';
    restartBtn.type = 'button';
    restartBtn.textContent = 'Перемешать заново';
    restartBtn.addEventListener('click', () => {
      resetQuiz();
      renderQuiz();
    });

    resultEl.appendChild(title);
    resultEl.appendChild(text);
    resultEl.appendChild(note);
    resultEl.appendChild(restartBtn);

    cardsEl.appendChild(resultEl);
    return;
  }

  const currentCard = quizCards[quizIndex];

  const wrapper = document.createElement('div');
  wrapper.className = 'quiz-card';

  const progress = document.createElement('div');
  progress.className = 'quiz-progress';
  progress.textContent = `Вопрос ${quizIndex + 1} из ${quizCards.length}`;

  const scope = document.createElement('div');
  scope.className = 'quiz-scope-label';
  scope.textContent = `Режим: ${getScopeLabel()}`;

  const source = document.createElement('div');
  source.className = 'quiz-meta';
  source.textContent = `Источник: ${currentCard.chapterTitle} / ${currentCard.topicTitle}`;

  const question = document.createElement('div');
  question.className = 'quiz-question';
  question.textContent = currentCard.question || '';

  const actions = document.createElement('div');
  actions.className = 'quiz-actions';

  const showAnswerBtn = document.createElement('button');
  showAnswerBtn.className = 'toggle-btn';
  showAnswerBtn.type = 'button';
  showAnswerBtn.textContent = answerVisible ? 'Скрыть ответ' : 'Показать ответ';

  const restartBtn = document.createElement('button');
  restartBtn.className = 'secondary-btn';
  restartBtn.type = 'button';
  restartBtn.textContent = 'Перемешать заново';

  showAnswerBtn.addEventListener('click', () => {
    answerVisible = !answerVisible;
    renderQuiz();
  });

  restartBtn.addEventListener('click', () => {
    resetQuiz();
    renderQuiz();
  });

  actions.appendChild(showAnswerBtn);
  actions.appendChild(restartBtn);

  wrapper.appendChild(progress);
  wrapper.appendChild(scope);
  wrapper.appendChild(source);
  wrapper.appendChild(question);
  wrapper.appendChild(actions);

  if (answerVisible) {
    const answer = document.createElement('div');
    answer.className = 'quiz-answer';
    answer.textContent = currentCard.answer || '';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'toggle-btn';
    nextBtn.type = 'button';
    nextBtn.textContent =
      quizIndex === quizCards.length - 1
        ? 'Завершить викторину'
        : 'Следующий вопрос';

    nextBtn.addEventListener('click', () => {
      quizIndex += 1;
      answerVisible = false;
      renderQuiz();
    });

    wrapper.appendChild(answer);
    wrapper.appendChild(nextBtn);
  }

  cardsEl.appendChild(wrapper);
}

function getScopeLabel() {
  if (quizScope === 'topic') {
    return 'По теме';
  }

  if (quizScope === 'chapter') {
    return 'По главе';
  }

  return 'По всем темам';
}

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

loadData();