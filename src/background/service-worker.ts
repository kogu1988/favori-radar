import type { ExtensionMessage } from "../shared/messages";
import { saveSnapshot } from "../storage/database";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("refresh-reminder", { periodInMinutes: 360 });
});

chrome.action.onClicked.addListener(() => {
  void chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "FAVORITE_SCAN_STATUS") {
      void chrome.storage.local.set({ favoriteScanStatus: message.payload });
      return false;
    }

    if (message.type === "LISTING_DETAIL_DISCOVERED") {
      void saveSnapshot(message.payload)
        .then(() => sendResponse({ ok: true }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata"
          })
        );
      return true;
    }

    if (message.type === "FETCH_LISTING_DETAIL") {
      void fetch(message.payload.url, { credentials: "include" })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`İlan detayı alınamadı: ${response.status}`);
          }
          sendResponse({ ok: true, html: await response.text() });
        })
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Bilinmeyen hata"
          })
        );
      return true;
    }

    if (message.type !== "FAVORITES_DISCOVERED") {
      return false;
    }

    void Promise.all(message.payload.map(saveSnapshot))
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Bilinmeyen hata"
        })
      );
    return true;
  }
);
