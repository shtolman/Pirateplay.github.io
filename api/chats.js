export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not set on Vercel" });

  try {
    const { message, state, history } = req.body || {};
    if (!message) return res.status(400).json({ error: "message is required" });

    const sys =
      "Ты ИИ-напарник в образовательном бизнес-симуляторе. " +
      "День 1: знакомство, выбор оффлайн/онлайн, затем (для MVP) шиномонтаж в Великобритании и выбор локации. " +
      "Отвечай по-русски, коротко и структурно. Держи UK реализм: аренда, business rates, базовые налоги без перегруза. " +
      "Не уходи от плана: сначала разговор и выбор, затем локация.";

    const input = [
      { role: "system", content: sys },
      { role: "user", content: `STATE: ${JSON.stringify(state || {})}` },
      ...(Array.isArray(history) ? history.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text
      })) : []),
      { role: "user", content: message }
    ];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    return res.status(200).json({ text: data.output_text || "" });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
  }
