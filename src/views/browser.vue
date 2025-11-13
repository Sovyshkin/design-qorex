<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
<template>
    <div class="container">
        <img src="../assets/cat-loader.svg" alt="">
        {{ t('in_development') }}...
    </div>
</template>
<style scoped>
.container {
    min-height: calc(100vh - 70px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    font-size: 20px;
    font-weight: 600s;
    padding: 10px 10px 90px 10px;
    overflow-y: auto;
}
</style>