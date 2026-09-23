import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Assertions that wait on hydration get longer than the five-second default.
 *
 * The report ships about 237KB of HTML — forty evidence rows carrying their
 * normalized records, a seven-day table and a peer table — and the suite runs
 * four browsers against one server. Nothing is wrong when React takes more
 * than five seconds to attach under that load, but a control that answers
 * scroll cannot answer before it does.
 */
const HYDRATION_TIMEOUT = 20_000;

/**
 * Scrolls to the true bottom, not to where the bottom was.
 *
 * A page grows as it hydrates, so a single scroll issued early is clamped to
 * whatever height the document had at that instant — on the report it reached
 * 722px of an eventual 12,000 — and everything below is never visited. The
 * scroll repeats until the position stops moving.
 */
async function scrollToBottom(page: Page): Promise<number> {
  let previous = -1;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const position = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return Math.round(window.scrollY);
    });
    if (position === previous) return position;
    previous = position;
    await page.waitForTimeout(150);
  }
  return previous;
}

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

    /*
     * The invariant, not the number. Confidence carries a freshness component,
     * so the fixture's score falls as the capture ages: it read 43 the day it
     * was taken and 46 the day it was retaken. Pinning the label would make
     * this test fail with the calendar rather than with the code. What must
     * hold is that all three scores render with a label, from the same code a
     * live run uses.
     */
    await expect(readout.getByText("mixed", { exact: true })).toBeVisible();
    await expect(readout.locator(".lens-row-value")).toHaveCount(3);
    await expect(readout.locator(".lens-row-label")).toHaveCount(3);
    await expect(
      readout.getByText(/confidence$/, { exact: false }).first(),
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

    // A stable selector: the accessible name changes with the theme, so a
    // locator bound to that text would go stale after the first click.
    const toggle = page.locator(".theme-toggle");
    await expect(toggle).toHaveAccessibleName(
      "Colour theme: Light. Switch to Dark.",
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).colorScheme,
        ),
      )
      .toBe("light");

    await toggle.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAccessibleName(
      "Colour theme: Dark. Switch to Light.",
    );

    // Toggling back and forth must not get stuck (D-085: startViewTransition's
    // update callback runs as a microtask, so the store-change event used to
    // fire a beat before the attribute actually changed).
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
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

  test("keeps unsafe-eval out of the production policy", async ({ page }) => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";

    // React's development build needs eval and gets it from next.config in
    // development only. A production build must never carry the allowance.
    expect(csp).not.toContain("unsafe-eval");
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
    request,
  }) => {
    /*
     * Asserted against the streamed HTML rather than against the browser.
     *
     * Next puts the loading shell in the initial stream, so it is there to be
     * read with certainty. Watching for it in a page was a race that this
     * project kept losing: the document route was delayed, which only worked
     * while the server was slow, and memoizing the fixture parse made the
     * report render almost immediately. The assertion then matched every
     * other role="status" on the finished page — forty-seven of them.
     */
    const response = await request.get(FIXTURE_URL);
    const html = await response.text();

    // It names the task rather than showing an empty frame.
    expect(html).toContain("Requesting token context");

    // A skeleton must never imply a value it does not have.
    const skeletons = [
      ...html.matchAll(/<span class="skeleton[^"]*"[^>]*>([^<]*)/g),
    ].map((match) => match[1] ?? "");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(skeletons.join("")).not.toMatch(/[0-9]/);
  });

  test("replaces the skeleton once evidence has rendered", async ({ page }) => {
    await page.goto(FIXTURE_URL);
    await expect(
      page.getByRole("heading", { name: "Signal lens" }),
    ).toBeVisible();

    await expect(page.locator(".skeleton")).toHaveCount(0);
  });
});

/*
 * --sticky-offset tells anchored content and the scope ribbon how much sticky
 * chrome to clear. Its value is the bar's measured height. The bar is one row
 * at every width, but that only holds while the overflow menu takes the
 * destinations the row cannot fit, so the token is still asserted against the
 * rendered bar rather than trusted. Clicking a methodology index link used to
 * put the heading entirely behind the bar.
 */
test.describe("sticky offset matches the rendered bar", () => {
  for (const width of [320, 333, 389, 390, 737, 738, 1024, 1440]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/methodology");
      await page.waitForFunction(() => document.fonts.status === "loaded");

      const bar = page.locator(".command-bar-wrap");
      const barBox = await bar.boundingBox();
      const declared = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--sticky-offset")
          .trim(),
      );
      expect(declared).toBe(`${Math.round(barBox?.height ?? 0)}px`);

      // Every index link must leave its heading clear of the bar.
      const links = page.locator("a[href^='#']");
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      for (let index = 0; index < count; index += 1) {
        const target = await links.nth(index).getAttribute("href");
        expect(target).not.toBeNull();
        await links.nth(index).click();

        const heading = page.locator(target ?? "#none");
        const headingBox = await heading.boundingBox();
        const currentBar = await bar.boundingBox();
        expect(
          headingBox?.y ?? -1,
          `${target ?? ""} is hidden behind the command bar`,
        ).toBeGreaterThanOrEqual(
          (currentBar?.y ?? 0) + (currentBar?.height ?? 0),
        );
      }
    });
  }
});

/*
 * The command bar is one row at every width because the overflow menu takes
 * the destinations the row cannot hold, not because the destinations were
 * dropped. Measured: with every link inline the bar needs 738px, so the two
 * presentations hand off there.
 */
test.describe("command bar destinations", () => {
  const DESTINATIONS = ["Investigate", "Methodology", "Source"];

  test("shows every destination inline at 738px", async ({ page }) => {
    await page.setViewportSize({ width: 738, height: 900 });
    await page.goto("/methodology");
    await page.waitForFunction(() => document.fonts.status === "loaded");

    await expect(page.getByRole("button", { name: "More" })).toBeHidden();
    for (const label of DESTINATIONS) {
      await expect(
        page.locator(".command-bar-links").getByText(label),
      ).toBeVisible();
    }
  });

  test("moves every destination into the menu at 737px", async ({ page }) => {
    await page.setViewportSize({ width: 737, height: 900 });
    await page.goto("/methodology");
    await page.waitForFunction(() => document.fonts.status === "loaded");

    await expect(page.locator(".command-bar-links")).toBeHidden();
    await page.getByRole("button", { name: "More" }).click();
    await expect(page.locator(".nav-menu-panel")).toBeVisible();
    expect(await page.locator(".nav-menu-panel a").allTextContents()).toEqual(
      DESTINATIONS,
    );
  });

  test("closes on Escape and returns focus to the trigger", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/methodology");

    const trigger = page.getByRole("button", { name: "More" });
    await trigger.click();
    await expect(page.locator(".nav-menu-panel")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".nav-menu-panel")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  /*
   * The bar holds fixed-width controls that cannot shrink, so a destination
   * left inline one breakpoint too long pushes the page sideways rather than
   * wrapping. 320px is the documented minimum width.
   */
  for (const width of [320, 333, 389, 390, 737, 738, 1024]) {
    test(`fits one row without horizontal scroll at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/methodology");
      await page.waitForFunction(() => document.fonts.status === "loaded");

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `the page scrolls sideways at ${width}px`).toBe(0);

      const barHeight = await page
        .locator(".command-bar-wrap")
        .boundingBox()
        .then((box) => Math.round(box?.height ?? 0));
      expect(barHeight, `the bar is not one row at ${width}px`).toBe(82);
    });
  }
});

/*
 * Back to top. The hidden state is carried by visibility so the control leaves
 * the tab order on its own; an opacity-only hide would strand a keyboard
 * reader on a button nobody can see.
 */
test.describe("back to top", () => {
  const report =
    "/investigate/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933" +
    "?timeframe=7d&mode=fixture";

  test("stays out of the way until the top is out of reach", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(report);
    await page.waitForFunction(() => document.fonts.status === "loaded");

    const button = page.getByRole("button", { name: "Back to top" });
    await expect(button).toBeHidden();

    expect(await scrollToBottom(page)).toBeGreaterThan(900);
    await expect(button).toBeVisible({ timeout: HYDRATION_TIMEOUT });

    const box = await button.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("returns to the top and takes focus with it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(report);
    await page.waitForFunction(() => document.fonts.status === "loaded");

    expect(await scrollToBottom(page)).toBeGreaterThan(900);

    // The control answers scroll only once React has subscribed to it, and
    // while hidden it is out of the accessibility tree entirely. Waiting for
    // it to appear is waiting for hydration.
    const button = page.getByRole("button", { name: "Back to top" });
    await expect(button).toBeVisible({ timeout: HYDRATION_TIMEOUT });
    await button.click();

    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBe(0);

    // Focus follows the scroll, so the next Tab continues from the top.
    const focused = await page.evaluate(
      () => document.activeElement?.tagName ?? "",
    );
    expect(focused).toBe("MAIN");
  });

  test("is not reachable by keyboard while hidden", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(report);
    await page.waitForFunction(() => document.fonts.status === "loaded");

    const tookFocus = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".back-to-top");
      el?.focus();
      return document.activeElement === el;
    });
    expect(tookFocus).toBe(false);
  });
});

/*
 * Controls that broke into ragged rows on a narrow phone. Each of these was a
 * layout that fitted at 390px and came apart at 320px, the documented minimum.
 */
test.describe("narrow phone layouts", () => {
  test("the timeframe control keeps its options on one row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/");
    await page.waitForFunction(() => document.fonts.status === "loaded");

    // The control is a shadcn toggle group now; the invariant is unchanged.
    const rows = await page.evaluate(() => {
      const items = [
        ...document.querySelectorAll("[data-slot='toggle-group-item']"),
      ];
      if (items.length === 0) return -1;
      return new Set(
        items.map((item) => Math.round(item.getBoundingClientRect().top)),
      ).size;
    });
    expect(rows).toBe(1);
  });

  test("every actor row breaks the same way", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(
      "/investigate/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933" +
        "?timeframe=7d&mode=fixture",
    );
    await page.waitForFunction(() => document.fonts.status === "loaded");

    // Rows differ only by whether the actor carries a label, so at most two
    // heights. Before, the copy control wrapped unpredictably instead.
    const heights = await page.evaluate(() => {
      const rows = [...document.querySelectorAll(".actor-row")];
      const withLabel = rows.filter((row) => row.querySelector(".actor-label"));
      const without = rows.filter(
        (row) => row.querySelector(".actor-label") === null,
      );
      const height = (list: Element[]) =>
        new Set(
          list.map((row) => Math.round(row.getBoundingClientRect().height)),
        );
      return {
        labelled: [...height(withLabel)],
        plain: [...height(without)],
      };
    });
    expect(heights.labelled.length).toBeLessThanOrEqual(1);
    expect(heights.plain.length).toBeLessThanOrEqual(1);
  });
});

/*
/*
 * Entrance motion. The dangerous failure is content that never becomes
 * visible, so the checks below matter more than the effect: script may not
 * run, a page may be too short to scroll, and a reader may have asked for
 * reduced motion. In each case the page must simply be readable.
 *
 * The second failure is silent. The reveal targets structural classes from one
 * list in RevealOnView, so renaming a class would stop the animation without
 * breaking anything, which is why every route asserts it still has motion.
 */
test.describe("entrance motion", () => {
  const REPORT =
    "/investigate/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933" +
    "?timeframe=7d&mode=fixture";
  const ROUTES = ["/", "/investigate", "/methodology", REPORT];

  /*
   * Every block the reveal can touch, asserted directly. The previous version
   * counted elements carrying a data attribute, which GSAP does not write —
   * that test would now pass by finding nothing at all.
   */
  const REVEAL_TARGETS = [
    ".section-heading",
    ".step-list > li",
    ".example-stage",
    ".guardrail-block",
    ".investigation-grid > *",
    ".doc-body > section",
    ".doc-actions",
    ".hero-copy",
    ".investigate-header",
    ".scope-ribbon",
  ].join(", ");

  const hiddenCount = (page: Page) =>
    page.evaluate(
      (selector) =>
        [...document.querySelectorAll(selector)].filter(
          (element) => Number(getComputedStyle(element).opacity) < 0.99,
        ).length,
      REVEAL_TARGETS,
    );

  /*
   * A jump rather than a stepped scroll, because that is the harsher case: it
   * carries elements from below the window to above it without their ever
   * intersecting, which is how the End key and a deep anchor behave.
   */
  const jumpToBottom = async (page: Page) => {
    await scrollToBottom(page);
  };

  for (const route of ROUTES) {
    test(`${route} animates and strands nothing`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      await page.waitForFunction(() => document.fonts.status === "loaded");

      // Something must be animatable, or the reveal has silently stopped
      // applying to this route and the checks below would pass vacuously.
      const targets = await page.evaluate(
        (selector) => document.querySelectorAll(selector).length,
        REVEAL_TARGETS,
      );
      expect(targets).toBeGreaterThan(0);
      await jumpToBottom(page);

      await expect
        .poll(() => hiddenCount(page), { timeout: HYDRATION_TIMEOUT })
        .toBe(0);
    });

    test(`${route} strands nothing on a very tall window`, async ({ page }) => {
      // A tall window leaves little scroll to spend, so an element hidden too
      // far down could never come back. The reveal margin is in pixels for
      // this reason: as a percentage it grew past the travel available.
      //
      // The report is not simply "unscrollable" here — its ledger is sized in
      // vh, so the document grows with the window — which is why this scrolls
      // rather than asserting the page cannot move.
      await page.setViewportSize({ width: 1440, height: 6000 });
      await page.goto(route);
      await page.waitForFunction(() => document.fonts.status === "loaded");
      await jumpToBottom(page);
      await expect
        .poll(() => hiddenCount(page), { timeout: HYDRATION_TIMEOUT })
        .toBe(0);
    });
  }

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    for (const route of ROUTES) {
      test(`${route} writes no hidden state at all`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(route);
        await page.waitForFunction(() => document.fonts.status === "loaded");
        // gsap.matchMedia never creates the tween under this preference, so
        // no element is ever given a start state to come back from.
        await jumpToBottom(page);
        await expect
          .poll(() => hiddenCount(page), { timeout: HYDRATION_TIMEOUT })
          .toBe(0);
      });
    }
  });

  test.describe("without script", () => {
    test.use({ javaScriptEnabled: false });

    for (const route of ROUTES) {
      test(`${route} stays readable`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(route);
        // Markup ships visible; only script applies a start state.
        expect(await hiddenCount(page)).toBe(0);
      });
    }
  });
});

/*
 * The theme a reader chose must be on screen from the first frame.
 *
 * The server renders data-theme="light", so without a bootstrap that runs
 * before paint, someone who chose dark watches the page flash white and then
 * turn over. A React effect cannot fix it: an effect runs after the first
 * paint by definition. An inline script at the top of the body can, and this
 * asserts that it does.
 */
test.describe("chosen theme survives the first paint", () => {
  for (const choice of ["dark", "light"] as const) {
    test(`${choice} is applied before anything is drawn`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
      });

      await context.addInitScript((stored) => {
        try {
          localStorage.setItem("proofpulse-theme", stored);
        } catch {
          // A blocked store leaves the default, which is a readable page.
        }
        const samples: string[] = [];
        (window as unknown as { __themeSamples: string[] }).__themeSamples =
          samples;
        const record = () => {
          samples.push(
            document.documentElement.getAttribute("data-theme") ?? "none",
          );
        };
        requestAnimationFrame(record);
        document.addEventListener("DOMContentLoaded", record);
        window.addEventListener("load", record);
      }, choice);

      const page = await context.newPage();
      await page.goto("/", { waitUntil: "load" });

      const samples = await page.evaluate(
        () =>
          (window as unknown as { __themeSamples: string[] }).__themeSamples,
      );
      expect(samples.length).toBeGreaterThan(0);
      // Not one early frame carried anything but the reader's choice.
      expect(samples.every((value) => value === choice)).toBe(true);

      await context.close();
    });
  }
});
