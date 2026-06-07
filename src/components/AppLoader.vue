<template>
  <div class="loader-wrap" role="status" aria-live="polite" aria-label="Loading">
    <span class="loader"></span>
  </div>
</template>

<style scoped>
.loader-wrap {
  width: 100%;
  min-height: 220px;
  display: grid;
  place-items: center;
}

.loader {
  width: 42px;
  height: 42px;
  border: 3px solid #bfdbfe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
