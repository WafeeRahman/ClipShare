'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';

export default function Watch() {
  const videoPrefix = 'https://storage.googleapis.com/clipshare-processed-videos/';
  const searchParams = useSearchParams();
  const videoSrc = searchParams.get('v');
  const videoTitle = searchParams.get('title');
  const videoDescription = searchParams.get('description');
  const videoKey = searchParams.get('key');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading delay to show the spinner
    const timer = setTimeout(() => setIsLoading(false), 1000); // 1 second loading
    return () => clearTimeout(timer); // Cleanup
  }, []);

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
          </VideoContainer>
        </>
      )}
    </Container>
  );
}

// Styled Components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: transparent; /* Fully transparent background */
  padding: 40px 20px;
  color: #000; /* Default text color */
`;

const BackButton = styled.div`
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;

  a {
    text-decoration: none;
    color: #000; /* Black text to match the theme */
    border-bottom: 2px solid transparent;
    padding-bottom: 5px;
    transition: color 0.3s ease, border-bottom 0.3s ease;

    &:hover {
      color: #ff4081;
      border-bottom: 2px solid #ff4081; /* Subtle underline effect */
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
  background: rgba(255, 255, 255, 0.15); /* Slightly transparent white */
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px); /* Glassmorphism effect */
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-10px); /* Lift on hover */
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
  color: #000; /* Black text to match the theme */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle text shadow for depth */

  h1 {
    font-size: 2rem;
    color: #000; /* Black title */
    margin-bottom: 10px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.1); /* Title scale on hover */
    }
  }

  p {
    font-size: 1.2rem;
    color: #444; /* Darker gray for description */
    margin-bottom: 15px;
    line-height: 1.6;
    transition: color 0.3s ease;

    &:hover {
      color: #ffdd57; /* Subtle color change on hover */
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

const LoadingSpinner = styled.div`
  width: 100px;
  height: 100px;
  border: 10px solid rgba(0, 0, 0, 0.1); /* Light black circle */
  border-top: 10px solid #000; /* Black for spinning effect */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
