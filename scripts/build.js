const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUTPUT_DIR = path.join(__dirname, '..', 'web', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.json');

function parseMarkdown(content) {
  const regex = /## Вопрос\s*([\s\S]*?)\s*## Ответ\s*([\s\S]*?)(?=\n## Вопрос|\s*$)/g;
  const cards = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    cards.push({
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }

  return cards;
}

function build() {
  const chapters = [];

  const chapterDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const chapterDir of chapterDirs) {
    const chapterPath = path.join(CONTENT_DIR, chapterDir.name);

    const topicFiles = fs.readdirSync(chapterPath)
      .filter(name => name.endsWith('.md'));

    const topics = topicFiles.map(fileName => {
      const filePath = path.join(chapterPath, fileName);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const cards = parseMarkdown(raw);

      return {
        slug: fileName.replace(/\.md$/, ''),
        title: fileName.replace(/\.md$/, ''),
        cards,
      };
    });

    chapters.push({
      slug: chapterDir.name,
      title: chapterDir.name,
      topics,
    });
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ chapters }, null, 2),
    'utf-8'
  );

  console.log(`Built: ${OUTPUT_FILE}`);
}

build();