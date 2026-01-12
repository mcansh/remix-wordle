import { router } from "./router";

export default {
  fetch(request: Request) {
    return router.fetch(request);
  },
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
