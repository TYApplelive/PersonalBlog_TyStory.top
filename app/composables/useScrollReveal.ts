/**
 * useScrollReveal — 滚动入场动画 composable
 *
 * 使用 Intersection Observer 监听带有 [data-reveal] 属性的元素，
 * 当它们进入视口时添加 .is-revealed 类触发 CSS 动画。
 */

const SELECTOR = "[data-reveal]";
const REVEALED_CLASS = "is-revealed";

let observer: IntersectionObserver | null = null;
let initialized = false;

export function useScrollReveal(options?: {
  rootMargin?: string;
  threshold?: number;
}) {
  if (initialized) return;

  const rootMargin = options?.rootMargin ?? "0px 0px -40px 0px";
  const threshold = options?.threshold ?? 0.08;

  const handleIntersect = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add(REVEALED_CLASS);
        observer?.unobserve(entry.target);
      }
    }
  };

  observer = new IntersectionObserver(handleIntersect, {
    rootMargin,
    threshold,
  });

  const observe = () => {
    const elements = document.querySelectorAll(SELECTOR);
    for (const el of elements) {
      observer!.observe(el);
    }
  };

  // 初始观察已有元素
  observe();

  // 监听 DOM 变化（Nuxt 页面切换可能导致重新渲染）
  const mutationObserver = new MutationObserver(() => {
    observe();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  initialized = true;
}
