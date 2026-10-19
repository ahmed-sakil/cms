import { createApp } from "./app.js";
import { ENV } from "./config/env.js";

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`===============================================`);
  console.log(` CMS API Server running on port ${ENV.PORT}`);
  console.log(` Environment: ${ENV.NODE_ENV}`);
  console.log(` Health check: http://localhost:${ENV.PORT}/health`);
  console.log(`===============================================`);
});
