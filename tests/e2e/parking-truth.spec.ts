import { test, expect } from "@playwright/test";

test("Parking Truth Test: Save -> Offline -> Reload -> Recover -> Route", async ({ page, context }) => {
  await page.goto("/");

  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await expect(page.locator("#save-my-car")).toBeVisible();

  await page.locator("#save-my-car").click();
  await expect(page.locator("#parking-passport")).toBeVisible();
  await expect(page.locator("#parking-passport")).toContainText("Car location saved");

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator("#hydration-skeleton")).toBeHidden();
  await expect(page.locator("#parking-passport")).toBeVisible();
  await expect(page.locator("#parking-passport")).toContainText("Car location saved");

  await page.locator("#find-my-car").click();
  await expect(page.locator("#navigation-route")).toBeVisible();
  await expect(page.locator("#navigation-route")).toContainText("unverified geometry");
});

test("Parking Truth Test: corrupted persisted state fails closed", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("mall-navigre", 1);
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
