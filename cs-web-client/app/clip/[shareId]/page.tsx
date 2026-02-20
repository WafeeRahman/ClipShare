"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { getVideoByShareId, Video } from "../../firebase/functions";

const VIDEO_PREFIX =
  "https://storage.googleapis.com/clipshare-processed-videos/";

export default function SharedClipPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareId) return;
    getVideoByShareId(shareId)
      .then((v) => setVideo(v))
      .catch(() => setError("Video not found or link is invalid."))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <Center><Spinner /></Center>;
  if (error) return <Center><ErrorText>{error}</ErrorText></Center>;
  if (!video) return <Center><ErrorText>Video not found.</ErrorText></Center>;

  return (
    <Container>
      <BackButton>
        <Link href="/">← Back to Home</Link>
      </BackButton>

      <VideoContainer>
        <video controls src={VIDEO_PREFIX + video.filename} />
        <VideoDetails>
          <h1>{video.title}</h1>
          <p>{video.description}</p>
          <small>
            Topic: <em>{video.key}</em>
          </small>
        </VideoDetails>
        <ShareRow>
          <CopyButton
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied!");
            }}
          >
            Copy Share Link
          </CopyButton>
        </ShareRow>
      </VideoContainer>
    </Container>
  );
}

const Center = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-top: 6px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ErrorText = styled.p`
  font-size: 1.2rem;
  color: #c00;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
`;

const BackButton = styled.div`
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 700;
  a {
    text-decoration: none;
    color: #000;
    border-bottom: 2px solid transparent;
    padding-bottom: 5px;
    transition: color 0.3s ease, border-bottom 0.3s ease;
    &:hover { color: #ff4081; border-bottom: 2px solid #ff4081; }
  }
`;

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 900px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  video {
    width: 100%;
    height: auto;
    border-radius: 10px;
    margin-bottom: 20px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }
`;

const VideoDetails = styled.div`
  text-align: center;
  color: #000;
  h1 { font-size: 2rem; margin-bottom: 10px; }
  p { font-size: 1.2rem; color: #444; margin-bottom: 15px; line-height: 1.6; }
  small { font-size: 1rem; color: #666; }
`;

const ShareRow = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 12px;
`;

const CopyButton = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #000;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #333; }
`;
