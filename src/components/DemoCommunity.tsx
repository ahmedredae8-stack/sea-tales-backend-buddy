import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const examples = [
  { name: "أبو نواف · جدة", body: "يا هلا بالقباطنة! رجعت بالقارب بدري اليوم، البحر يفتح النفس 🌊" },
  { name: "نورة · الخبر", body: "هلا والله! أنا أخلي السفينة تمتلئ وبعدين أرجعها للميناء." },
  { name: "راكان · الدمام", body: "كفو عليكم، نشوفكم عند سوق السمك ⚓" },
];

/** An explicitly simulated room; nothing is inserted into real player records. */
export function DemoCommunity() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(examples);
  return <section className="demo-community" dir="rtl" aria-label="مجتمع تجريبي">
    <header><MessageCircle /><div><h2>مجلس الميناء السعودي</h2><p>مجتمع تجريبي · شخصيات ورسائل تمثيلية، ليست لاعبين حقيقيين</p></div></header>
    <div className="demo-message-list">
      {messages.map((message, index) => <article key={index}><span className="demo-avatar" aria-hidden="true">{message.name.slice(0, 1)}</span><div><strong>{message.name}</strong><p>{message.body}</p></div></article>)}
    </div>
    <form onSubmit={event => { event.preventDefault(); if (!text.trim()) return; setMessages(current => [...current, { name: "أنت · تجربة محلية", body: text.trim() }]); setText(""); }}>
      <input aria-label="رسالة تجريبية" placeholder="رسالتك في المجلس التجريبي…" value={text} maxLength={500} onChange={event => setText(event.target.value)} />
      <Button variant="ghost" size="icon" type="submit" disabled={!text.trim()} aria-label="إرسال رسالة تجريبية"><Send /></Button>
    </form>
  </section>;
}