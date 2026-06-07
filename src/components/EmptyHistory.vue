<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <main class="empty">
    <div class="empty-card">
      <h2>{{ t('history_tranc') }}</h2>
      <p>{{ t('history_text') }}</p>
      <button class="btn-primary" @click="$router.push({ name: 'deposit' })">
        {{ t('deposit_wallet') }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.empty {
  min-height: 55vh;
  display: grid;
  place-items: center;
}

.empty-card {
  width: 100%;
  max-width: 340px;
  padding: 24px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  text-align: center;
}

h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
  font-weight: 600;
}

p {
  margin: 10px 0 20px;
  color: #64748b;
  font-size: 14px;
}

.btn-primary {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1e40af);
}
</style>
