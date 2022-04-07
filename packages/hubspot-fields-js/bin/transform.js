#!/usr/bin/env node

const { program } = require('commander');

program
	.name('transform')
	.usage('--src <srcDirectory>')
	.description('Scan a directory on your computer and transform the fields.js files to fields.json')
	.option('--src <srcDirectory>', 'eg. --src="./src" - Relative path from your current working directory to the directory your files are in. Defaults to current directory.')
	.option('-w,--watch', 'Watch a directory on your computer for changes and transform the fields.js files')
	.option('-i,--initial', 'Transform fields.js when first initiating the watcher')
	.parse(process.argv);

const { src, watch, initial } = program.opts()

const { handleDirectory } = require('../src/lib/FieldTransformer');
const { checkHsIgnore } = require('../src/lib/hsIgnore');

(async () => { 
	// check hs ignore file
	await checkHsIgnore()
	// handle 
	handleDirectory({
		pathToDir 			: src || '.',
		watch				: !!watch,
		initial				: !!watch && !!initial,
		extraDirsToWatch	: (extra ? extra.split(',') : []),
})()
