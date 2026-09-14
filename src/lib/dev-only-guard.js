/**
 * Guard that disallows local memory/disk store mutations in production.
 * In production, Supabase database is the sole authoritative data store.
 *
 * @param {string} actionName - Name of the store mutation action.
 */
export function assertNotProduction(actionName) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Local store mutation "${actionName}" is disabled in production. Use Supabase database.`);
  }
}
