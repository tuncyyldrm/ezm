self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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

  let requestedUrl;
  try {
    requestedUrl = new URL(event.notification.data?.url || "/", self.location.origin);
  } catch {
    requestedUrl = new URL("/", self.location.origin);
  }

  const isSameOrigin = requestedUrl.origin === self.location.origin;
  const isExternalHttps = !isSameOrigin && requestedUrl.protocol === "https:";
  const targetUrl = isSameOrigin
    ? requestedUrl.href
    : isExternalHttps
      ? new URL(
          `/bildirim-baglantisi?url=${encodeURIComponent(requestedUrl.href)}`,
          self.location.origin
        ).href
      : self.location.origin;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        if (isSameOrigin || isExternalHttps) {
          const matchingClient = clients.find(
            (client) => new URL(client.url).origin === self.location.origin
          );
          if (matchingClient) {
            return matchingClient.navigate(targetUrl).then((client) => client?.focus());
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
