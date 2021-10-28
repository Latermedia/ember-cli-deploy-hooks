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
    // ENV.s3 = {
    //   bucket: "later-frontend-assets",
    //   region: "us-east-1",
    // };

    // ENV["s3-index"] = {
    //   bucket: "later-frontend-production",
    //   region: "us-east-1",
    // };

    ENV.webhooks = {
      services: {
        checkNightly: {
          url: 'your-webhook-url',
          method: 'POST',
          headers: {},
          body: {
            text: 'A new revision was activated!'
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
