'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import styled, { css } from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import React from 'react';
import { getVideos } from '../firebase/functions'; // Import the getVideos function
import Image from 'next/image';
import Link from 'next/link';

function Search() {
  const [input, setInput] = useState<string>(''); // Search input value
  const [expanded, setExpanded] = useState<boolean>(false); // Input field expanded state
  const [videos, setVideos] = useState<any[]>([]); // All videos from Firestore
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]); // Filtered videos based on search input

  useEffect(() => {
    // Fetch the initial videos when the component mounts
    const fetchVideos = async () => {
      try {
        const response = await getVideos();
        setVideos(response); // Store the initial videos
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();
  }, []);

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setInput(query);

    // Filter videos based on the input value
    const filtered = videos.filter((video) =>
      video.title.toLowerCase().includes(query)
    );
    setFilteredVideos(filtered); // Update the filtered videos
  };

  const handleFocus = () => {
    setExpanded(true);
  };

  const handleBlur = () => {
    if (input === '') {
      setExpanded(false);
    }
  };

  return (
    <SearchContainer>
      <FormStyle
        onSubmit={(e) => e.preventDefault()} // Prevent form submission
        $expanded={expanded}
      >
        <div>
          <FaSearch />
          <input
            onChange={handleInputChange}
            type="text"
            value={input}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search for a video title..."
          />
        </div>
      </FormStyle>

      {/* Display search results only if there's a value in the search bar */}
      {input && (
        <VideoGridWrapper>
          <CenteredVideoGrid>
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <VideoItem key={video.id}>
                  <Link
                    href={`/watch?v=${video.filename}&title=${encodeURIComponent(video.title)}&description=${encodeURIComponent(video.description)}&key=${encodeURIComponent(video.key)}`}
                  >
                    <Image
                      src={'/thumbnail.png'} // Replace with actual thumbnail URL if available
                      alt={`${video.title} thumbnail`}
                      width={180} // Reduce thumbnail size
                      height={100}
                      className="thumbnail"
                    />
                    <VideoTitle>{video.title}</VideoTitle>
                  </Link>
                </VideoItem>
              ))
            ) : (
              <NoVideosText>No videos found</NoVideosText>
            )}
          </CenteredVideoGrid>
        </VideoGridWrapper>
      )}
    </SearchContainer>
  );
}

// Styled Components

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Avoid stretching to fill height */
  width: 100%;
  padding: 20px;
`;

const FormStyle = styled.form<{ $expanded: boolean }>`
  max-width: 30%; /* Further reduce width */
  width: 100%;
  margin-bottom: 20px; /* Reduce margin below search bar */
  transition: max-width 0.5s;

  ${(props) =>
    props.$expanded &&
    css`
      max-width: 45%; /* Reduce expansion size */
    `}

  div {
    width: 100%;
    position: relative;
  }

  input {
    border: none;
    background: linear-gradient(35deg, #494949, #313131);
    font-size: 1.1rem; /* Reduce font size */
    color: white;
    padding: 0.6rem 2rem; /* Reduce padding */
    border-radius: 0.5rem; /* Reduce border radius */
    outline: none;
    width: 100%;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
    transition: box-shadow 0.3s ease;

    &:focus {
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }
  }

  svg {
    position: absolute;
    top: 50%;
    left: 10px; /* Slightly adjust icon placement */
    transform: translateY(-50%);
    color: white;
  }
`;

const VideoGridWrapper = styled.div`
  display: flex;
  justify-content: center; /* Center the entire grid wrapper */
  width: 100%;
  margin-top: 20px; /* Space between search bar and grid */
`;

const CenteredVideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Fix grid to 3 columns */
  gap: 15px; /* Reduce gap between videos */
  justify-items: center; /* Center each item */
  padding: 10px;
  width: 100%;
  max-width: 800px; /* Reduce the maximum grid width */
`;

const VideoItem = styled.div`
  text-align: center;

  a {
    text-decoration: none;
    color: inherit;
  }

  .thumbnail {
    border-radius: 8px; /* Reduce border radius */
    transition: transform 0.2s ease, opacity 0.2s ease;
    width: 100%;
    height: auto;
  }

  &:hover .thumbnail {
    opacity: 0.9;
    transform: scale(1.03); /* Subtle hover effect */
  }
`;

const VideoTitle = styled.h2`
  font-size: 0.9rem; /* Slightly reduce font size */
  font-weight: 600;
  color: #1d1d1f;
  margin: 6px 0 4px 0; /* Reduce margin */
`;

const NoVideosText = styled.p`
  font-size: 1rem;
  color: #888;
`;

export default Search;
