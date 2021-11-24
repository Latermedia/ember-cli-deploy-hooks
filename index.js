/* jshint node: true */
"use strict";

let RSVP = require("rsvp");
let DeployPluginBase = require("ember-cli-deploy-plugin");
let Notify = require("./lib/notify");
let Service = require("./lib/service");
let _ = require("lodash");
let pick = _.pick;

function notificationHook(hookName) {
  return function (context) {
    let preConfig = this.readConfig("configuredServices");
    let userConfig = this.readConfig("services");

    let promises = [];

    for (let key in userConfig) {
      let defaults = preConfig[key] || {};
      let user = userConfig[key] || {};
      let hook = userConfig[key][hookName] || {};

      let service = new Service({
        defaults: defaults,
        user: user,
        hook: hook,
      });

      if (service.serviceOptions[hookName]) {
        let notify = new Notify({
          plugin: this,
        });

        let opts = service.buildServiceCall(context);

        promises.push(notify.send(key, opts));
      }
    }

    return RSVP.all(promises);
  };
}

module.exports = {
  name: "ember-cli-deploy-hooks",

  createDeployPlugin: function (options) {
    let DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        configuredServices: function (/* context */) {
          return {
            bugsnag: {
              url: "http://notify.bugsnag.com/deploy",
              method: "POST",
              headers: {},
              body: function () {
                let apiKey = this.apiKey;

                if (!apiKey) {
                  return;
                }

                return {
                  apiKey: this.apiKey,
                  releaseStage: process.env.DEPLOY_TARGET,
                };
              },
            },

            slack: {
              url: function () {
                return this.webhookURL;
              },
              method: "POST",
              headers: {},
            },
          };
        },

        httpClient: function (context) {
          return context.notifyHTTPClient;
        },
      },

      setup: function (/* context */) {
        let services = this.readConfig("services");
        let hooks = [
          "willDeploy",
          "willBuild",
          "build",
          "didBuild",
          "willPrepare",
          "prepare",
          "didPrepare",
          "willUpload",
          "upload",
          "didUpload",
          "willActivate",
          "activate",
          "didActivate",
          "didDeploy",
          "teardown",
          "fetchRevisions",
          "displayRevisions",
          "didFail",
        ];

        let servicesWithNoHooksConfigured = pick(services, function (service) {
          return _.intersection(Object.keys(service), hooks).length === 0;
        });

        _.forIn(
          servicesWithNoHooksConfigured,
          function (value, key) {
            this.log(
              "Warning! " +
                key +
                " - Service configuration found but no hook specified in deploy configuration. Service will not be notified.",
              { color: "yellow" }
            );
          },
          this
        );
      },

      willDeploy: notificationHook("willDeploy"),

      willBuild: notificationHook("willBuild"),
      build: notificationHook("build"),
      didBuild: notificationHook("didBuild"),

      willPrepare: notificationHook("willPrepare"),
      prepare: notificationHook("prepare"),
      didPrepare: notificationHook("didPrepare"),

      willUpload: notificationHook("willUpload"),
      upload: notificationHook("upload"),
      didUpload: notificationHook("didUpload"),

      willActivate: notificationHook("willActivate"),
      activate: notificationHook("activate"),
      didActivate: notificationHook("didActivate"),

      didDeploy: notificationHook("didDeploy"),

      teardown: notificationHook("teardown"),

      fetchRevisions: notificationHook("fetchRevisions"),
      displayRevisions: notificationHook("displayRevisions"),

      didFail: notificationHook("didFail"),
    });

    return new DeployPlugin();
  },
};
