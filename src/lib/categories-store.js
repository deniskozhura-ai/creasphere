import fs from 'fs';
import path from 'path';
import { DEMO_CATEGORIES } from './demo-data';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'categories.json');

function initCategories() {
  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return [...DEMO_CATEGORIES];
}

export function getCategories() {
  return initCategories();
}

export function addCategory(category) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local categories store mutation is disabled in production. Use Supabase database.');
  }

  const current = getCategories();
  const updated = [...current.filter((c) => c.id !== category.id && c.slug !== category.slug), category];

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return category;
}

export function updateCategory(id, updatedData) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local categories store mutation is disabled in production. Use Supabase database.');
  }

  const current = getCategories();
  const updated = current.map((c) => {
    if (c.id === id || c.slug === id) {
      return { ...c, ...updatedData, id: c.id };
    }
    return c;
  });

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return updated.find((c) => c.id === id || c.slug === id);
}

export function deleteCategory(id) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local categories store mutation is disabled in production. Use Supabase database.');
  }

  const current = getCategories();
  const updated = current.filter((c) => c.id !== id && c.slug !== id);

  try {
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  return true;
}
