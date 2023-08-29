"use client";
import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

type Message = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type MessagesDisplayProps = {
  messages: Message[];
  isLoading: boolean;
  think: string;
};

type InputSectionProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  sendButton: string;
};

type SupportedLanguages =
  | "en"
  | "fr"
  | "de"
  | "it"
  | "zh"
  | "es"
  | "hi"
  | "ar"
  | "bn"
  | "pt"
  | "ru"
  | "ja"
  | "pa";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendButton, setSendButton] = useState("send");
  const [think, setThink] = useState("thinking");

  const greetings: Record<SupportedLanguages, string> = {
    en: "Yo, this is TouffBot ! How can I help you today ?",
    fr: "Salut, je suis TouffBot ! Comment puis-je vous aider aujourd'hui ?",
    de: "Hallo, ich bin TouffBot ! Wie kann ich Ihnen heute helfen ?",
    it: "Ciao, sono TouffBot ! Come posso aiutarti oggi ?",
    zh: "你好，我是ChatterBot！今天我能帮助你吗 ？",
    es: "¡Hola, soy TouffBot ! ¿En qué puedo ayudarte hoy?",
    hi: "नमस्ते, मैं ChatterBot हूँ! मैं आज आपकी कैसे मदद कर सकता हूँ?",
    ar: "مرحبا، أنا TouffBot ! كيف يمكنني مساعدتك اليوم؟",
    bn: "হ্যালো, আমি TouffBot ! আমি আজ আপনাকে কীভাবে সাহায্য করতে পারি ?",
    pt: "Olá, sou o TouffBot ! Como posso ajudar você hoje ?",
    ru: "Привет, я TouffBot ! Как я могу помочь вам сегодня ?",
    ja: "こんにちは、私はTouffBotです！今日、何かお手伝いできることはありますか？",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ TouffBot ਹਾਂ ! ਮੈਂ ਤੁਹਾਨੂੰ ਅੱਜ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ ?",
  };

  const thinking: Record<SupportedLanguages, string> = {
    en: "*thinking*",
    fr: "*réfléchit*",
    de: "*denkend*",
    it: "*pensando*",
    zh: "*思考中*",
    es: "*pensando*",
    hi: "*सोचना*",
    ar: "*تفكير*",
    bn: "*চিন্তা*",
    pt: "*pensando*",
    ru: "*думая*",
    ja: "*考え中*",
    pa: "*ਸੋਚ ਰਿਹਾ ਹੈ*",
  };

  const send: Record<SupportedLanguages, string> = {
    en: "send",
    fr: "envoyer",
    de: "senden",
    it: "inviare",
    zh: "发送",
    es: "enviar",
    hi: "भेजना",
    ar: "إرسال",
    bn: "প্রেরণ",
    pt: "enviar",
    ru: "послать",
    ja: "送信",
    pa: "ਭੇਜੋ",
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      role: "assistant",
      content: "👋🏾",
    },
  ]);

  const callGetResponse = async () => {
    if (userInput.trim() === "") return;
    setIsLoading(true);
    let temp = messages;
    temp.push({ id: Date.now(), role: "user", content: userInput });
    setMessages(temp);
    // remove "id" from messages as it's not supported by OpenAI
    const sanitizedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setUserInput("");
    console.log("Calling OpenAI...");

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ messages: sanitizedMessages }),
      });

      const data = await response.json();
      const { output } = data;
      output.id = Date.now(); // Add unique ID
      console.log("OpenAI replied...", output.content);

      setMessages((prevMessages) => [...prevMessages, output]);
    } catch (error) {
      console.log(error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      callGetResponse();
    }
  };

  useEffect(() => {
    const detectedLanguage = navigator.language.split("-")[0];
    setSendButton(send[detectedLanguage as SupportedLanguages] || send["en"]);
    setThink(
      thinking[detectedLanguage as SupportedLanguages] || thinking["en"]
    );
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content:
          greetings[detectedLanguage as SupportedLanguages] || greetings["en"],
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-24 py-5">
      <h1 className="text-5xl">TouffBot</h1>
      <div className="flex flex-grow w-[40rem] flex-col items-center bg-gray-600 rounded-xl mt-5">
        <MessagesDisplay
          messages={messages}
          isLoading={isLoading}
          think={think}
        />
        <InputSection
          value={userInput}
          onChange={setUserInput}
          onKeyDown={handleKeyDown}
          onSubmit={callGetResponse}
          isLoading={isLoading}
          sendButton={sendButton}
        />
      </div>
    </main>
  );
}

function MessagesDisplay({ messages, isLoading, think }: MessagesDisplayProps) {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return (
    <div className="flex-grow flex flex-col gap-2 overflow-y-auto py-8 px-3 w-full">
      {messages.map((e, index) => (
        <div
          key={e.id || index}
          className={`w-max max-w-[18rem] rounded-md px-4 py-3 h-min ${
            e.role === "assistant"
              ? "self-start bg-gray-200 text-gray-800"
              : "self-end bg-gray-800 text-gray-50"
          }`}
        >
          {e.content}
        </div>
      ))}
      {isLoading && (
        <div className="self-start bg-gray-200 text-gray-800 w-max max-w-[18rem] rounded-md px-4 py-3 h-min">
          {think}
          <div className="dots-loader">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef}></div>
    </div>
  );
}

function InputSection({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  isLoading,
  sendButton,
}: InputSectionProps) {
  return (
    <div className="relative w-[80%] bottom-4 flex justify-center">
      <textarea
        value={value}
        onChange={(event) => onChange(DOMPurify.sanitize(event.target.value))}
        className="w-[85%] h-10 px-3 py-2 resize-none overflow-y-auto text-black bg-gray-300 rounded-l outline-none"
        onKeyDown={onKeyDown}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-[20%] bg-blue-500 px-4 py-2 rounded-r"
      >
        {isLoading ? "..." : sendButton}
      </button>
    </div>
  );
}
