"use client";

import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  getVideos,
  getVideoByKey,
  getMyNamespaces,
  Video,
  Namespace,
} from "../firebase/functions";

interface Message {
  from: "user" | "bot";
  text: string;
}

const HELP_TEXT = `Available commands:
  /search <query>  — Search videos by title
  /topic <topic>   — Find videos by topic/key
  /recent          — Show 5 most recent uploads
  /libraries       — List your libraries
  /share <title>   — Get share link for a video
  /help            — Show this help message`;

export default function ClipBotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hey! I'm ClipBot. Type /help to see what I can do.",
    },
  ]);
  const [input, setInput] = useState("");
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getVideos().then(setAllVideos).catch(() => {});
    getMyNamespaces().then(setNamespaces).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = (from: "user" | "bot", text: string) => {
    setMessages((prev) => [...prev, { from, text }]);
  };

  const handleSend = async () => {
    const cmd = input.trim();
    if (!cmd) return;
    addMsg("user", cmd);
    setInput("");

    if (cmd === "/help") {
      addMsg("bot", HELP_TEXT);
      return;
    }

    if (cmd === "/recent") {
      if (allVideos.length === 0) {
        addMsg("bot", "No videos found. Try uploading some first!");
        return;
      }
      const recent = allVideos.slice(0, 5);
      const lines = recent
        .map(
          (v, i) =>
            `${i + 1}. ${v.title || "Untitled"} [${v.key || "no topic"}]${
              v.shareId ? ` — /clip/${v.shareId}` : ""
            }`
        )
        .join("\n");
      addMsg("bot", `Recent uploads:\n${lines}`);
      return;
    }

    if (cmd.startsWith("/search ")) {
      const query = cmd.slice(8).toLowerCase();
      const results = allVideos.filter(
        (v) =>
          v.title?.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
      );
      if (results.length === 0) {
        addMsg("bot", `No videos match "${query}".`);
      } else {
        const lines = results
          .slice(0, 10)
          .map(
            (v, i) =>
              `${i + 1}. ${v.title}${v.shareId ? ` — /clip/${v.shareId}` : ""}`
          )
          .join("\n");
        addMsg("bot", `Found ${results.length} result(s):\n${lines}`);
      }
      return;
    }

    if (cmd.startsWith("/topic ")) {
      const topic = cmd.slice(7).trim();
      try {
        const results = await getVideoByKey(topic);
        if (!results || results.length === 0) {
          addMsg("bot", `No videos with topic "${topic}".`);
        } else {
          const lines = results
            .map(
              (v, i) =>
                `${i + 1}. ${v.title || "Untitled"}${
                  v.shareId ? ` — /clip/${v.shareId}` : ""
                }`
            )
            .join("\n");
          addMsg("bot", `Videos with topic "${topic}":\n${lines}`);
        }
      } catch {
        addMsg("bot", "Error searching by topic.");
      }
      return;
    }

    if (cmd === "/libraries") {
      if (namespaces.length === 0) {
        addMsg("bot", "You don't belong to any libraries.");
      } else {
        const lines = namespaces
          .map((n) => `- ${n.name} (${n.members.length} members)`)
          .join("\n");
        addMsg("bot", `Your libraries:\n${lines}`);
      }
      return;
    }

    if (cmd.startsWith("/share ")) {
      const query = cmd.slice(7).toLowerCase();
      const match = allVideos.find((v) =>
        v.title?.toLowerCase().includes(query)
      );
      if (!match) {
        addMsg("bot", `No video found matching "${query}".`);
      } else if (!match.shareId) {
        addMsg("bot", `"${match.title}" doesn't have a share link yet.`);
      } else {
        const url =
          typeof window !== "undefined"
            ? `${window.location.origin}/clip/${match.shareId}`
            : `/clip/${match.shareId}`;
        addMsg("bot", `Share link for "${match.title}":\n${url}`);
      }
      return;
    }

    addMsg(
      "bot",
      `Unknown command. Type /help to see available commands.`
    );
  };

  return (
    <Page>
      <Header>ClipBot</Header>
      <ChatBox>
        {messages.map((m, i) => (
          <Bubble key={i} $isBot={m.from === "bot"}>
            <BubbleLabel>{m.from === "bot" ? "ClipBot" : "You"}</BubbleLabel>
            <BubbleText>{m.text}</BubbleText>
          </Bubble>
        ))}
        <div ref={bottomRef} />
      </ChatBox>
      <InputRow>
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a command... (/help)"
        />
        <SendBtn onClick={handleSend}>Send</SendBtn>
      </InputRow>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 12px;
  text-align: center;
`;

const ChatBox = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ddd;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Bubble = styled.div<{ $isBot: boolean }>`
  align-self: ${(p) => (p.$isBot ? "flex-start" : "flex-end")};
  max-width: 80%;
  background: ${(p) => (p.$isBot ? "#f0f0f0" : "#000")};
  color: ${(p) => (p.$isBot ? "#000" : "#fff")};
  border-radius: 12px;
  padding: 10px 14px;
`;

const BubbleLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 4px;
  opacity: 0.6;
`;

const BubbleText = styled.pre`
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #000;
  }
`;

const SendBtn = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  background: #000;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #333;
  }
`;
