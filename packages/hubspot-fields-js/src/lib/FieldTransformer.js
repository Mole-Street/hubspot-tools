const glob = require('glob');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const {
	getAbsPathFromCurrent,
	getBasename,
	checkIsDirectory
} = require('../util/path');

/* ---- Directories --------------------- */

const handleDirectory = ({ pathToDir, watch = false, initial = false }) => {
	if (watch) {
		return transformDirectoryWatch({ pathToDir, initial })
	}
	return transformDirectoryOnce({ pathToDir })
}

const transformDirectoryOnce = ({ pathToDir }) => {
	let fullPathToDir = getAbsPathFromCurrent(pathToDir);
	if (!checkIsDirectory(fullPathToDir)) { return; }
	
	let files = getFilesToTransform({ fullPathToDir })
	files.forEach(filepath => {
		maybeTransformFile(fullPathToDir, filepath)
	})
}

const transformDirectoryWatch = ({ pathToDir, initial = false }) => {
	let fullPathToDir = getAbsPathFromCurrent(pathToDir);

	if (!checkIsDirectory(fullPathToDir)) { return; }	
	
	const { watch } = require('./watch');
	try {
		
		watch({ src: fullPathToDir, initial })
			.on('add', filepath => maybeTransformFile(fullPathToDir,filepath))
			.on('change', filepath => maybeTransformFile(fullPathToDir, filepath))

		console.log(chalk.yellow(`Now watching ${fullPathToDir}\n`))
	
	} catch (e) {
		console.log(e)
	}
}

const getFilesToTransform = ({ fullPathToDir, ignore = [], absolute = true }) => {
	return glob.sync(`${fullPathToDir}/**/*fields.js`, { ignore, absolute })
}

/* ---- File ---------------------------- */

const maybeTransformFile = (srcPath, filepath) => {
	if (ignoreFile(filepath)) { return; }

	let relative = path.relative(srcPath, filepath)
	if (transformFileToJson(filepath)) {
		console.log(chalk.green(`Transformed ${relative} > fields.json successfully.`))
	}
}

const ignoreFile = (filepath) => {
	let relative = getAbsPathFromCurrent(filepath);
	let basename = getBasename(relative);
	return (basename !== 'fields.js')
}

const transformFileToJson = (filepath, appendToExsting = false) => {
	try {
		// Get the JSON
		let fieldsJson = transformDataToJsonFromJsFile(filepath)
		// Use same path for JSON file
		let filepathJson = filepath.replace('fields.js', 'fields.json');
		// Append transformed onto existing
		fieldsJson = appendToExsting ? appendFromFileToExsting(fieldsJson,filepathJson) : fieldsJson;
		// Write JSON to File
		return writeJsonToFile(filepathJson,fieldsJson)
	} catch (e) {
		console.log(chalk.red(`Could not transform: ${filepath}`));
		// Msg
		(!!e.message ? console.log(chalk.yellow(`Error: ${e.message}`)) : null);
		console.error(e)
		return false
	}
}

const transformDataToJsonFromJsFile = (JsSrcFullPath) => {
	let fields = {}
	try {
		// Delete from Cache
		clearFileFromCache(JsSrcFullPath)
		// Read
		fields = require(JsSrcFullPath);
	} catch (e) {
		throw e
	}
	let fieldsJson = transformDataToJson(fields)
	return fieldsJson
}

const writeJsonToFile = (JsonSrcFullPath, fieldsJson = []) => {
	try {
		// Delete existing JSON
		if (fs.existsSync(JsonSrcFullPath)) {
			fs.unlinkSync(JsonSrcFullPath);
		}
		// Write to file
		fs.writeFileSync(JsonSrcFullPath, JSON.stringify(fieldsJson, null, 4));
		//Return
		return true
	}
	catch { 
		throw e
	}
	return false;
}

const appendFromFileToExsting = (fieldsJson = [], JsonSrcFullPath) => {
	if (fs.existsSync(JsonSrcFullPath)) { 
		let existingJson = parseJsonFromFile(JsonSrcFullPath);
		fieldsJson = existingJson.concat(fieldsJson);
	}
	return fieldsJson;
}

const parseJsonFromFile = (JsonSrcFullPath) => {
	let fieldsJson = {}
	try {
		fieldsJson = JSON.parse(fs.readFileSync(JsonSrcFullPath));
	} catch (e) {
		throw e
	}
	return fieldsJson
}

const clearFileFromCache = (filepath) => {
	delete require.cache[require.resolve(filepath)]
}

/* ---- Fields --------------------------- */

// Cycle through the array exported from fields.js and transform to JSON
const transformDataToJson = (fields) => {
	// Transform all fields in array toJSON()
	return fields
		.filter(c => validateField(c))
		.reduce(reduceNestedFieldArrays,[])
		.map(field => transformFieldToJson(field));
}

// Validate Field
const validateField = (field) => {
	return !!field && typeof field == 'object'
}

// Reduce Nested Arrays of Fields
const reduceNestedFieldArrays = (previous, current, index, array) => {
	if (Array.isArray(current)) {

		current.forEach(f => {
			if (Array.isArray(f)) {
				let reducedRecursion = f.reduce(reduceNestedFieldArrays,[])
				if (Array.isArray(reducedRecursion)) {
					reducedRecursion.forEach(fr => {
						previous.push(fr)
					})
				} else {
					previous.push(f)
				}
			} else {
				previous.push(f)
			}
		})
	} else {
		previous.push(current)
	}
	return previous
}

// Transform single field into JSON using the toJSON method
const transformFieldToJson = (field) => {
	if (typeof field['toJSON'] === "function") {
		return field.toJSON()
	}
	return field;
}


module.exports = {
	handleDirectory,
	transformDirectory : handleDirectory,
	transformDirectoryOnce,
	transformDirectoryWatch,
	getFilesToTransform,
	transformDataToJson,
	transformDataToJsonFromJsFile,
	writeJsonToFile,
	clearFileFromCache
};