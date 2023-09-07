/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "jest-esbuild",
  },
};
