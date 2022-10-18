'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const reporter = require('eslint-html-reporter');
const path = require('path');
const fs = require('fs');

gulp.task('clean', () => {
  return del(['build/']);
});

// task to run es lint.
gulp.task('lint', () =>
  gulp.src(['*.js', '*/**/*.js', '!test/**', '!build/**', '!node_modules/**', '!analyze/**', '!ext/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.format(reporter, (results) => {
      fs.writeFileSync(path.join(__dirname, '../../build/lint-report.html'), results);
    }))
    .pipe(eslint.failAfterError())
);

gulp.task('build', gulp.series('clean', 'lint'));
gulp.task('default', gulp.series('lint'));
