<template>
  <div class="wrap-load-scanner" role="status" aria-live="polite" aria-label="Loading payment status">
    <div class="loader-orbit" aria-hidden="true">
      <div class="loader-orbit__halo loader-orbit__halo--outer"></div>
      <div class="loader-orbit__halo loader-orbit__halo--middle"></div>
      <div class="loader-orbit__core">
        <div class="loader-orbit__pulse"></div>
        <div class="loader-orbit__icon">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="loader-orbit__beam"></div>
      <div class="loader-orbit__particle loader-orbit__particle--one"></div>
      <div class="loader-orbit__particle loader-orbit__particle--two"></div>
      <div class="loader-orbit__particle loader-orbit__particle--three"></div>
    </div>

    <div class="loader-copy">
      <p class="loader-copy__eyebrow">PeekPay</p>
      <h2 class="loader-copy__title">{{ t('loader_text') }}</h2>
      <p class="loader-copy__text">
        Проверяем входящий платеж и ожидаем подтверждение сети. Обычно это занимает несколько секунд.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped>
.wrap-load-scanner {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 28px;
  padding: 32px 24px;
  background:
    radial-gradient(780px 360px at 50% -10%, rgba(59, 130, 246, 0.22), transparent 60%),
    linear-gradient(180deg, #08111f 0%, #0d1b2a 100%);
  overflow: hidden;
}

.loader-orbit {
  position: relative;
  width: min(58vw, 240px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

.loader-orbit__halo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.loader-orbit__halo--outer {
  animation: orbitSpin 6.5s linear infinite;
}

.loader-orbit__halo--middle {
  inset: 18px;
  border-color: rgba(59, 130, 246, 0.26);
  animation: orbitSpinReverse 4.4s linear infinite;
}

.loader-orbit__core {
  position: relative;
  width: 108px;
  height: 108px;
  border-radius: 32px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #3b82f6 0%, #2563eb 48%, #1e40af 100%);
  box-shadow:
    0 20px 40px rgba(37, 99, 235, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.loader-orbit__pulse {
  position: absolute;
  inset: -16px;
  border-radius: 40px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 72%);
  animation: pulseGlow 2.2s ease-in-out infinite;
}

.loader-orbit__icon {
  position: relative;
  width: 40px;
  height: 40px;
}

.loader-orbit__icon span {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 3px solid #ffffff;
  border-radius: 5px;
  animation: iconBlink 1.4s ease-in-out infinite;
}

.loader-orbit__icon span:nth-child(1) {
  top: 0;
  left: 0;
}

.loader-orbit__icon span:nth-child(2) {
  top: 0;
  right: 0;
  animation-delay: 0.18s;
}

.loader-orbit__icon span:nth-child(3) {
  bottom: 0;
  left: 0;
  animation-delay: 0.36s;
}

.loader-orbit__icon span:nth-child(4) {
  right: 0;
  bottom: 0;
  animation-delay: 0.54s;
}

.loader-orbit__beam {
  position: absolute;
  width: 78%;
  height: 78%;
  border-radius: 50%;
  background: conic-gradient(from 90deg, transparent 0deg 240deg, rgba(96, 165, 250, 0.7) 300deg, transparent 360deg);
  filter: blur(8px);
  animation: orbitSpin 2.8s linear infinite;
  opacity: 0.75;
}

.loader-orbit__particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dbeafe;
  box-shadow: 0 0 16px rgba(219, 234, 254, 0.85);
}

.loader-orbit__particle--one {
  top: 12%;
  right: 18%;
  animation: floatParticle 3s ease-in-out infinite;
}

.loader-orbit__particle--two {
  left: 10%;
  bottom: 22%;
  width: 8px;
  height: 8px;
  animation: floatParticle 3.4s ease-in-out infinite 0.35s;
}

.loader-orbit__particle--three {
  right: 12%;
  bottom: 12%;
  width: 6px;
  height: 6px;
  animation: floatParticle 2.6s ease-in-out infinite 0.7s;
}

.loader-copy {
  width: min(100%, 420px);
  padding: 24px 22px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 20px 44px rgba(2, 6, 23, 0.38);
  text-align: center;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.loader-copy__eyebrow {
  margin: 0 0 10px;
  color: #60a5fa;
  font-size: 12px;
  line-height: 16px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.loader-copy__title {
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  line-height: 30px;
  font-weight: 750;
}

.loader-copy__text {
  margin: 12px 0 0;
  color: #94a3b8;
  font-size: 14px;
  line-height: 21px;
  font-weight: 500;
}

@keyframes orbitSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbitSpinReverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes pulseGlow {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.45;
  }

  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes iconBlink {
  0%,
  100% {
    opacity: 0.9;
    transform: scale(1);
  }

  50% {
    opacity: 0.45;
    transform: scale(0.82);
  }
}

@keyframes floatParticle {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 0.72;
  }

  50% {
    transform: translate3d(0, -8px, 0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .wrap-load-scanner {
    gap: 22px;
    padding: 24px 16px;
  }

  .loader-orbit {
    width: min(66vw, 220px);
  }

  .loader-orbit__core {
    width: 94px;
    height: 94px;
    border-radius: 28px;
  }

  .loader-copy {
    padding: 20px 18px;
    border-radius: 24px;
  }

  .loader-copy__title {
    font-size: 21px;
    line-height: 27px;
  }
}
</style>
