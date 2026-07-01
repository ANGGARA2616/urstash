"use strict";

const $ = (id) => document.getElementById(id);

const els = {
  settings: $("settings"),
  capture: $("capture"),
  gear: $("gear"),
  apiUrl: $("apiUrl"),
  token: $("token"),
  saveSettings: $("save-settings"),
  cancelSettings: $("cancel-settings"),
  settingsMsg: $("settings-msg"),
  typeSeg: $("type-seg"),
  title: $("title"),
  url: $("url"),
  urlField: $("url-field"),
  description: $("description"),
  descLabel: $("desc-label"),
  tags: $("tags"),
  shot: $("shot"),
  shotField: $("shot-field"),
  save: $("save"),
  msg: $("msg"),
};

let config = { apiUrl: "", token: "" };
let activeTab = null;
let selectedType = "link";

function show(view) {
  els.settings.classList.toggle("hidden", view !== "settings");
  els.capture.classList.toggle("hidden", view !== "capture");
}

function setMsg(node, text, kind) {
  node.textContent = text || "";
  node.className = "msg" + (kind ? " " + kind : "");
}

async function loadConfig() {
  const stored = await chrome.storage.local.get(["apiUrl", "token"]);
  config.apiUrl = (stored.apiUrl || "").replace(/\/+$/, "");
  config.token = stored.token || "";
}

function isConfigured() {
  return Boolean(config.apiUrl && config.token);
}

/* ---------------- settings ---------------- */

function openSettings() {
  els.apiUrl.value = config.apiUrl;
  els.token.value = config.token;
  els.cancelSettings.classList.toggle("hidden", !isConfigured());
  setMsg(els.settingsMsg, "");
  show("settings");
}

async function saveSettings() {
  const apiUrl = els.apiUrl.value.trim().replace(/\/+$/, "");
  const token = els.token.value.trim();
  if (!apiUrl || !token) {
    setMsg(els.settingsMsg, "Both fields are required.", "err");
    return;
  }
  await chrome.storage.local.set({ apiUrl, token });
  config = { apiUrl, token };
  await initCapture();
  show("capture");
}

/* ---------------- capture ---------------- */

function applyTypeUI() {
  els.urlField.classList.toggle("hidden", selectedType === "note");
  els.shotField.classList.toggle("hidden", selectedType === "note");
  els.descLabel.textContent = selectedType === "note" ? "Note" : "Description";
  if (selectedType === "screenshot") {
    els.shot.checked = true;
    els.shot.disabled = true;
  } else {
    els.shot.disabled = false;
  }
}

async function initCapture() {
  setMsg(els.msg, "");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    activeTab = tab || null;
    if (tab) {
      els.title.value = tab.title || "";
      els.url.value = tab.url || "";
    }
    // Grab the current text selection (best effort — fails on restricted pages).
    if (tab?.id != null) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString() ?? "",
        });
        const sel = results?.[0]?.result;
        if (sel) els.description.value = sel;
      } catch {
        /* restricted page — ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

async function captureScreenshot() {
  const windowId = activeTab?.windowId;
  return await chrome.tabs.captureVisibleTab(windowId, { format: "png" });
}

async function save() {
  setMsg(els.msg, "");
  const title = els.title.value.trim();
  if (!title) {
    setMsg(els.msg, "Title is required.", "err");
    return;
  }
  const url = els.url.value.trim();
  const description = els.description.value.trim();
  const tags = els.tags.value
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);

  if (selectedType === "link" && !url) {
    setMsg(els.msg, "URL is required for a link.", "err");
    return;
  }
  if (selectedType === "note" && !description) {
    setMsg(els.msg, "Write something for a note.", "err");
    return;
  }

  els.save.disabled = true;
  els.save.textContent = "Saving…";

  try {
    let screenshot;
    if (selectedType !== "note" && els.shot.checked) {
      try {
        screenshot = await captureScreenshot();
      } catch {
        if (selectedType === "screenshot") {
          throw new Error("Can't screenshot this page (restricted).");
        }
        // link: proceed without a screenshot
      }
    }

    const payload = {
      type: selectedType,
      title,
      url: url || undefined,
      description: description || undefined,
      tags,
      screenshot,
    };

    const res = await fetch(`${config.apiUrl}/api/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      setMsg(els.msg, "Token rejected. Check Settings.", "err");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMsg(els.msg, data?.error || `Failed (${res.status}).`, "err");
      return;
    }

    setMsg(els.msg, "Saved to Stash ✓", "ok");
    setTimeout(() => window.close(), 900);
  } catch (e) {
    setMsg(els.msg, e instanceof Error ? e.message : "Something went wrong.", "err");
  } finally {
    els.save.disabled = false;
    els.save.textContent = "Save to Stash";
  }
}

/* ---------------- wiring ---------------- */

els.gear.addEventListener("click", openSettings);
els.saveSettings.addEventListener("click", saveSettings);
els.cancelSettings.addEventListener("click", () => show("capture"));
els.save.addEventListener("click", save);

els.typeSeg.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  selectedType = btn.dataset.type;
  for (const b of els.typeSeg.querySelectorAll(".seg-btn")) {
    b.classList.toggle("active", b === btn);
  }
  applyTypeUI();
});

(async function main() {
  await loadConfig();
  applyTypeUI();
  if (isConfigured()) {
    await initCapture();
    show("capture");
  } else {
    openSettings();
  }
})();
