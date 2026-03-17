let data = null;

async function loadData() {
  const res = await fetch('./data/index.json');
  data = await res.json();
  renderNav();
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';

  data.chapters.forEach(chapter => {
    const chapterEl = document.createElement('div');
    chapterEl.className = 'chapter';

    const titleEl = document.createElement('div');
    titleEl.className = 'chapter-title';
    titleEl.textContent = chapter.title;
    chapterEl.appendChild(titleEl);

    chapter.topics.forEach(topic => {
      const btn = document.createElement('button');
      btn.className = 'topic-btn';
      btn.textContent = topic.title;
      btn.onclick = () => renderTopic(chapter, topic);
      chapterEl.appendChild(btn);
    });

    nav.appendChild(chapterEl);
  });
}

function renderTopic(chapter, topic) {
  document.getElementById('topic-title').textContent =
    `${chapter.title} / ${topic.title}`;

  const cardsEl = document.getElementById('cards');
  cardsEl.innerHTML = '';

  topic.cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'card';

    const q = document.createElement('div');
    q.className = 'question';
    q.textContent = `${index + 1}. ${card.question}`;

    const btn = document.createElement('button');
    btn.className = 'toggle-btn';
    btn.textContent = 'Показать ответ';

    const a = document.createElement('div');
    a.className = 'answer';
    a.textContent = card.answer;

    btn.onclick = () => {
      a.classList.toggle('open');
      btn.textContent = a.classList.contains('open')
        ? 'Скрыть ответ'
        : 'Показать ответ';
    };

    el.appendChild(q);
    el.appendChild(btn);
    el.appendChild(a);

    cardsEl.appendChild(el);
  });
}

loadData();