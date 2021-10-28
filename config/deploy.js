/* eslint-env node */
"use strict";

console.log('way up here');
module.exports = function (deployTarget) {
  const ENV = {
    build: {},
    // include other plugin configuration that applies to all deploy targets here
  };

  ENV["revision-data"] = {
    type: "git-commit",
  };

  if (deployTarget === "production") {
    ENV.build.environment = "production";

    ENV.webhooks = {
      services: {
        checkNightly: {
          url: 'http://060e-216-71-209-85.ngrok.io/',
          method: 'POST',
          headers: {},
          body: {
            text: 'A new revision was activated!'
          },
          willDeploy: {
            body: function() {
              console.log('WILL DEPLOY')
              return '1'
            }
          },
          didActivate: true,
          didDeploy: {
            body: {
              text: 'Deployment successful!'
            }
          },
          didFail: {
            body: {
              text: 'Deployment failed!'
            }
          }
        }
      }
    };
  }

  // Note: if you need to build some configuration asynchronously, you can return
  // a promise that resolves with the ENV object instead of returning the
  // ENV object synchronously.
  return ENV;
};
