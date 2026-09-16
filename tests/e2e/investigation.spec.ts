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

  test("shows the signature lens with the real captured scores", async ({
    page,
  }) => {
    await page.goto("/");
    const readout = page.locator(".signal-lens-readout");

    // The example is scored by the same code as a live run, so its values must
    // match the investigation the link leads to.
    await expect(readout.getByText("mixed", { exact: true })).toBeVisible();
    await expect(
      readout.getByText("low confidence", { exact: true }),
    ).toBeVisible();
  });

  test("reaches the fixture investigation from the landing page", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: "Open the full investigation" })
      .click();

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

test.describe("relationship expansion", () => {
  const ACTOR = "0x19a99f5b363f2dbb7a35cb0b16f96b3f3ae2c280";

  test("requests nothing until an actor is chosen", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    await expect(
      page.getByText("Nothing is requested until you choose an actor"),
    ).toBeVisible();
    // Coordination risk stays preliminary before any expansion.
    await expect(page.locator(".summary-block")).toContainText(
      "Coordination risk: 14 (low)",
    );
  });

  test("states the credit cost before the call", async ({ page }) => {
    await page.goto(FIXTURE_URL);

    await expect(
      page.getByText("One expansion costs one Nansen credit"),
    ).toBeVisible();
  });

  test("expands an actor and reassesses coordination risk", async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);

    await expect(
      page.getByRole("table", { name: /Related wallets, relation type/ }),
    ).toBeVisible();
    // The single coordination value on the page now includes relationships.
    await expect(page.locator(".summary-block")).toContainText(
      "Coordination risk: 44 (moderate)",
    );
  });

  test("gives the map an equal-status table with the relation types", async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);
    const table = page.getByRole("table", {
      name: /Related wallets, relation type/,
    });

    await expect(table.getByText("First Funder").first()).toBeVisible();
    await expect(table.getByText("Deployed Contract").first()).toBeVisible();
  });

  test("states the first-degree limit and refuses an ownership claim", async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);

    await expect(page.getByText(/First-degree only/)).toBeVisible();
    await expect(
      page.getByText(/an observed link, not shared ownership/).first(),
    ).toBeVisible();
  });

  test("records relationship evidence in the ledger", async ({ page }) => {
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);

    await expect(
      page.getByRole("rowheader", { name: "REL-01-01" }),
    ).toBeVisible();
    await expect(
      page.getByRole("rowheader", { name: "DER-COORD-01" }),
    ).toBeVisible();
  });

  test("ignores an inspect value that is not a valid address", async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_URL}&inspect=not-an-address`);

    // Falls back visibly to the un-inspected view rather than erroring.
    await expect(page.locator(".summary-block")).toContainText(
      "Coordination risk: 14 (low)",
    );
  });

  test("keeps the expanded view free of horizontal page scroll at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("evidence ledger and actor controls", () => {
  const ACTOR = "0x19a99f5b363f2dbb7a35cb0b16f96b3f3ae2c280";

  test("states the result count so ten rows are not read as the market", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);

    await expect(
      page.getByText(/This is not the whole market/).first(),
    ).toBeVisible();
  });

  test("offers relationship expansion from the actor row itself", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);

    await page
      .getByRole("link", { name: "Inspect relationships" })
      .first()
      .click();

    await expect(
      page.getByRole("table", { name: /Related wallets, relation type/ }),
    ).toBeVisible();
  });

  test("marks the actor currently being inspected", async ({ page }) => {
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);

    await expect(page.getByText("Inspecting").first()).toBeVisible();
  });

  test("expands a ledger row to the normalized record", async ({ page }) => {
    await page.goto(FIXTURE_URL);
    const toggle = page
      .getByRole("button", { name: "Show normalized record" })
      .first();

    await toggle.click();

    // The record is the domain evidence item, never a raw upstream payload.
    const json = page.locator(".evidence-json").first();
    await expect(json).toBeVisible();
    await expect(json).toContainText('"provider": "nansen"');
    await expect(json).not.toContainText("apikey");
  });

  test("keeps the brief labelled as deterministic without a provider", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);

    await expect(page.getByText("Deterministic brief")).toBeVisible();
    await expect(
      page.getByText(/No model provider is configured/),
    ).toBeVisible();
  });

  test("shows a component breakdown for every score that renders", async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_URL}&inspect=${ACTOR}`);

    await expect(
      page.getByRole("heading", { name: "Direction", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Confidence", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Coordination risk", exact: true }),
    ).toBeVisible();
  });

  test("explains that refresh is unavailable for a fixture", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);

    await expect(
      page.getByText(/Refresh is unavailable in fixture mode/),
    ).toBeVisible();
  });

  test("offers a theme control that changes the document theme", async ({
    page,
  }) => {
    await page.goto(FIXTURE_URL);
    await page.getByRole("button", { name: "Dark" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("reports the data mode in the global navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Fixture data")).toBeVisible();
  });
});

test.describe("security headers", () => {
  test("serves a content security policy that keeps requests on this origin", async ({
    page,
  }) => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";

    // connect-src 'self' is what enforces the rule that the browser never
    // calls Nansen or a model provider directly (02-product-rules 6.5).
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test("serves the remaining security headers", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("renders every route without a policy violation", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) {
        violations.push(message.text());
      }
    });

    await page.goto("/");
    await page.goto("/investigate");
    await page.goto("/methodology");
    await page.goto(FIXTURE_URL);

    expect(violations).toStrictEqual([]);
  });
});

test.describe("system states", () => {
  test("a mistyped address lands on not found, not on an invented result", async ({
    page,
  }) => {
    await page.goto("/investigate/ethereum/0xnot-a-real-address?timeframe=1d");

    await expect(
      page.getByText(/Nothing was requested from Nansen/),
    ).toBeVisible();
    // The route streams, so this is a soft 404: the status stays 200 and the
    // injected noindex keeps it out of search results (decision D-036).
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      "noindex",
    );
  });

  test("an unsupported chain lands on not found", async ({ page }) => {
    await page.goto(
      "/investigate/dogecoin/0x514910771af9ca656af840dff83e8264ecf986ca",
    );

    await expect(page.getByText("That page does not exist")).toBeVisible();
  });

  test("a URL matching no route at all returns a real 404", async ({
    page,
  }) => {
    const response = await page.goto("/no-such-page");

    expect(response?.status()).toBe(404);
  });

  test("shows a skeleton that names the task and states no values", async ({
    page,
  }) => {
    // Hold the document response so the streamed shell is observable. Without
    // this the shell is replaced too quickly to assert on.
    await page.route("**/investigate/ethereum/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.goto(FIXTURE_URL, { waitUntil: "commit" });

    const status = page.getByRole("status");
    await expect(status).toContainText("Requesting token context");

    // A skeleton must never imply a value it does not have.
    const skeletonText = await page.locator(".skeleton").allTextContents();
    expect(skeletonText.join("")).not.toMatch(/d/);
  });

  test("replaces the skeleton once evidence has rendered", async ({ page }) => {
    await page.goto(FIXTURE_URL);
    await expect(
      page.getByRole("heading", { name: "Signal lens" }),
    ).toBeVisible();

    await expect(page.locator(".skeleton")).toHaveCount(0);
  });
});
