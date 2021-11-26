const RSVP = require("rsvp");
const request = require("request");
const merge = require("lodash.merge");

function optsValid(opts) {
  return opts.url && opts.headers && opts.method && opts.body;
}

function isCritical(opts) {
  if ("critical" in opts) {
    delete opts.critical;
    return true;
  }
  return false;
}
module.exports = class Notify {
  constructor(options) {
    this._plugin = options.plugin;

    this._client = this._plugin.readConfig("httpClient") || request;
  }

  get _defaults() {
    return {
      method: "POST",
      headers: {},
      json: true,
    };
  }

  send(serviceKey, opts = {}) {
    const plugin = this._plugin;
    const makeRequest = RSVP.denodeify(this._client);
    const critical = isCritical(opts);

    const requestOpts = merge({}, this._defaults, opts);

    if (optsValid(requestOpts)) {
      return makeRequest(requestOpts)
        .then((response) => {
          let body = "";

          if (response && response.body) {
            body = response.body;
          }

          if (typeof body !== "string") {
            body = JSON.stringify(body);
          }

          if (
            critical &&
            !(response.statusCode < 300 && response.statusCode >= 200)
          ) {
            return RSVP.reject(response.statusCode);
          }

          plugin.log(`${serviceKey} => ${body}`);
        })
        .catch((error) => {
          const errorMessage = `${serviceKey} => ${error}`;

          if (critical) {
            return RSVP.reject(error);
          }
          plugin.log(errorMessage, { color: "red" });
        });
    } else {
      const warningMessage =
        "No request issued! Request options invalid! You have to specify `url`, `headers`, `method` and `body`.";

      if (critical) {
        return RSVP.reject(warningMessage);
      }
      plugin.log(`${serviceKey} => ${warningMessage}`, {
        color: "yellow",
        verbose: true,
      });
      return RSVP.resolve();
    }
  }
};
