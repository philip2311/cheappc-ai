# CheapPC AI

A small full-stack starter website for a public-facing AI PC builder. Users can choose:
- **Cheapest**: prioritize the lowest total cost.
- **Best value**: prioritize performance for the money.

They can also set a budget, currency, and intended use.

## Run locally

1. Install Node.js 18 or newer.
2. Unzip this project and open a terminal in the project folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add your OpenAI API key to `.env` (optional for demo mode).
6. Run `npm start`.
7. Open `http://localhost:3000`.

Without an API key, the website still works in demo mode using the included sample catalogue. With a key, the server asks the OpenAI API to explain and assemble a recommendation from that catalogue. The key stays on the server.

## Important: what is and isn't live yet

- This starter includes a working web UI, server endpoint, two build modes, budget validation, and an AI API integration point.
- The included component catalogue and prices are **illustrative demo data**, not current retailer offers.
- It does **not** yet scrape shops or claim live prices. To launch a trustworthy price-comparison service, connect retailer/affiliate product feeds or approved price APIs for the countries you support, normalize product identifiers, and re-check stock and shipping at checkout.
- Compatibility checks are intentionally cautious. Before buying, verify exact motherboard CPU/BIOS support, RAM type, case clearances, PSU quality/connectors, cooler fit, and retailer return policy.

## Deploy publicly

Deploy this Node app to a host that supports Node.js (for example, Render, Railway, or a VPS):
- Set the start command to `npm start`.
- Add `OPENAI_API_KEY` as a server-side environment variable.
- Do not commit `.env` or expose the API key in browser JavaScript.
- Add a domain and HTTPS through the hosting provider.

## Suggested next production steps

1. Integrate authorized live product feeds for retailers in the target market.
2. Store product data, timestamps, shipping, stock, and seller URLs in a database.
3. Build deterministic compatibility validation (socket, chipset, memory generation, dimensions, PSU headroom).
4. Add user accounts, saved builds, share links, rate limits, monitoring, and privacy/terms pages.
5. Add automated tests and a human-reviewed component catalogue.

## API

`POST /api/build`

Example body:
```json
{
  "budget": 700,
  "currency": "EUR",
  "mode": "value",
  "use": "gaming"
}
```
