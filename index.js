/* jshint node: true */
"use strict";

let RSVP = require("rsvp");
let DeployPluginBase = require("ember-cli-deploy-plugin");
let Notify = require("./lib/notify");
let Service = require("./lib/service");
let pickBy = require("lodash.pickby");

function notificationHook(hookName) {
  return function (context) {
    const preConfig = this.readConfig("configuredServices");
    const userConfig = this.readConfig("services");

    const promises = [];

    for (let serviceName in userConfig) {
      const defaultOptions = preConfig[serviceName] || {};
      const userOptions = userConfig[serviceName] || {};
      const hookOptions = userConfig[serviceName][hookName] || {};

      const service = new Service({
        defaults: defaultOptions,
        user: userOptions,
        hook: hookOptions,
      });

      if (service.serviceOptions[hookName]) {
        const notify = new Notify({
          plugin: this,
        });

        const opts = service.buildServiceCall(context);

        promises.push(notify.send(serviceName, opts));
      }
    }

    return RSVP.all(promises);
  };
}

module.exports = {
  name: "ember-cli-deploy-hooks",

  createDeployPlugin: function (options) {
    const DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        configuredServices: function (/* context */) {
          return {
            bugsnag: {
              url: "http://notify.bugsnag.com/deploy",
              method: "POST",
              headers: {},
              body: function () {
                const apiKey = this.apiKey;

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
        const services = this.readConfig("services");
        const hooks = [
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

        const servicesWithNoHooksConfigured = pickBy(services, (service) => {
          const configuredHooks = Object.keys(service).filter((serviceKey) =>
            hooks.includes(serviceKey)
          );
          return configuredHooks.length === 0;
        });

        console.log(servicesWithNoHooksConfigured);

        for (const serviceName in servicesWithNoHooksConfigured) {
          this.log(
            `Warning! ${serviceName} - Service configuration found but no hook specified in deploy configuration. Service will not be notified.`,
            { color: "yellow" }
          );
        }
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
