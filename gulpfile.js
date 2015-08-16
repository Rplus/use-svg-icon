'use strict';

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var imagemin = require('gulp-imagemin');
var svgo = require('gulp-svgo');
var jade = require('gulp-jade');
var rename = require('gulp-rename');
var data = require('gulp-data');
var svgstore = require('gulp-svgstore');
var svgfallback = require('gulp-svgfallback');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var del = require('del');
var ghPages = require('gulp-gh-pages');

var path = {
  html: {
    src: './app/',
    dest: './dist/'
  },
  svg: {
    src: './app/img/',
    dest: './dist/img/'
  }
};

gulp.task('clean:svg', del.bind(null, [path.svg.dest]));
gulp.task('clean', del.bind(null, [path.html.dest]));

gulp.task('jade2html', function() {
  gulp.src(path.html.src + '*.jade')
    .pipe(plumber({
        errorHandler: function (err) {
            console.log(err);
            this.emit('end');
        }
    }))
    .pipe(data(function(file) {
      return require('./app/icons-map.json');
    }))
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest(path.html.dest));
});

var minifySVGs = (function() {
  return gulp.src(path.svg.src + '**/*.svg', { base: path.svg.src})
    .pipe(rename(function (path) {
      var name = path.dirname.split(path.sep);
      name.push(path.basename);
      path.basename = name.join('-');
    }))
    .pipe(imagemin());
})();

gulp.task('svgicons', ['clean:svg', 'svgfallback'], function() {
  // svgstore
  minifySVGs
    .pipe(svgstore({inlineSvg: true}))
    .pipe(gulp.dest(path.svg.dest));
});

gulp.task('svgfallback', ['clean:svg'], function() {
  // svgfallback
  minifySVGs
    .pipe(svgfallback())
    .pipe(gulp.dest(path.svg.dest));
});

gulp.task('serve', function () {
  browserSync({
    open: 'external',
    browser: 'google-chrome',
    notify: false,
    ghostMode: {
      clicks: false,
      scroll: false,
      forms: false
    },
    scrollThrottle: 500,
    reloadDebounce: 1000,
    startPath: path.html.dest,
    server: ''
  });
});

gulp.task('default', ['clean'], function(cb) {
  runSequence('jade2html', 'svgicons', cb);
});








// slide task
var revealFolder = 'node_modules/reveal.js/';
var slideFolder = './slide/';
var slideFileName = 'index.html';

gulp.task('slide-clone', function() {
  // force delete old slide file
  del([revealFolder + slideFileName], function (err, paths) {
      console.log('Deleted files/folders:\n', paths.join('\n'));
  });

  // clone slide's files
  gulp.src(slideFolder + '**/*.*')
    .pipe(gulp.dest(revealFolder));
});

gulp.task('slide-view', ['slide-clone'], function() {
  // start to browser the slide
  browserSync({
    open: 'external',
    browser: 'google-chrome',
    notify: false,
    ghostMode: {
      clicks: false,
      scroll: false,
      forms: false
    },
    scrollThrottle: 500,
    reloadDebounce: 1000,
    startPath: revealFolder,
    index: slideFileName,
    server: ''
  });
});

gulp.task('slide-dev', ['slide-view'], function() {
  gulp.watch(slideFolder + slideFileName).on('change', function() {
    runSequence('slide-clone', browserSync.reload);
  });
});

gulp.task('deploy', ['slide-clone'], function() {
  return gulp.src([
      revealFolder + '**/*',
      '!' + revealFolder + 'node_modules{,/**}',
      '!' + revealFolder + 'test{,/**}'
    ])
    .pipe(ghPages());
});
