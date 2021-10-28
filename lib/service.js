const merge = require('lodash/object/merge');
const mapValues = require('lodash/object/mapValues');
const pick = require('lodash/object/pick');

class Service {
  constructor(options) {
    this.serviceOptions = merge(options.defaults, options.user, options.hook || {});
  }

  buildServiceCall(context) {
    let opts = mapValues(this.serviceOptions, (value)=> {
      return typeof value === 'function' ? value.bind(this.serviceOptions)(context) : value;
    });

    return pick(opts, ['url', 'method', 'headers', 'body', 'auth', 'critical']);
  }
}

module.exports = Service
