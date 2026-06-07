<script setup>

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  duration: {
    type: Number,
    default: 18,
  },
  variant: {
    type: String,
    default: "soft",
  },
});
</script>

<template>
  <div class="auto-scroll-pills" :style="{ '--scroll-duration': `${duration}s` }">
    <div class="track">
      <div class="group" v-for="groupIndex in 2" :key="groupIndex" :aria-hidden="groupIndex === 2 ? 'true' : 'false'">
        <span v-for="(item, index) in items" :key="`${item}-${index}-${groupIndex}`" class="pill" :class="variant">{{ item }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-scroll-pills {
  overflow: hidden;
  width: 100%;
}

.track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: scroll var(--scroll-duration, 18s) linear infinite;
}

.group {
  display: flex;
  gap: 8px;
  padding-right: 8px;
}

.pill {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 14px;
  font-weight: 650;
  white-space: nowrap;
}

.pill.soft {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
}

.pill.white {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.auto-scroll-pills:hover .track {
  animation-play-state: paused;
}

@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .track {
    animation: none;
    transform: none;
  }
}
</style>
