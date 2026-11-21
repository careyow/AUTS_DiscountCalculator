if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);

  if (hadController) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) {
        return;
      }

      refreshing = true;
      window.location.reload();
    });
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", {
      updateViaCache: "none"
    }).catch((error) => {
      console.error("The offline app could not be registered.", error);
    });
  });
}
