const { contextBridge, ipcRenderer } = require("electron");

console.log("[Preload] preload.js started");

contextBridge.exposeInMainWorld("electronAPI", {
  ipcRenderer: {
    invoke: (channel, data) => {
      console.log(`[Preload] ipcRenderer.invoke called on channel: "${channel}" with data:`, data);
      return ipcRenderer.invoke(channel, data)
        .then((res) => {
          console.log(`[Preload] ipcRenderer.invoke response from "${channel}":`, res);
          return res;
        })
        .catch((err) => {
          console.error(`[Preload] ipcRenderer.invoke error from "${channel}":`, err);
          throw err;
        });
    },
    send: (channel, data) => {
      console.log(`[Preload] ipcRenderer.send called on channel: "${channel}" with data:`, data);
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      console.log(`[Preload] ipcRenderer.on registered for channel: "${channel}"`);
      ipcRenderer.on(channel, (event, ...args) => {
        console.log(`[Preload] ipcRenderer.on triggered for channel: "${channel}" with args:`, args);
        func(...args);
      });
    },
  },

  print: (options = {}) => {
    console.log("[Preload] print() called with options:", options);
    return ipcRenderer.invoke("print-direct", options)
      .then((res) => {
        console.log("[Preload] print() response:", res);
        return res;
      })
      .catch((err) => {
        console.error("[Preload] print() error:", err);
        throw err;
      });
  },

  getPrinters: () => {
    console.log("[Preload] getPrinters() called");
    return ipcRenderer.invoke("get-printers")
      .then((res) => {
        console.log("[Preload] getPrinters() response:", res);
        return res;
      })
      .catch((err) => {
        console.error("[Preload] getPrinters() error:", err);
        throw err;
      });
  },
});

console.log("[Preload] electronAPI exposed to window.electronAPI");