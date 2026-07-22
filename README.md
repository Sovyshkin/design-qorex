# qorex-wallet

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Browser Telegram Login

For the browser version, set the bot username used by the Telegram Login Widget:

```sh
VITE_TELEGRAM_BOT_USERNAME=peekpay_bot
```

After login the app exchanges widget data at `/auth/telegram`, stores the returned JWT in `localStorage.access_token`, and sends it as `Authorization: Bearer <token>` on browser API requests. Telegram Mini App requests continue to use `X-Init-Data`.
