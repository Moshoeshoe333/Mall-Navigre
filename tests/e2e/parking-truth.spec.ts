import { test, expect } from "@playwright/test";

test("Parking Truth Test: Save -> Reload -> Recover -> Offline -> Route", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await page.locator("#save-my-car").click();
  await expect(page.locator("#parking-passport")).toContainText("Car location saved");

  // Proves persistence/hydration across a real document reload while online.
  await page.reload();
  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await expect(page.locator("#parking-passport")).toContainText("Car location saved");

  // Proves the recovered passport remains usable with the network disabled.
  await context.setOffline(true);
  await expect(page.locator(".status")).toContainText("Offline");
  await page.locator("#find-my-car").click();
  await expect(page.locator("#navigation-route")).toBeVisible();
  await expect(page.locator("#navigation-route")).toContainText("Preview only");
  await expect(page.locator("body")).toContainText("Displaying schematic preview. Turn-by-turn guidance disabled.");
  await expect(page.locator("#navigation-route")).not.toContainText("Guidance active");
});

test("Route presentation fails closed when parking authorization rejects the session", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#hydration-skeleton")).toBeHidden();

  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("mall-navigre", 2);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction("parking-sessions", "readwrite");
          tx.objectStore("parking-sessions").put({
            id: "low-confidence-session",
            mallId: "mall-of-africa",
            parkadeId: "parkade-c",
            levelId: "mofa-parking-4",
            landmarkId: "p4-start",
            capturedAt: new Date().toISOString(),
            source: "manual",
            confidence: 0.49,
          }, "active");
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Session write failed")); };
          tx.onabort = () => { db.close(); reject(tx.error ?? new Error("Session write aborted")); };
        } catch (error) {
          db.close();
          reject(error instanceof Error ? error : new Error("Session write failed"));
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Database open failed"));
      request.onblocked = () => reject(new Error("Database open was blocked"));
    });
  });

  await page.reload();
  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await page.locator("#find-my-car").click();
  await expect(page.locator("#navigation-route")).toHaveCount(0);
  await expect(page.locator("body")).toContainText("Navigation is unavailable until the saved parking session is eligible.");
});

test("Parking Truth Test: corrupted persisted state fails closed", async ({ page }) => {
  await page.goto("/");
  // Wait for the app's own IndexedDB hydration to finish before opening the
  // same database from the test. This avoids racing the application's first
  // database connection and turning a deterministic corruption test into a
  // 30-second IndexedDB timeout.
  await expect(page.locator("#hydration-skeleton")).toBeHidden();

  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("mall-navigre", 2);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction("parking-sessions", "readwrite");
          tx.objectStore("parking-sessions").put({ id: "corrupt" }, "active");
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Corruption write failed")); };
          tx.onabort = () => { db.close(); reject(tx.error ?? new Error("Corruption write aborted")); };
        } catch (error) {
          db.close();
          reject(error instanceof Error ? error : new Error("Corruption write failed"));
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Database open failed"));
      request.onblocked = () => reject(new Error("Database open was blocked"));
    });
  });

  await page.reload();
  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await expect(page.locator("#corrupted-state")).toBeVisible();
  await expect(page.locator("#parking-passport")).toContainText("Stored parking data could not be restored");
});
