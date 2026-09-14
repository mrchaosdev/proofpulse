import { expect, test } from "@playwright/test";

/**
 * Browser journeys against the deterministic fixture, so these tests spend no
 * Nansen credits and do not depend on mutable external data
 * (08-testing-and-acceptance "Journey C").
 */

const FIXTURE_URL =
  "/investigate/ethereum/0x514910771af9ca656af840dff83e8264ecf986ca?timeframe=1d&mode=fixture";

test.describe("landing page", () => {
  test("explains the product before any request completes", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "See who moved",
    );
    await expect(page.getByText("No trade execution")).toBeVisible();
  });

  test("reaches the fixture investigation from the landing page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Open the .* capture/ }).click();

    await expect(
      page.getByRole("heading", { name: "Signal lens" }),
    ).toBeVisible();
  });
});

test.describe("investigation workspace", () => {
  test("keeps the three scores separate and labelled", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    const readout = page.locator(".signal-lens-readout");
    await expect(readout.getByText("Direction", { exact: true })).toBeVisible();
    await expect(
      readout.getByText("Confidence", { exact: true }),
    ).toBeVisible();
    await expect(
      readout.getByText("Coordination risk", { exact: true }),
    ).toBeVisible();
    // The definitions must travel with the numbers.
    await expect(
      page.getByText("not a price forecast", { exact: false }).first(),
    ).toBeVisible();
  });

  test("labels fixture data persistently", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    const banner = page.getByText("Historical fixture — not live");
    await expect(banner).toBeVisible();

    // The label survives navigation back into the workspace.
    await page.goto("/methodology");
    await page.goBack();
    await expect(banner).toBeVisible();
  });

  test("caps fixture confidence below the high band", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    await expect(page.getByText(/high confidence/)).toHaveCount(0);
  });

  test("shows every score component breakdown", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    await expect(page.getByText("Required-source coverage")).toBeVisible();
    await expect(page.getByText("Cross-segment consistency")).toBeVisible();
    await expect(page.getByText(/score-v/).first()).toBeVisible();
  });

  test("gives the chart a table alternative carrying the same values", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);

    const table = page.getByRole("table", {
      name: /Net flow, average flow, and wallet count by cohort/,
    });
    await expect(table).toBeVisible();
    // An untracked wallet count is reported as such, never as zero.
    await expect(table.getByText("Not tracked").first()).toBeVisible();
  });

  test("lists evidence identifiers in the ledger", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    await expect(
      page.getByRole("rowheader", { name: "FLOW-SM-01" }),
    ).toBeVisible();
    await expect(
      page.getByRole("rowheader", { name: "DER-DIR-01" }),
    ).toBeVisible();
  });

  test("copy summary carries scope, mode, and the limitation", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);
    const summary = page.locator(".summary-block");

    await expect(summary).toContainText("historical fixture, not live");
    await expect(summary).toContainText("score-v0.1");
    await expect(summary).toContainText("not financial advice");
    await expect(summary).toContainText("Timeframe: 1d");
  });
});

test.describe("input validation", () => {
  test("rejects an invalid address in the browser without navigating", async ({
    page,
  }) => {
    await page.goto("/investigate");
    await page.getByLabel("Token contract address").fill("not-an-address");
    await page.getByRole("button", { name: "Run investigation" }).click();

    await expect(page.locator(".field-error")).toContainText("0x");
    await expect(page).toHaveURL(/\/investigate$/);
  });
});

test.describe("responsive and accessible behaviour", () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`has no horizontal page scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(FIXTURE_URL);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("reaches the investigation form by keyboard alone", async ({ page }) => {
    await page.goto("/investigate");
    const address = page.getByLabel("Token contract address");

    await address.focus();
    await page.keyboard.type("0x514910771af9ca656af840dff83e8264ecf986ca");
    await page.keyboard.press("Tab");

    await expect(address).toHaveValue(
      "0x514910771af9ca656af840dff83e8264ecf986ca",
    );
  });

  test("headings are ordered without skipping a level", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    const levels = await page
      .locator("h1, h2, h3")
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])));

    expect(levels.length).toBeGreaterThan(0);
    for (let index = 1; index < levels.length; index += 1) {
      const previous = levels[index - 1] ?? 1;
      const current = levels[index] ?? 1;
      expect(current - previous).toBeLessThanOrEqual(1);
    }
  });

  test("every icon-only control has an accessible name", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    const names = await page
      .getByRole("button")
      .evaluateAll((nodes) =>
        nodes.map(
          (node) =>
            node.getAttribute("aria-label") ?? node.textContent?.trim() ?? "",
        ),
      );

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
