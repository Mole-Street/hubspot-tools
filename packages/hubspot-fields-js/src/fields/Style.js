const ModuleField = require('./ModuleField');
const { transformDataToJson } = require('../lib/FieldTransformer')

class Style extends ModuleField {

  constructor(overrides = {}, children) {
    super();
    this.data = Object.assign({
      "type": "group",
      "name": "styles",
      "tab": 'STYLE',
      "children": children,
    }, overrides);
  }


  /**
   * Return field as JSON
   */
	toJSON() {
    this.data.children = transformDataToJson(this.data.children.filter(c => !!c))
    return this.data
  }


}

module.exports = Style;