// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const chalk = require('chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const config = require('../config/webpack.config.prod');
const paths = require('../config/paths');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const pkgInfo = require('../package.json');

const introString = `Building ${pkgInfo.name} for distribution...`;
const introStringStyled = `Building ${chalk.underline(pkgInfo.name)} for distribution...`;
const padding = 5;

function centerText(string = '', stringLength, referenceLength) {
  if (stringLength > referenceLength) {
    return string;
  }

  const diff = referenceLength - stringLength;
  let paddingLeft = Math.floor(diff / 2);
  let paddingRight = paddingLeft;


  if (diff % 2 > 0) {
    paddingRight += diff % 2;
  }

  return ` ${Array(paddingLeft).join(' ')}${string}${Array(paddingRight).join(' ')} `;
}

const version = `v${pkgInfo.version}`;

const headerWidth = introString.length + padding * 2;

console.log(chalk.dim(Array(headerWidth + 1).join('-')));
console.log(chalk.dim(centerText(chalk.bold(chalk.white(' ')), ' '.length, headerWidth)));
console.log(chalk.dim(centerText(chalk.bold(chalk.white(introStringStyled)), introString.length, headerWidth)));
console.log(chalk.dim(centerText(chalk.bold(chalk.dim(version)), version.length, headerWidth)));
console.log(chalk.dim(centerText(chalk.bold(chalk.white(' ')), ' '.length, headerWidth)));
console.log(chalk.dim(`${Array(headerWidth + 1).join('-')}\n`));

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// First, read the current file sizes in build directory.
// This lets us display how much they changed later.
measureFileSizesBeforeBuild(paths.appBuild)
  .then(previousFileSizes => {
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);
    // Start the webpack build
    return build(previousFileSizes);
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log(warnings.join('\n\n'));
        console.log(
          '\nSearch for the ' +
            chalk.underline(chalk.yellow('keywords')) +
            ' to learn more about each warning.'
        );
        console.log(
          'To ignore, add ' +
            chalk.cyan('// eslint-disable-next-line') +
            ' to the line before.\n'
        );
      } else {
        console.log(chalk.green('Compiled JavaScript successfully.\n'));
      }

      console.log('JavaScript bundle size (gzip):');
      printFileSizesAfterBuild(
        stats,
        previousFileSizes,
        paths.appBuild,
        WARN_AFTER_BUNDLE_GZIP_SIZE,
        WARN_AFTER_CHUNK_GZIP_SIZE
      );
      console.log();
    },
    err => {
      console.log(chalk.red('Failed to compile.\n'));
      console.trace((err.message || err) + '\n');
      process.exit(1);
    }
  );

// Create the production build and print the deployment instructions.
function build(previousFileSizes) {
  console.log(chalk.blue('Copying SCSS...'));
  fs.copy(paths.styleSrc, paths.appBuild)
    .then(() => console.log(chalk.green('Copied SCSS successfully.')))
    .catch((error) => console.error(chalk.red('Failed copying SCSS.')));

  console.log(chalk.blue('Compiling JavaScript...'));
  let compiler = webpack(config);
  return new Promise((resolve, reject) => {

    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      const messages = formatWebpackMessages(stats.toJson({}, true));
      if (messages.errors.length) {
        return reject(new Error(messages.errors.join('\n\n')));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }
      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      });
    });
  });
}
