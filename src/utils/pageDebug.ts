export const getElementSnapshot = (selector: string) => {
  if (typeof document === "undefined") {
    return { selector, found: false, reason: "document-unavailable" };
  }

  const el = document.querySelector(selector) as HTMLElement | null;

  if (!el) {
    return { selector, found: false };
  }

  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  return {
    selector,
    found: true,
    tag: el.tagName,
    className: el.className,
    childCount: el.childElementCount,
    textLength: (el.textContent || "").trim().length,
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    style: {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      position: style.position,
      zIndex: style.zIndex,
      overflow: style.overflow,
      background: style.background,
      backgroundColor: style.backgroundColor,
      color: style.color,
    },
  };
};

export const logThemeSnapshot = (tag: string, extra: Record<string, unknown> = {}) => {
  if (typeof document === "undefined") {
    console.log(`[PeekPay Debug ${tag}]`, {
      bodyAvailable: false,
      ...extra,
    });
    return;
  }

  console.log(`[PeekPay Debug ${tag}]`, {
    bodyClass: document.body.className,
    htmlClass: document.documentElement.className,
    hasDarkThemeClass: document.body.classList.contains("dark-theme"),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    navbar: getElementSnapshot(".wallet-nav"),
    wrapper: getElementSnapshot(".wrapper"),
    contentWrapper: getElementSnapshot(".content-wrapper"),
    ...extra,
  });
};
