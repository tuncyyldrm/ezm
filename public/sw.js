self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "EZM OTO";
  const options = {
    body: payload.body || "Yeni bir duyurumuz var.",
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = new URL(event.notification.data?.url || "/", self.location.origin);
  const targetUrl =
    requestedUrl.origin === self.location.origin
      ? requestedUrl.href
      : self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (matchingClient) {
        return matchingClient.navigate(targetUrl).then(() => matchingClient.focus());
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
