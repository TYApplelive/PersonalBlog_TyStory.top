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
  initialized = true;

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

  // 延迟到 hydration 完成后再创建 observer，避免 SSR hydration class mismatch
  onMounted(() => {
    nextTick(() => {
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
      // 只监听 main 区域，避免 document.body + subtree 的巨大开销
      const mainEl = document.querySelector('main');
      if (mainEl) {
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const mutationObserver = new MutationObserver(() => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(observe, 100);
        });

        mutationObserver.observe(mainEl, {
          childList: true,
          subtree: true,
        });
      }
    });
  });
}
