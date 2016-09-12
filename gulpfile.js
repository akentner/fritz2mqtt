const gulp = require('gulp');
const ts = require('gulp-typescript');
const server = require('gulp-develop-server');
const concat = require('gulp-concat');

const tsPath = './src/**/*.ts';
const jsPath = './dist/app.js';

gulp.task('default', function () {
    console.log('default task');
});

gulp.task('build:server', () => {
    const tsProject = ts.createProject('./src/tsconfig.json');
    const tsResult = gulp.src(tsPath)
        .pipe(ts(tsProject));

    return tsResult.js
        .pipe(gulp.dest('./dist'))
})
;

gulp.task('watch', () => {
    gulp.watch(tsPath, ['build:server']);
})
;

gulp.task('server:start', () => {
    server.listen({path: jsPath});
})
;

gulp.task('server:restart', () => {
    server.restart((error) => {
        if (error) {
            console.error(error);
        }
    })
    ;
})
;

gulp.task('server:watch', ['server:start'], () => {
    gulp.watch(tsPath, ['build:server']);
    gulp.watch(jsPath, ['server:restart']);
})
;
