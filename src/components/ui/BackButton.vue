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
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.back-button svg {
  width: 23px;
  height: 23px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: translateX(-1px);
}

.back-button:active {
  transform: scale(0.96);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}
</style>
