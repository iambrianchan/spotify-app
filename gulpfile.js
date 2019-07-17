"use strict";

// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cssnano = require("cssnano");
const del = require("del");
const eslint = require("gulp-eslint");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const pug = require("gulp-pug");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const webpack = require("webpack");
const webpackconfig = require("./webpack.config.js");
const webpackstream = require("webpack-stream");

// BrowserSync
function browserSync(done) {
  browsersync.init({
    proxy: "localhost:8080",
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean assets
function clean() {
  return del(["./build/assets/"]);
}

// Optimize Images
function images() {
  return gulp
    .src("./public/src/img/*")
    .pipe(newer("./build/assets/img"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./build/assets/img"));
}

// Pug task
function pugTask() {
  return gulp
    .src("public/src/**/*.pug")
    .pipe(plumber())
    .pipe(pug({ pretty: true}))
    .pipe(gulp.dest("./build/assets"))
    .pipe(browsersync.stream());
};

// CSS task
function css() {
  return gulp
    .src("./public/src/**/*.scss")
    .pipe(plumber())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest("./build/assets/"))
    .pipe(browsersync.stream());
}

// Lint scripts
function scriptsLint() {
  return gulp
    .src(["./public/src/*/*.js", "./gulpfile.js", "./webpack.config.js"])
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
      .src(["./public/src/*/*.js"])
      .pipe(plumber())
      .pipe(webpackstream(webpackconfig, webpack))
      // folder only, filename is specified in webpack config
      .pipe(gulp.dest("./build/assets/js/"))
      .pipe(browsersync.stream())
  );
}

// Watch files
function watchFiles() {
  gulp.watch("./public/src/views/*", pugTask);
  gulp.watch("./public/src/css/*", css);
  gulp.watch("./public/src/js/*", gulp.series(scriptsLint, scripts));
  gulp.watch("./public/src/js/components/*", gulp.series(scriptsLint, scripts));
  gulp.watch("./gulpfile.js", gulp.series(scriptsLint, scripts));
  gulp.watch("./webpack.config.js", gulp.series(scriptsLint, scripts));
  gulp.watch(
    [
      "./_includes/**/*",
      "./_layouts/**/*",
      "./_pages/**/*",
      "./_posts/**/*",
      "./_projects/**/*"
    ],
    gulp.series(browserSyncReload)
  );
  gulp.watch("./public/src/img/*", images);
}

const js = gulp.series(scriptsLint, scripts);
const build = gulp.series(clean, gulp.parallel(pugTask, css, images, js));
const watch = gulp.parallel(watchFiles, browserSync);


// export tasks
exports.images = images;
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;