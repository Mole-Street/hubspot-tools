const Group = require('./src/fields/Group');
const Style = require('./src/fields/Style');
const Field = require('./src/fields/Field');
const FieldsPlugin = require('./src/plugins/FieldsPlugin');
const { randomId, parseArgs } = require('./src/Helpers');

module.exports = {
    // Field + Group helpers
    Group,
    Style,
    Field,
    // Webpack plugin
    FieldsPlugin,
    // Helpers
	randomId,
	parseArgs
};