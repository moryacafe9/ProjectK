/*
 Heuristic-based form detection from uploaded project files.
 - Parses HTML files with cheerio and looks for forms and input names/placeholders/labels.
 - Types: login, signup, contact
*/
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');

const KEYWORDS = {
  login: ['login', 'log in', 'sign in', 'email', 'username', 'password'],
  signup: ['signup', 'sign up', 'register', 'create account', 'email', 'username', 'password', 'confirm password'],
  contact: ['contact', 'message', 'subject', 'phone', 'send', 'inquiry']
};

function classifyForm(inputs, labelsText, formText) {
  const haystack = (inputs.join(' ') + ' ' + labelsText.join(' ') + ' ' + formText).toLowerCase();
  const scores = { login: 0, signup: 0, contact: 0 };
  for (const [type, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      if (haystack.includes(w)) scores[type] += 1;
    }
  }
  // Choose the type with the highest score
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = entries[0];
  if (bestScore === 0) return null;
  return bestType;
}

function extractFormsFromHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const forms = [];
  $('form').each((_, form) => {
    const inputs = [];
    const labelsText = [];
    const fields = [];
    $(form).find('input, textarea, select, button').each((__, el) => {
      const name = $(el).attr('name') || '';
      const id = $(el).attr('id') || '';
      const placeholder = $(el).attr('placeholder') || '';
      const type = $(el).attr('type') || $(el).prop('tagName').toLowerCase();
      inputs.push([name, id, placeholder, type].join(' '));
      if (name) fields.push({ name, type });
    });

    $(form).find('label').each((__, el) => {
      labelsText.push($(el).text());
    });

    const formText = $(form).text();
    const type = classifyForm(inputs, labelsText, formText);
    if (type) {
      forms.push({ type, fields });
    }
  });
  return forms;
}

function detectFormsInDirectory(rootDir) {
  const results = [];
  const files = walkFiles(rootDir).filter(f => f.endsWith('.html') || f.endsWith('.htm'));
  for (const file of files) {
    try {
      const html = fs.readFileSync(file, 'utf-8');
      results.push(...extractFormsFromHtml(html));
    } catch (_) {}
  }
  return results;
}

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

async function walkFilesAsync(dir) {
  const files = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walkFilesAsync(full);
      files.push(...sub);
    } else {
      files.push(full);
    }
  }
  return files;
}

async function detectFormsInDirectoryAsync(rootDir) {
  const files = (await walkFilesAsync(rootDir)).filter(f => f.endsWith('.html') || f.endsWith('.htm'));
  const all = await Promise.all(
    files.map(async (file) => {
      try {
        const html = await fsp.readFile(file, 'utf-8');
        return extractFormsFromHtml(html);
      } catch (_) {
        return [];
      }
    })
  );
  return all.flat();
}

module.exports = { detectFormsInDirectory, detectFormsInDirectoryAsync, extractFormsFromHtml };

