import { globSync } from 'glob';
import { execSync } from 'child_process';
import { relative } from 'path';

const files = globSync('dist/**/*.js', { absolute: true });

files.forEach(file => {
  const relativePath = relative(process.cwd(), file);  // For nicer logging
  console.log(`Checking tree-shakability for ${relativePath}...`);
  try {
    execSync(`agadoo ${file}`, { stdio: 'inherit' });
    console.log(`Success: ${relativePath} is tree-shakable.\n`);
  } catch (error) {
    console.error(`Failure in ${relativePath}`);
    process.exit(1);  // Fail the whole script if any file has issues
  }
});