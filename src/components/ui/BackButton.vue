<script setup>
defineEmits(["click"]);
</script>

<template>
  <button class="back-button" type="button" aria-label="Back" @click="$emit('click')">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" />
    </svg>
  </button>
</template>

<style scoped>
.back-button {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 18px;
  border: 1px solid var(--border, #e2e8f0);
  background: var(--surface, #ffffff);
  color: var(--textPrimary, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.back-button svg {
  width: 28px;
  height: 28px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: translateX(-2px);
}

:global(.dark-theme) .back-button {
  background: var(--surface, #1e273b);
  border-color: var(--border, rgba(255, 255, 255, 0.08));
  color: #ffffff !important;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
}

:global(.dark-theme) .back-button svg,
:global(.dark-theme) .back-button path {
  stroke: #ffffff !important;
  color: #ffffff !important;
}

</style>
