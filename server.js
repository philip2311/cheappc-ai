require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const catalog = [
  { type: "CPU", name: "AMD Ryzen 5 5600", price: 95, socket: "AM4", notes: "6 cores; sample listing" },
  { type: "CPU", name: "AMD Ryzen 5 7600", price: 175, socket: "AM5", notes: "6 cores; sample listing" },
  { type: "CPU", name: "Intel Core i5-12400F", price: 115, socket: "LGA1700", notes: "6 cores; sample listing" },
  { type: "GPU", name: "Radeon RX 6600 8GB", price: 190, notes: "sample listing" },
  { type: "GPU", name: "Radeon RX 7600 8GB", price: 255, notes: "sample listing" },
  { type: "GPU", name: "GeForce RTX 4060 8GB", price: 285, notes: "sample listing" },
  { type: "Motherboard", name: "B550 mATX motherboard", price: 75, socket: "AM4", notes: "sample listing" },
  { type: "Motherboard", name: "B650 mATX motherboard", price: 115, socket: "AM5", notes: "sample listing" },
  { type: "Motherboard", name: "B660/B760 DDR4 motherboard", price: 95, socket: "LGA1700", notes: "sample listing; verify exact CPU support" },
  { type: "RAM", name: "16GB (2x8GB) DDR4-3200", price: 35, memory: "DDR4", notes: "sample listing" },
  { type: "RAM", name: "32GB (2x16GB) DDR4-3200", price: 58, memory: "DDR4", notes: "sample listing" },
  { type: "RAM", name: "32GB (2x16GB) DDR5-6000", price: 85, memory: "DDR5", notes: "sample listing" },
  { type: "Storage", name: "1TB NVMe SSD", price: 55, notes: "sample listing" },
  { type: "PSU", name: "650W 80+ Bronze PSU", price: 65, watts: 650, notes: "sample listing; check independent PSU reviews" },
  { type: "Case", name: "Airflow mATX case", price: 55, notes: "sample listing; check GPU clearance" },
  { type: "Cooler", name: "Stock/included CPU cooler", price: 0, notes: "where included with CPU" }
];

function fallbackBuild({ budget, mode, use }) {
  const options = mode === "cheapest"
    ? [
        ["AMD Ryzen 5 5600", "Radeon RX 6600 8GB", "B550 mATX motherboard", "16GB (2x8GB) DDR4-3200", "1TB NVMe SSD", "650W 80+ Bronze PSU", "Airflow mATX case", "Stock/included CPU cooler"],
        ["Intel Core i5-12400F", "Radeon RX 6600 8GB", "B660/B760 DDR4 motherboard", "16GB (2x8GB) DDR4-3200", "1TB NVMe SSD", "650W 80+ Bronze PSU", "Airflow mATX case", "Stock/included CPU cooler"]
      ]
    : [
        ["AMD Ryzen 5 7600", "Radeon RX 7600 8GB", "B650 mATX motherboard", "32GB (2x16GB) DDR5-6000", "1TB NVMe SSD", "650W 80+ Bronze PSU", "Airflow mATX case", "Stock/included CPU cooler"],
        ["AMD Ryzen 5 5600", "GeForce RTX 4060 8GB", "B550 mATX motherboard", "32GB (2x16GB) DDR4-3200", "1TB NVMe SSD", "650W 80+ Bronze PSU", "Airflow mATX case", "Stock/included CPU cooler"]
      ];
  const byName = Object.fromEntries(catalog.map(p => [p.name, p]));
  let chosen = options.map(names => names.map(n => byName[n]));
  chosen = chosen.filter(parts => parts.reduce((s,p)=>s+p.price,0) <= budget);
  let parts = chosen[0] || options[0].map(n => byName[n]);
  const total = parts.reduce((s,p)=>s+p.price,0);
  return {
    title: mode === "cheapest" ? "Lowest-cost compatible starting point" : "Balanced performance-per-euro starting point",
    summary: `A ${use} build assembled from the included demo catalogue. Replace sample prices with verified local retailer prices before buying.`,
    parts: parts.map(p => ({ category: p.type, name: p.name, price: p.price, reason: p.notes })),
    total,
    budget,
    remaining: budget - total,
    compatibility: [
      "CPU and motherboard socket match in this example build.",
      "RAM type must match the motherboard (DDR4 or DDR5).",
      "Confirm case dimensions, GPU length, cooler clearance, and PSU connectors before purchase."
    ],
    warnings: total > budget ? ["This demo catalogue does not contain a complete option under your budget. Increase the budget or connect a live retailer catalogue."] : [
      "All prices in this starter demo are illustrative, not live retailer quotes.",
      "Check the exact motherboard revision, BIOS support, GPU dimensions, PSU quality and local warranty before ordering."
    ]
  };
}

app.post("/api/build", async (req, res) => {
  const budget = Number(req.body.budget);
  const mode = req.body.mode === "cheapest" ? "cheapest" : "value";
  const use = ["gaming", "school/work", "general use"].includes(req.body.use) ? req.body.use : "gaming";
  const currency = ["EUR", "DKK", "GBP", "USD"].includes(req.body.currency) ? req.body.currency : "EUR";

  if (!Number.isFinite(budget) || budget < 250 || budget > 10000) {
    return res.status(400).json({ error: "Enter a budget between 250 and 10,000." });
  }

  const demo = fallbackBuild({ budget, mode, use });
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ ...demo, ai: false, currency, note: "Demo mode: add an OpenAI API key to enable AI-written recommendations. Prices remain sample data until a retailer feed is connected." });
  }

  const prompt = `You are CheapPC AI, a cautious PC component compatibility assistant.
Create a PC parts recommendation using ONLY the catalogue below. Do not invent products or prices.
User budget: ${budget} ${currency}. Mode: ${mode === "cheapest" ? "lowest total cost" : "best performance per unit of money"}. Use: ${use}.
Catalogue (all prices are illustrative sample prices in EUR; do not convert them):
${JSON.stringify(catalog)}
Return valid JSON only with keys: title, summary, parts (array of {category,name,price,reason}), total, compatibility (array of strings), warnings (array of strings).
Use a complete build if possible. Never exceed the user's budget unless no complete build fits, and clearly warn if so.
Do not claim prices are live. Flag any compatibility detail that cannot be confirmed from the catalogue.`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const data = await response.json();
    const output = (data.output || []).flatMap(x => x.content || []).find(x => x.type === "output_text")?.text;
    if (!output) throw new Error("No text returned by AI provider");
    const cleaned = output.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const result = JSON.parse(cleaned);
    res.json({ ...result, budget, currency, ai: true, note: "AI-generated recommendation based on the included sample catalogue. Prices are not live retailer prices." });
  } catch (err) {
    console.error(err.message);
    res.json({ ...demo, ai: false, currency, note: "AI service was unavailable, so a demo recommendation is shown. Prices are sample data, not live." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`CheapPC AI running at http://localhost:${port}`));
