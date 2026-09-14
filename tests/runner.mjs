import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'path';

const testFiles = [
  path.resolve(process.cwd(), 'tests/auth.test.mjs'),
  path.resolve(process.cwd(), 'tests/rate-limit.test.mjs'),
  path.resolve(process.cwd(), 'tests/orders.test.mjs'),
  path.resolve(process.cwd(), 'tests/validation.test.mjs'),
  path.resolve(process.cwd(), 'tests/rls.test.mjs'),
];

const testStream = run({
  files: testFiles,
  concurrency: 1, // run sequentially for predictable state isolation
});

testStream.compose(spec).pipe(process.stdout);

let passedCount = 0;
let failedCount = 0;

testStream.on('test:pass', (t) => {
  // Only count leaf tests (not suites/describe blocks)
  if (t.details?.type === 'test' || (!t.nesting && t.name && !t.name.includes('('))) {
    passedCount++;
  }
});

testStream.on('test:fail', (t) => {
  if (t.details?.type === 'test' || (!t.nesting && t.name && !t.name.includes('('))) {
    failedCount++;
  }
});

testStream.on('end', () => {
  const totalCount = passedCount + failedCount;
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedCount} passed / ${failedCount} failed / ${totalCount} total`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exitCode = 1;
  }
});
