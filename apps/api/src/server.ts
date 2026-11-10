import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);

createApp().listen(port, "127.0.0.1", () => {
  console.info(`Melyia API listening on http://127.0.0.1:${port}`);
});
