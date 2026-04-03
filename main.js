const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: "Skill Game",
    // fullscreen: true,
    icon: path.join(__dirname, "chip.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // For dev:
  // win.loadURL("https://rajgames.online");
  // win.loadURL("https://goldenlotto.online");
  // win.loadURL("https://matka-dev.rexgames.in");
  // win.loadURL("https://zaidenterprise.online");
  // win.loadURL("https://bhagyashree.online");
  win.loadURL("https://skilgame.online");

  // Disable DevTools
  win.webContents.on("devtools-opened", () => {
    win.webContents.closeDevTools();
  });

  // Disable right click
  win.webContents.on("context-menu", (e) => e.preventDefault());

  // Remove menu bar
  Menu.setApplicationMenu(null);

  //   printer api
  ipcMain.handle("get-printers", async (event) => {
    return await event.sender.getPrintersAsync();
  });

  ipcMain.handle("print-direct", async (event, options = {}) => {
    const wc = event.sender;

    return new Promise(async (resolve) => {
      const printOptions = {
        silent: true,
        printBackground: !!options.printBackground,
        pageSize: { width: 72000, height: 1200000 },
      };

      try {
        const printers = await wc.getPrintersAsync();

        console.log("----- [PRINTER DETECTION] -----");
        printers.forEach((p) => {
          console.log(`[FOUND] Name: "${p.name}", Status: ${p.status}, Default: ${p.isDefault}`);
        });

        let targetPrinter = null;

        // Helper function to check if a printer is virtual
        const isVirtualPrinter = (name) => {
          const lowerName = name.toLowerCase();
          return (
            lowerName.includes("pdf") ||
            lowerName.includes("onenote") ||
            lowerName.includes("xps") ||
            lowerName.includes("fax")
          );
        };

        // 1. Try to find an online default printer
        const defaultPrinter = printers.find((p) => p.isDefault);
        if (defaultPrinter && defaultPrinter.status === 0 && !isVirtualPrinter(defaultPrinter.name)) {
          console.log(`[ROUTING] Found online default printer: "${defaultPrinter.name}"`);
          targetPrinter = defaultPrinter;
        }

        // 2. If no valid default printer, find the FIRST online physical printer
        // Note: status 0 usually means "Idle/Ready" or "Online" in Windows spooler.
        if (!targetPrinter) {
          targetPrinter = printers.find((p) => p.status === 0 && !isVirtualPrinter(p.name));
          if (targetPrinter) {
            console.log(`[ROUTING] Found an active physical printer: "${targetPrinter.name}"`);
          }
        }

        if (targetPrinter) {
          console.log(`[SELECTED] -> Routing print job to: "${targetPrinter.name}"`);
          printOptions.deviceName = targetPrinter.name;
        } else {
          console.log(`[DEFAULT] -> No active physical printer found. Letting Electron handle it blindly.`);
        }
        console.log("-------------------------------");
      } catch (err) {
        console.error("Failed to dynamically fetch active printers:", err);
      }

      wc.print(printOptions, (success, failureReason) => {
        if (!success) console.error(`[PRINT ERROR] Reason: ${failureReason}`);
        resolve(success ? { ok: true } : { ok: false, reason: failureReason });
      });
    });
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
