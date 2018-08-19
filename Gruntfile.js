module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.initConfig({
		concat: {
			options: {
				sourceMap: 'true',
			},
			dist: {
				src: ['src/main/javascript/lc.polyfill.js','src/main/javascript/lc.core.js','src/main/javascript/lc.app.js','src/main/javascript/**/*.js','!src/main/javascript/lc.footer.js','src/main/javascript/lc.footer.js'],
				dest: 'dist/lc-core.js',
			}
		},
		uglify: {
			options: {
				sourceMap: true
			},
			all: {
				files: {
					'dist/lc-core.min.js': ['dist/lc-core.js']
				}
			}
		},
		jasmine: {
			src: 'src/main/javascript/**/*.js',
			options: {
				specs: 'src/test/specs/**/*.js',
				noSandbox: true
			}
		}
    });
    grunt.registerTask('default', ['jasmine','newer:concat','newer:uglify']);
    grunt.registerTask('release', ['jasmine','concat','uglify']);
};