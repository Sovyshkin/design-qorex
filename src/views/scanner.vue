<script setup>
import AppScanner from '@/components/AppScanner.vue';
</script>
<template>
  <div class="scanner-page">
    <AppScanner />
  </div>
</template>
<style scoped>
.scanner-page {
  min-height: 100vh;
  padding-bottom: 110px;
  background: radial-gradient(920px 420px at 50% -20%, #dbeafe 0%, #f1f5f9 48%, #f1f5f9 100%);
}

.scanner-page :deep(.qr-scanner-fullscreen),
.scanner-page :deep(.app-scanner-container) {
  background: transparent !important;
}

.scanner-page :deep(.scanner-frame),
.scanner-page :deep(.scan-container),
.scanner-page :deep(.camera-container) {
  border-radius: 24px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
  overflow: hidden;
}

.scanner-page :deep(.action-btn),
.scanner-page :deep(.primary-btn),
.scanner-page :deep(.confirm-btn) {
  background: linear-gradient(135deg, #2563eb, #1e40af) !important;
  color: #fff !important;
  border-radius: 16px !important;
}
</style>
