const SKILL_LEXICON = [
  'javascript',
  'typescript',
  'react',
  'angular',
  'vue',
  'node.js',
  'nodejs',
  'next.js',
  'express',
  'html',
  'css',
  'sass',
  'graphql',
  'rest api',
  'python',
  'django',
  'flask',
  'pandas',
  'java',
  'spring boot',
  'kotlin',
  'swift',
  'c++',
  'c#',
  '.net',
  'go',
  'rust',
  'ruby',
  'rails',
  'php',
  'laravel',
  'sql',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'elasticsearch',
  'oracle',
  'sql server',
  'aws',
  'azure',
  'google cloud',
  'gcp',
  'docker',
  'kubernetes',
  'terraform',
  'jenkins',
  'ci/cd',
  'git',
  'linux',
  'bash',
  'microservices',
  'kafka',
  'rabbitmq',
  'redux',
  'tailwind',
  'jest',
  'cypress',
  'playwright',
  'selenium',
  'figma',
  'sketch',
  'adobe xd',
  'photoshop',
  'illustrator',
  'user research',
  'wireframing',
  'prototyping',
  'usability testing',
  'agile',
  'scrum',
  'kanban',
  'jira',
  'confluence',
  'product management',
  'roadmap',
  'stakeholder management',
  'a/b testing',
  'google analytics',
  'seo',
  'sem',
  'content marketing',
  'email marketing',
  'salesforce',
  'hubspot',
  'sap',
  'excel',
  'powerpoint',
  'financial modeling',
  'forecasting',
  'budgeting',
  'accounting',
  'gaap',
  'recruiting',
  'onboarding',
  'training',
  'customer service',
  'project management',
  'pmp',
  'six sigma',
  'data analysis',
  'machine learning',
  'deep learning',
  'nlp',
  'computer vision',
  'pytorch',
  'tensorflow',
  'spark',
  'airflow',
  'tableau',
  'power bi',
  'etl',
  'data warehousing',
  'statistics',
];

const STOP_WORDS = new Set([
  'about',
  'above',
  'after',
  'again',
  'also',
  'and',
  'are',
  'because',
  'been',
  'before',
  'being',
  'between',
  'both',
  'but',
  'can',
  'could',
  'each',
  'for',
  'from',
  'good',
  'have',
  'help',
  'here',
  'how',
  'into',
  'its',
  'just',
  'like',
  'make',
  'more',
  'most',
  'much',
  'need',
  'not',
  'our',
  'out',
  'over',
  'own',
  'per',
  'said',
  'same',
  'should',
  'some',
  'such',
  'take',
  'than',
  'that',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'under',
  'upon',
  'very',
  'want',
  'was',
  'well',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'will',
  'with',
  'would',
  'your',
  'you',
]);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsTerm(haystackLower: string, term: string): boolean {
  const lowered = term.toLowerCase();
  if (/[^a-z0-9]/.test(lowered)) {
    return haystackLower.includes(lowered);
  }
  const boundary = new RegExp(
    `(?:^|[^a-z0-9])${escapeRegExp(lowered)}(?:[^a-z0-9]|$)`,
  );
  return boundary.test(haystackLower);
}

export function findSkills(text: string): string[] {
  const lowered = text.toLowerCase();
  const found: string[] = [];
  for (const skill of SKILL_LEXICON) {
    if (containsTerm(lowered, skill) && !found.includes(skill)) {
      found.push(skill);
    }
  }
  return found;
}

function countWords(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().split(/[^a-z0-9+#.]+/);
  for (const word of words) {
    if (word.length < 4 || STOP_WORDS.has(word)) {
      continue;
    }
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

export function topKeywords(text: string, limit: number): string[] {
  const counts = countWords(text);
  const entries = [...counts.entries()];
  entries.sort((first, second) => second[1] - first[1]);
  return entries.slice(0, limit).map((entry) => entry[0]);
}
