"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaPaperPlane } from "react-icons/fa";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What amplifier suits a small room?",
  "Explain Dolby Atmos simply",
  "Bookshelf vs floorstanding speakers?",
  "What is a DAC?",
];

const WaveIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 12C2 12 4 7 7 7C10 7 10 17 13 17C16 17 16 7 19 7C22 7 22 12 22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(201,168,76,0.1);padding:1px 5px;border-radius:4px;font-size:0.85em;color:#C9A84C">$1</code>')
    .replace(/^#{1,3}\s(.+)/gm, '<div style="font-weight:700;color:#F5F5F5;margin:8px 0 4px">$1</div>')
    .replace(/^[-•]\s(.+)/gm, '<div style="padding-left:12px;margin:2px 0">• $1</div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, "<br/>");
}

export default function WAVEChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setShowPulse(false);
      setMessages([
        {
          role: "assistant",
          content:
            "Hey there! 👋 I'm **WAVE** — your personal audio guide from SOUNDWAVE.\n\nWhether you're building a home theater, choosing between speakers, or just curious about audio tech — I'm here to help.\n\nWhat can I tune you in on today?",
        },
      ]);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasGreeted]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const newMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/wave-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Apologies, I ran into a hiccup. Try again in a moment!",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue — please check your network and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* WAVE Toggle Button */}
      <motion.button
        id="wave-chatbot-toggle"
        aria-label="Open WAVE AI Audio Assistant"
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed",
          bottom: "5.75rem",
          right: "1.5rem",
          zIndex: 50,
          width: "3.25rem",
          height: "3.25rem",
          borderRadius: "50%",
          background: isOpen
            ? "rgba(201, 168, 76, 0.3)"
            : "rgba(201, 168, 76, 0.15)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "#C9A84C",
          fontSize: "1.2rem",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: [
            "inset 0 0 0 1px rgba(201,168,76,0.4)",
            "inset 0 1px 0 rgba(255,255,255,0.2)",
            "inset 0 -2px 8px rgba(201,168,76,0.15)",
            "0 4px 24px rgba(201,168,76,0.35)",
            "0 1px 3px rgba(0,0,0,0.6)",
          ].join(", "),
        }}
      >
        {/* Inner glass highlight arc */}
        <span
          style={{
            position: "absolute",
            top: "6px",
            left: "10px",
            right: "10px",
            height: "40%",
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Pulse ring when closed and unread */}
        {showPulse && !isOpen && (
          <span
            style={{
              position: "absolute",
              inset: "-3px",
              borderRadius: "50%",
              border: "2px solid rgba(201,168,76,0.5)",
              animation: "wave-pulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaTimes style={{ fontSize: "1rem" }} />
            </motion.span>
          ) : (
            <motion.span
              key="wave"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WaveIcon size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="wave-chatbot-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              bottom: "10.5rem",
              right: "1.5rem",
              zIndex: 50,
              width: "min(380px, calc(100vw - 2rem))",
              height: "min(560px, calc(100vh - 12rem))",
              borderRadius: "1.5rem",
              background:
                "linear-gradient(160deg, rgba(18,18,18,0.97) 0%, rgba(10,10,10,0.99) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: [
                "0 0 0 1px rgba(201,168,76,0.2)",
                "0 24px 60px rgba(0,0,0,0.7)",
                "0 0 80px rgba(201,168,76,0.07)",
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.1rem 1.25rem",
                borderBottom: "1px solid rgba(201,168,76,0.12)",
                background:
                  "linear-gradient(90deg, rgba(201,168,76,0.06) 0%, transparent 100%)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexShrink: 0,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #C9A84C 0%, #A37F2C 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0D0D0D",
                  fontSize: "0.9rem",
                  flexShrink: 0,
                  boxShadow: "0 0 16px rgba(201,168,76,0.4)",
                }}
              >
                <WaveIcon size={17} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#F5F5F5",
                    lineHeight: 1.2,
                  }}
                >
                  WAVE
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.05em",
                    color: "#6B6B6B",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "inline-block",
                      boxShadow: "0 0 6px rgba(34,197,94,0.7)",
                    }}
                  />
                  Audio AI · Online
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B6B6B",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#F5F5F5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#6B6B6B")
                }
                aria-label="Close chat"
              >
                <FaTimes style={{ fontSize: "0.85rem" }} />
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                scrollbarWidth: "none",
              }}
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div
                      style={{
                        width: "1.6rem",
                        height: "1.6rem",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #C9A84C 0%, #A37F2C 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#0D0D0D",
                        marginRight: "0.5rem",
                        flexShrink: 0,
                        alignSelf: "flex-end",
                        marginBottom: "2px",
                        fontSize: "0.7rem",
                      }}
                    >
                      <WaveIcon size={11} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "0.65rem 0.9rem",
                      borderRadius:
                        msg.role === "user"
                          ? "1rem 1rem 0.2rem 1rem"
                          : "1rem 1rem 1rem 0.2rem",
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(163,127,44,0.15) 100%)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        msg.role === "user"
                          ? "1px solid rgba(201,168,76,0.25)"
                          : "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.82rem",
                      lineHeight: 1.55,
                      color: msg.role === "user" ? "#F5F5F5" : "#C8C8C8",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdown(msg.content),
                    }}
                  />
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}
                >
                  <div
                    style={{
                      width: "1.6rem",
                      height: "1.6rem",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #C9A84C 0%, #A37F2C 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0D0D0D",
                      flexShrink: 0,
                    }}
                  >
                    <WaveIcon size={11} />
                  </div>
                  <div
                    style={{
                      padding: "0.7rem 1rem",
                      borderRadius: "1rem 1rem 1rem 0.2rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "#C9A84C",
                          animation: `wave-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions — shown only at start */}
            {messages.length <= 1 && !isLoading && (
              <div
                style={{
                  padding: "0 1rem 0.75rem",
                  display: "flex",
                  gap: "0.4rem",
                  flexWrap: "wrap",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  paddingTop: "0.75rem",
                }}
              >
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.68rem",
                      letterSpacing: "0.02em",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "2rem",
                      background: "rgba(201,168,76,0.07)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      color: "#A8A8A8",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(201,168,76,0.15)";
                      e.currentTarget.style.color = "#C9A84C";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(201,168,76,0.07)";
                      e.currentTarget.style.color = "#A8A8A8";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: "0.75rem 1rem",
                borderTop: "1px solid rgba(201,168,76,0.1)",
                display: "flex",
                gap: "0.6rem",
                alignItems: "center",
                background: "rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                id="wave-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask WAVE anything about audio..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.75rem",
                  padding: "0.6rem 0.9rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.82rem",
                  color: "#F5F5F5",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(201,168,76,0.4)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.08)";
                }}
              />
              <button
                id="wave-chat-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.65rem",
                  background:
                    input.trim() && !isLoading
                      ? "linear-gradient(135deg, #C9A84C 0%, #A37F2C 100%)"
                      : "rgba(255,255,255,0.05)",
                  border: "none",
                  color:
                    input.trim() && !isLoading
                      ? "#0D0D0D"
                      : "rgba(255,255,255,0.2)",
                  cursor:
                    input.trim() && !isLoading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  fontSize: "0.8rem",
                }}
                aria-label="Send message"
              >
                <FaPaperPlane />
              </button>
            </div>

            {/* Powered by footer */}
            <div
              style={{
                padding: "0.4rem 1rem 0.5rem",
                textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.58rem",
                letterSpacing: "0.08em",
                color: "#3A3A3A",
                textTransform: "uppercase",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              Powered by Groq · SOUNDWAVE WAVE AI
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframe styles */}
      <style>{`
        @keyframes wave-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.18); opacity: 0; }
        }
        @keyframes wave-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
