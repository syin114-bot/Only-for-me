// Vercel Serverless Function
// 部署路径：把这个文件放在你项目根目录下的 /api/chat.js
// 需要在 Vercel 项目设置里加环境变量：GEMINI_API_KEY = 你的 Gemini API key
//
// 拿免费 key 的地方：https://aistudio.google.com/apikey
// 免费额度够个人轻量使用，具体额度以 Google 官网当前公布为准，自己去确认一下。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt, system } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server missing GEMINI_API_KEY env var' });
    return;
  }

  // 模型名字可能会变，部署前去 https://ai.google.dev/gemini-api/docs/models
  // 核实一下当前可用的模型名称，这里先用一个常见的免费可用模型
  const MODEL = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const errText = await r.text();
      res.status(r.status).json({ error: 'Gemini API error: ' + errText });
      return;
    }

    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '(没有返回内容)';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
