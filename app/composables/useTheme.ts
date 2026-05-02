/**
 * 使用主题切换
 * 支持浅色/深色模式切换,状态持久化到 localStorage
 */

export type ThemeMode = 'light' | 'dark';

export function useTheme() {
  const theme = ref<ThemeMode>('dark');

  // 从 localStorage 读取主题偏好
  onMounted(() => {
    const savedTheme = localStorage.getItem('editor-theme') as ThemeMode;
    if (savedTheme) {
      theme.value = savedTheme;
    }
    applyTheme(theme.value);
  });

  function setTheme(newTheme: ThemeMode) {
    theme.value = newTheme;
    localStorage.setItem('editor-theme', newTheme);
    applyTheme(newTheme);
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  function applyTheme(mode: ThemeMode) {
    const root = document.documentElement;
    if (mode === 'light') {
      root.style.setProperty('--editor-bg', '#ffffff');
      root.style.setProperty('--editor-bg-soft', '#f8f6f1');
      root.style.setProperty('--editor-text', '#2c2c2c');
      root.style.setProperty('--editor-text-soft', '#5a5a5a');
      root.style.setProperty('--editor-gold', '#b78c4d');
      root.style.setProperty('--editor-gold-soft', '#c9a05f');
      root.style.setProperty('--editor-border', 'rgba(183, 140, 77, 0.2)');
      root.style.setProperty('--editor-border-light', 'rgba(183, 140, 77, 0.1)');
      root.style.setProperty('--editor-toolbar-bg', '#f0ece4');
      root.style.setProperty('--editor-panel-bg', '#faf8f3');
      root.style.setProperty('--editor-input-bg', '#ffffff');
      root.style.setProperty('--editor-code-bg', 'rgba(183, 140, 77, 0.1)');
      root.style.setProperty('--editor-pre-bg', '#f5f2eb');
    } else {
      root.style.setProperty('--editor-bg', '#1a1512');
      root.style.setProperty('--editor-bg-soft', '#1e1916');
      root.style.setProperty('--editor-text', '#e0d8c8');
      root.style.setProperty('--editor-text-soft', '#ccc2b0');
      root.style.setProperty('--editor-gold', '#b78c4d');
      root.style.setProperty('--editor-gold-soft', '#d4b87a');
      root.style.setProperty('--editor-border', 'rgba(183, 140, 77, 0.2)');
      root.style.setProperty('--editor-border-light', 'rgba(183, 140, 77, 0.1)');
      root.style.setProperty('--editor-toolbar-bg', 'rgba(242, 221, 175, 0.05)');
      root.style.setProperty('--editor-panel-bg', 'rgba(242, 221, 175, 0.02)');
      root.style.setProperty('--editor-input-bg', 'rgba(20, 12, 9, 0.4)');
      root.style.setProperty('--editor-code-bg', 'rgba(183, 140, 77, 0.15)');
      root.style.setProperty('--editor-pre-bg', 'rgba(20, 12, 9, 0.5)');
    }
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
