import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    experimentalStudio: true,
    chromeWebSecurity: false,
  },
  viewportWidth: 1280,
  viewportHeight: 800
});
