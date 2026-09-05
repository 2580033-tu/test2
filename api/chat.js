// api/chat.js — Sử dụng Google Gemini API
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Thiếu nội dung tin nhắn" });
  }

  // Lấy GEMINI_API_KEY từ Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server chưa cài đặt GEMINI_API_KEY" });
  }

  const systemPrompt = `Bạn là một Senpai (người đi trước) kinh nghiệm tại Nhật Bản, đang tư vấn hỗ trợ du học sinh/kỹ sư Việt Nam xin việc và lập nghiệp tại Nhật.
  Hãy trả lời thân thiện, lịch sự, ngắn gọn (khoảng 2-4 câu) và hữu ích.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nCâu hỏi của học sinh: ${message}` }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", response.status, errText);
      return res.status(502).json({ error: "Lỗi phản hồi từ Gemini API" });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Senpai chưa nghĩ ra câu trả lời, bạn hỏi lại nhé!";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[api/chat] Server error:", err);
    return res.status(500).json({ error: "Lỗi kết nối Server" });
  }
}
