<script setup>
import { useWalletStore } from "@/stores/walletStore";
const walletStore = useWalletStore();
import { useI18n } from "vue-i18n";
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const { t } = useI18n();
const router = useRouter()

const goRoute = (name) => {
  router.push({ name })
}

onMounted(async () => {
  try {
    await walletStore.getUser()
    await walletStore.getPrice()
  } catch (err) {

    
  }
})
</script>
<template>
  <transition name="main-page-appear" appear>
    <div class="wrapper">
      <transition name="header-appear" appear>
        <header>
          <div class="user">
            <div class="wrap-avatar">
              <img :src="walletStore.userTg.photo_url" alt="" />
            </div>
            <span class="name">{{ walletStore.user.first_name }}</span>
          </div>
        </header>
      </transition>
      <transition name="container-appear" appear>
        <main class="container">
          <transition name="balance-appear" appear>
            <div class="wrap-balance">
              <div class="balance" @click="walletStore.setHideBalanceActive(!walletStore.hideBalanceActive)">
                <div class="wrap-text">
                  <span>{{ t("total_balance") }}</span>
                  <img
                    src="../assets/hide.png"
                    v-if="walletStore.hideBalanceActive"
                    alt="hide_balance"
                  />
                  <img src="../assets/open.png" v-else alt="open_balance" />
                </div>
                <h2 class="balance-rub" v-if="!walletStore.hideBalanceActive">{{ walletStore.roundToHundredths(walletStore.balance_rub) }} ₽</h2>
                <h2 class="balance-rub" v-else>********</h2>
              </div>
            <transition name="actions-appear" appear>
              <div class="actions">
                <transition name="button-appear-1" appear>
                  <button class="btn deposit" @click="goRoute('deposit')">
                    <div class="btn-icon">
                      <img src="../assets/deposit.svg" alt="deposit" />
                    </div>
                    <span>{{ t("deposit") }}</span>
                  </button>
                </transition>
                <transition name="button-appear-2" appear>
                  <button class="btn transfer" @click="goRoute('transfer')">
                    <div class="btn-icon">
                      <img src="../assets/send.png" alt="transfer" />
                    </div>
                    <span>{{ t("transfer") }}</span>
                  </button>
                </transition>
                <transition name="button-appear-3" appear>
                  <button class="btn pay_out" @click="goRoute('withdraw')">
                    <div class="btn-icon">
                      <img src="../assets/pay_out.svg" alt="withdraw" />
                    </div>
                    <span>{{ t("pay_out") }}</span>
                  </button>
                </transition>
              </div>
            </transition>
          </div>
        </transition>
        <transition name="coins-appear" appear>
          <div class="coins">
            <transition name="coins-title-appear" appear>
              <h3>{{ t('actives') }}</h3>
            </transition>
            <transition name="coin-card-appear" appear>
              <div class="coin">
                <div class="coin-info">
                  <img
                    src="data:image/svg+xml,<svg%20width='40'%20height='40'%20viewBox='0%200%2040%2040'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'><rect%20width='40'%20height='40'%20rx='20'%20fill='%232AAF86'/><path%20d='M22.0302%2021.7391V21.7365C21.9162%2021.7444%2021.3279%2021.7789%2020.0186%2021.7789C18.9716%2021.7789%2018.2375%2021.7497%2017.9777%2021.7365V21.7391C13.9518%2021.5616%2010.9488%2020.8618%2010.9488%2020.0217C10.9488%2019.1841%2013.9544%2018.4818%2017.9777%2018.3042V21.0421C18.2401%2021.0606%2018.9955%2021.1057%2020.0371%2021.1057C21.2881%2021.1057%2021.9136%2021.0527%2022.0302%2021.0421V18.3068C26.0482%2018.4871%2029.0432%2019.1868%2029.0432%2020.0243C29.0432%2020.8618%2026.0456%2021.5616%2022.0302%2021.7418M22.0302%2018.0233V15.5743H27.6358V11.8398H12.3748V15.5743H17.9804V18.0233C13.4243%2018.2326%2010%2019.1338%2010%2020.2151C10%2021.2965%2013.427%2022.1977%2017.9804%2022.4097V30.2602H22.0329V22.4097C26.581%2022.2003%2030%2021.2992%2030%2020.2178C30%2019.1391%2026.581%2018.2353%2022.0329%2018.0259'%20fill='white'/></svg>"
                    alt=""
                  />
                  <div class="coin-currency">
                      <span class="coin-name">USDT</span>
                      <span class="currency-rate">{{ walletStore.roundToHundredths(walletStore.usdt_price) }} ₽</span>
                  </div>
                </div>
                <div class="coin-activity">
                  <span class="coin-balance" v-if="!walletStore.hideBalanceActive">{{ walletStore.roundToHundredths(walletStore.balance_rub) }} ₽</span>
                  <span class="coin-balance" v-else>********</span>
                  <span class="coin-balance-name" v-if="!walletStore.hideBalanceActive">{{ walletStore.roundToHundredths(walletStore.balance) }} USDT</span>
                  <span class="coin-balance-name" v-else>********</span>
                </div>
              </div>
            </transition>
          </div>
        </transition>
        </main>
      </transition>
    </div>
  </transition>
</template>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  background-color: #f5f5f5;
  padding: 15px 20px 120px 20px;
  overflow-y: auto;
  font-weight: 500;
}

header {
  height: 10vh;
  padding: 15px 20px;
}

.user {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.wrap-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrap-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  color: #141414;
}

.wrap-balance {
  display: flex;
  flex-direction: column;
  background-color: #141414;
  background-image: url('../assets/bg.svg');
  background-position: center;
  background-repeat: no-repeat;
  padding: 24px;
  gap: 24px;
  justify-content: space-between;
  border-radius: 16px;
}

.balance {
  display: flex;
  flex-direction: column;
  gap: 15px;
    cursor: pointer;
}

.wrap-text {
  display: flex;
  align-items: center;
  gap: 7px;
  opacity: 0.4;
}

.wrap-text span {
  color: #fff;
  font-weight: 300;
  font-size: 14px;
}

.wrap-text img {
  height: 16px;
  width: 16px;
}

h2 {
  font-size: 34px;
  font-weight: 300;
  color: #fff;
}

h3 {
  font-weight: 300;
  font-size: 20px;
}

.actions {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 10px 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.05);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn:active::before {
  opacity: 1;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: transform 0.3s ease;
}

.btn:active .btn-icon {
  transform: scale(0.9);
}

.btn img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.btn span {
  font-weight: 500;
  font-size: 11px;
  color: #141414;
  letter-spacing: 0.2px;
  text-transform: capitalize;
}

.deposit {
  background-color: #DEEC51;
  box-shadow: 0 2px 8px rgba(222, 236, 81, 0.3);
}

.deposit .btn-icon {
  background-color: rgba(20, 20, 20, 0.1);
}

.deposit:active {
  box-shadow: 0 1px 4px rgba(222, 236, 81, 0.2);
}

.transfer {
  background-color: #fff;
  border: 1.5px solid #e0e0e0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.transfer .btn-icon {
  background-color: #f5f5f5;
}

.transfer:active {
  border-color: #d0d0d0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.pay_out {
  background-color: #262626;
  box-shadow: 0 2px 8px rgba(38, 38, 38, 0.3);
}

.pay_out .btn-icon {
  background-color: rgba(255, 255, 255, 0.15);
}

.pay_out span {
  color: #fff;
}

.pay_out:active {
  box-shadow: 0 1px 4px rgba(38, 38, 38, 0.2);
}

.coins {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coin {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding: 16px;
  border-radius: 16px;
}

.coin-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.coin-currency, .coin-activity {
    display: flex;
    flex-direction: column;
}

.coin-name, .currency-rate {
  text-align: left;
}

.currency-rate, .coin-balance-name {
    color: #4F4F4F;
    font-size: 14px;
    letter-spacing: .15px;
    line-height: 18px;
    font-weight: 300;
}

.coin-balance-name {
  text-align: end;
}

.coin-balance {
    text-align: end;
}

/* Главная анимация страницы */
.main-page-appear-enter-active {
  transition: all 1.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.main-page-appear-enter-from {
  opacity: 0;
  transform: translateY(100px) scale(0.8);
}

/* Поэтапные анимации блоков */
.header-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.1s;
}
.header-appear-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}

.container-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.2s;
}
.container-appear-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.balance-appear-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.3s;
}
.balance-appear-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(40px);
}

.actions-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.5s;
}
.actions-appear-enter-from {
  opacity: 0;
  transform: translateY(50px);
}

.button-appear-1-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.6s;
}
.button-appear-1-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.button-appear-2-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.65s;
}
.button-appear-2-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.button-appear-3-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.7s;
}
.button-appear-3-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
}

.coins-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.8s;
}
.coins-appear-enter-from {
  opacity: 0;
  transform: translateY(40px);
}

.coins-title-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.85s;
}
.coins-title-appear-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.coin-card-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.9s;
}
.coin-card-appear-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}
</style>
