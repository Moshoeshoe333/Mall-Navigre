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
  await expect(page.locator("#navigation-route")).toContainText("unverified geometry");
});

test("Parking Truth Test: corrupted persisted state fails closed", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("mall-navigre", 2);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("parking-sessions", "readwrite");
        tx.objectStore("parking-sessions").put({ id: "corrupt" }, "active");
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  await page.reload();
  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await expect(page.locator("#corrupted-state")).toBeVisible();
  await expect(page.locator("#parking-passport")).toContainText("Stored parking data could not be restored");
});
