"use client";

import { useEffect, useState } from "react";

type MethodologySection = {
  readonly id: string;
  readonly label: string;
};

type MethodologyIndexProps = {
  sections: readonly MethodologySection[];
};

function getReadingLine() {
  const styles = getComputedStyle(document.documentElement);
  const stickyOffset = Number.parseFloat(
    styles.getPropertyValue("--sticky-offset"),
  );

  return (Number.isFinite(stickyOffset) ? stickyOffset : 0) + 80;
}

export function MethodologyIndex({ sections }: MethodologyIndexProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const readingLine = getReadingLine();
      let nextActiveId = sections[0]?.id ?? "";

      for (const section of sections) {
        const heading = document.getElementById(section.id);

        if (heading && heading.getBoundingClientRect().top <= readingLine) {
          nextActiveId = section.id;
        }
      }

      const reachedPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (reachedPageEnd) {
        nextActiveId = sections.at(-1)?.id ?? nextActiveId;
      }

      setActiveId(nextActiveId);
    };

    const scheduleUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, [sections]);

  return (
    <nav className="doc-index" aria-label="On this page">
      <span className="doc-index-title">On this page</span>
      <ul className="doc-index-list">
        {sections.map((section) => {
          const isActive = activeId === section.id;

          return (
            <li key={section.id}>
              <a
                className={isActive ? "is-active" : undefined}
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
