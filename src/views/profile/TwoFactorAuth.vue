<script setup>
import { useRouter } from "vue-router";
import TwoFactorSetupFlow from "@/components/TwoFactorSetupFlow.vue";

const router = useRouter();

const fromRoute = router.currentRoute?.value?.query?.from || "";

const handleBack = () => {
  if (fromRoute === "transfer") {
    router.push({ name: "transfer" });
    return;
  }
  if (fromRoute === "withdraw") {
    router.push({ name: "withdraw" });
    return;
  }
  router.push({ name: "safety" });
};

const handleCompleted = () => {
  if (fromRoute === "transfer") {
    router.push({ name: "transfer" });
    return;
  }
  if (fromRoute === "withdraw") {
    router.push({ name: "withdraw" });
    return;
  }
  router.push({ name: "safety" });
};
</script>

<template>
  <TwoFactorSetupFlow standalone @back="handleBack" @completed="handleCompleted" />
</template>
