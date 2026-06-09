<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWalletStore } from '@/stores/walletStore';

const { t } = useI18n();
const walletStore = useWalletStore();
const isDarkTheme = computed(() => walletStore.isDarkTheme);

const toggleTheme = () => {
  walletStore.toggleTheme();
};
</script>

<template>
  <div class="theme-toggle">
    <div class="toggle-container">
      <input 
        type="radio" 
        id="light-theme" 
        name="theme" 
        value="light"
        :checked="!isDarkTheme"
        @change="() => !isDarkTheme || toggleTheme()"
      />
      <label for="light-theme" class="theme-option">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <span>{{ t('theme_light_short') }}</span>
      </label>
      
      <input 
        type="radio" 
        id="dark-theme" 
        name="theme" 
        value="dark"
        :checked="isDarkTheme"
        @change="() => isDarkTheme || toggleTheme()"
      />
      <label for="dark-theme" class="theme-option">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <span>{{ t('theme_dark_short') }}</span>
      </label>
      
      <div class="slider" :class="{ 'dark': isDarkTheme }"></div>
    </div>
  </div>
</template>

<style scoped>
.theme-toggle {
  width: 100%;
}

.toggle-container {
  position: relative;
  display: flex;
  background: var(--surface, #f5f5f5);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 16px;
  padding: 4px;
  gap: 4px;
}

input[type="radio"] {
  display: none;
}

.theme-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.theme-option svg {
  width: 18px;
  height: 18px;
  color: var(--textSecondary, #64748b);
  transition: all 0.3s ease;
}

.theme-option span {
  font-size: 14px;
  font-weight: 500;
  color: var(--textSecondary, #64748b);
  transition: all 0.3s ease;
}

input[type="radio"]:checked + .theme-option svg {
  color: var(--textPrimary, #0f172a);
}

input[type="radio"]:checked + .theme-option span {
  color: var(--textPrimary, #0f172a);
}

.slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--card, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.slider.dark {
  transform: translateX(calc(100% + 4px));
}

:global(.dark-theme) .toggle-container {
  background: var(--surface, #1e273b);
  border-color: var(--border, rgba(255, 255, 255, 0.08));
}

:global(.dark-theme) .theme-option svg,
:global(.dark-theme) .theme-option svg * {
  color: var(--textSecondary, #94a3b8) !important;
  stroke: var(--textSecondary, #94a3b8) !important;
  fill: none !important;
}

:global(.dark-theme) .theme-option span {
  color: var(--textSecondary, #94a3b8);
}

:global(.dark-theme) input[type="radio"]:checked + .theme-option svg,
:global(.dark-theme) input[type="radio"]:checked + .theme-option svg * {
  color: var(--textPrimary, #ffffff) !important;
  stroke: var(--textPrimary, #ffffff) !important;
  fill: none !important;
}

:global(.dark-theme) input[type="radio"]:checked + .theme-option span {
  color: var(--textPrimary, #ffffff);
}

:global(.dark-theme) .slider {
  background: rgba(37, 98, 235, 0.16);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
}
</style>
