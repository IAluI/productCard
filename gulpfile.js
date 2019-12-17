'use strict';

const gulp = require('gulp');
const gulplog = require('gulplog');
const webpack = require('webpack');
const notifier = require('node-notifier');
const path = require('path');

// модуль для форматирования
const prettier = require('@bdchauvette/gulp-prettier');
// модуль для форматирования html
const htmlbeautify = require('gulp-html-beautify');
// модуль для создания svg-спрайтов
const svgSprite = require('gulp-svg-sprite');
// модуль для склеевания фалов
const concat = require('gulp-concat');
// модуль для переименования фалов
const replace = require('gulp-replace');
// модуль для переименования фалов
const rename = require('gulp-rename');
// Минификация html
const htmlmin = require('gulp-htmlmin');
// Модуль для условного управления потоком
const gulpIf = require('gulp-if');
// плагин для удаления файлов и каталогов
const del = require('del');
// сервер для работы и автоматического обновления страниц
const browserSync = require('browser-sync').create();
// html препроцессор
const pug = require('gulp-pug');
// модуль для компиляции SASS (SCSS) в CSS
const sass = require('gulp-sass');
// модуль для автоматической установки автопрефиксов
const autoprefixer = require('gulp-autoprefixer');
// модуль для построения sourcemap
const sourcemaps = require('gulp-sourcemaps');
// модуль для минификации css
const cssmin = require('gulp-minify-css');
// плагин для сжатия PNG, JPEG, GIF и SVG изображений
const imagemin = require('gulp-imagemin');
// плагин для сжатия jpeg
const jpegrecompress = require('imagemin-jpeg-recompress');
// плагин для сжатия png
const pngquant = require('imagemin-pngquant');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

const paths = {
  pug: {
    src: "./src/pug/*.pug",
    dist: "./dist/",
    watch: "./src/pug/*.pug"
  },
  images: {
    src: "./src/img/*.{jpg,jpeg,png,gif,svg}",
    dist: "./dist/uploaded/files/images/",
    watch: "./src/img/*.{jpg,jpeg,png,gif,svg}"
  },
  styles: {
    src: "./src/style/*.scss",
    dist: "./dist/uploaded/files/css/",
    watch: "./src/style/*.scss"
  },
  js: {
    src: "./src/js/*.js",
    dist: "./dist/uploaded/files/js/",
    watch: "./src/js/*.js"
  },
  svgSprite: {
    src: "./src/icons/*.svg",
    dist: "./dist/uploaded/files/images/",
    watch: ["./src/icons/*.svg", "./src/icons/scssSpriteTemplate.mustache"]
  }
};

gulp.task('clean', () => {
  return del([
    './dist/**',
    './tmp/**'
  ]);
});

gulp.task('pug', () => {
  return gulp.src(paths.pug.src)
    .pipe(pug(/*{ pretty: true }*/))
    .pipe(rename({
      dirname: 'pages'
    }))
    .pipe(prettier({
      htmlWhitespaceSensitivity: 'ignore'
    }))
    .pipe(gulp.dest(paths.pug.dist))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('js', () => {
  return gulp.src(paths.js.src)
    .pipe(gulp.dest(paths.js.dist))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('styles', () => {
  return gulp.src(paths.styles.src)
    .pipe(sass({
      includePaths: [
        process.cwd()
      ]
    }))
    .pipe(autoprefixer())
    .pipe(gulpIf(!isDevelopment, cssmin()))
    .pipe(gulp.dest(paths.styles.dist))
    .pipe(browserSync.stream());
});

gulp.task('images', () => {
  return gulp.src(paths.images.src)
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      jpegrecompress({
        loops: 5,
        min: 70,
        max: 75,
        quality: 'medium'
      }),
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {cleanupIDs: false}
        ]
      }),
      imagemin.optipng({optimizationLevel: 3}),
      pngquant({
        quality: [0.7, 0.8],
        speed: 5
      })
    ]))
    .pipe(rename((path) => {
      path.dirname = path.dirname.replace(/pages\\|img/g, '');
    }))
    .pipe(gulp.dest(paths.images.dist))
    .pipe(gulp.dest("./dist/www/local/assets/img/"))
    .pipe(browserSync.stream());
});

gulp.task('svgSprite', () => {
  return gulp.src(paths.svgSprite.src)
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest: '.',
          sprite: 'icons.svg',
          render: {
            scss: {
              dest: '_icons.scss',
              template: 'src/icons/scssSpriteTemplate.mustache'
            }
          },
          example: true,
        }
      }
    }))
    .pipe(gulp.dest((file) => {
      return file.extname == '.svg' ?  paths.svgSprite.dist : './tmp/';
    }))
    .pipe(browserSync.stream());
});

gulp.task('webpack', function(callback) {
  let options = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
      main: path.resolve(__dirname, 'src/common/common.js')
    },
    output:  {
      path: path.resolve(__dirname, 'dist/www/local/assets/js'),
      publicPath: '/js/'
    },
    watch:   isDevelopment,
    watchOptions: {
      aggregateTimeout: 500,
      ignored: /node_modules/
    },
    devtool: isDevelopment ? 'cheap-module-inline-source-map' : false,
    module:  {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    },
    /*plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        Popper: ['popper.js', 'default']
      })
    ]*/
  };

  webpack(options, function(err, stats) {
    if (!err) {
      err = stats.toJson().errors[0];
    }
    if (err) {
      notifier.notify({
        title: 'Webpack',
        message: err
      });
      gulplog.error(err);
    } else {
      gulplog.info(stats.toString({
        colors: true
      }));
    }
    if (!options.watch && err) {
      callback(err);
    } else {
      callback();
    }
  });
});

gulp.task('webserver', () => {
  browserSync.init({
    server: "./dist/",
    port: 4000,
    middleware: [
      function(req, res, next) {
        //console.log(req.url);
        if (!/(\.css$)|(\.js$)|(\.json$)/.test(req.url)) {
          req.url = '/pages' + req.url;
        }
        //console.log(req.url);
        next();
      }
    ]
  });

  gulp.watch(paths.pug.watch, gulp.series('pug'));
  gulp.watch(paths.js.watch, gulp.series('js'));
  gulp.watch(paths.styles.watch, gulp.series('styles'));
  gulp.watch(paths.images.watch, gulp.series('images'));
  gulp.watch(paths.svgSprite.watch, gulp.series('svgSprite'));
});

gulp.task('build',
  gulp.series('clean',
    'svgSprite',
    gulp.parallel(
      'images',
      'styles',
      'js',
      //'webpack',
      'pug'
    )
  )
);

gulp.task('default', gulp.series(
  'build',
  'webserver'
));
