// api/chat.js
// Backend proxy gọi Anthropic (Claude) API — dùng cho Senpai Connect chat.
//
// CÁCH DÙNG (deploy lên Vercel):
// 1. Đặt file này ở đường dẫn  api/chat.js  tại gốc project.
// 2. Trong Vercel dashboard > Settings > Environment Variables, thêm:
//      ANTHROPIC_API_KEY = sk-ant-xxxxxxxx   (lấy tại console.anthropic.com)
// 3. Deploy. Frontend sẽ gọi POST /api/chat (đường dẫn tương đối, tự động đúng domain).
//
// LƯU Ý: KHÔNG bao giờ đặt ANTHROPIC_API_KEY trong script.js hay bất kỳ file
// nào chạy ở trình duyệt — key sẽ bị lộ ngay lập tức cho bất kỳ ai xem source.

const LANG_NAMES = {
  vi: "Vietnamese", ja: "Japanese", en: "English", ko: "Korean", zh: "Chinese",
  id: "Indonesian", th: "Thai", tl: "Filipino", es: "Spanish", fr: "French",
  ne: "Nepali", my: "Burmese",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, lang, persona, history } = req.body || {};

  if (!message || typeof message !== "string" || !persona) {
    return res.status(400).json({ error: "Thiếu message hoặc persona" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server chưa cấu hình ANTHROPIC_API_KEY" });
  }

  const langName = LANG_NAMES[lang] || "Vietnamese";

  const systemPrompt = `Bạn đang đóng vai "${persona.senpaiName}", hiện làm ${persona.senpaiRole} tại ${persona.companyName} (Nhật Bản). Bạn là một "senpai" (người đi trước) đang tư vấn cho một du học sinh Việt Nam chuẩn bị xin việc tại Nhật.

THÔNG TIN NỀN bạn có thể dùng khi liên quan (không cần nhắc hết mỗi lần):
${persona.context}

QUY TẮC TRẢ LỜI:
- Trả lời bằng ngôn ngữ: ${langName}.
- Giọng văn thân thiện, tự nhiên như tin nhắn chat, xưng "mình", gọi người hỏi là "bạn" (nếu ngôn ngữ trả lời không phải tiếng Việt thì dùng đại từ tương đương tự nhiên trong ngôn ngữ đó).
- Ngắn gọn: khoảng 2-5 câu, không dùng markdown/heading, chỉ liệt gạch đầu dòng khi thực sự cần.
- Nếu câu hỏi lệch khỏi chủ đề xin việc/du học/cuộc sống ở Nhật, trả lời lịch sự rồi khéo léo hướng về chủ đề bạn có thể giúp.
- Không bịa số liệu, tên người, sự kiện cụ thể ngoài phần THÔNG TIN NỀN — nếu không chắc, nói rõ đó là ước tính/kinh nghiệm cá nhân, không phải số liệu chính thức.`;

  const messages = [
    ...(Array.isArray(history) ? history.slice(-10) : []),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await response.json();
    const reply = (data.content || []).find((b) => b.type === "text")?.text || "...";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[api/chat] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
