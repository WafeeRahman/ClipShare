"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";

function WatchComponent() {
  const videoPrefix =
    "https://storage.googleapis.com/clipshare-processed-videos/";
  const searchParams = useSearchParams();
  const videoSrc = searchParams.get("v");
  const videoTitle = searchParams.get("title");
  const videoDescription = searchParams.get("description");
  const videoKey = searchParams.get("key");
  const shareId = searchParams.get("shareId");

  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const shareUrl =
    typeof window !== "undefined" && shareId
      ? `${window.location.origin}/clip/${shareId}`
      : null;

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Container>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <BackButton>
            <Link href="/">← Back to Home</Link>
          </BackButton>

          <VideoContainer>
            <video controls src={videoPrefix + videoSrc} />
            <VideoDetails>
              <h1>{videoTitle}</h1>
              <p>{videoDescription}</p>
              <small>
                Topic: <em>{videoKey}</em>
              </small>
            </VideoDetails>

            {shareUrl && (
              <ShareRow>
                <ShareInput value={shareUrl} readOnly />
                <CopyBtn onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy Link"}
                </CopyBtn>
              </ShareRow>
            )}
          </VideoContainer>
        </>
      )}
    </Container>
  );
}

export default function Watch() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WatchComponent />
    </Suspense>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: transparent;
  padding: 40px 20px;
  color: #000;
`;

const BackButton = styled.div`
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  a {
    text-decoration: none;
    color: #000;
    border-bottom: 2px solid transparent;
    padding-bottom: 5px;
    transition: color 0.3s ease, border-bottom 0.3s ease;
    &:hover {
      color: #ff4081;
      border-bottom: 2px solid #ff4081;
    }
  }
`;

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 900px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
  }
  video {
    width: 100%;
    height: auto;
    border-radius: 10px;
    margin-bottom: 20px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    transition: box-shadow 0.3s ease;
    &:hover {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    }
  }
`;

const VideoDetails = styled.div`
  text-align: center;
  color: #000;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  h1 {
    font-size: 2rem;
    color: #000;
    margin-bottom: 10px;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.1);
    }
  }
  p {
    font-size: 1.2rem;
    color: #444;
    margin-bottom: 15px;
    line-height: 1.6;
    transition: color 0.3s ease;
    &:hover {
      color: #ffdd57;
    }
  }
  small {
    font-size: 1rem;
    color: #666;
  }
  em {
    font-style: italic;
  }
`;

const ShareRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 500px;
`;

const ShareInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  background: #fff;
  color: #333;
`;

const CopyBtn = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #000;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: #333;
  }
`;

const LoadingSpinner = styled.div`
  width: 100px;
  height: 100px;
  border: 10px solid rgba(0, 0, 0, 0.1);
  border-top: 10px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
