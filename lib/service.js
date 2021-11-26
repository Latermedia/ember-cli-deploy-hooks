const pick = require("lodash.pick");
const merge = require("lodash.merge");

module.exports = class Service {
  constructor(options) {
    this.serviceOptions = merge(
      options.defaults,
      options.user,
      options.hook || {}
    );
  }

  buildServiceCall(context) {
    const opts = {};

    for (const key in this.serviceOptions) {
      const value = this.serviceOptions[key];
      const isFunction = typeof value === "function";
      opts[key] = isFunction ? value.bind(this.serviceOptions)(context) : value;
    }

    return pick(opts, ["url", "method", "headers", "body", "auth", "critical"]);
  }
};
