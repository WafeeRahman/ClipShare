'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import styled, { css } from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import React from 'react';
import { getVideoByKey, getVideos } from '../firebase/functions'; // Import the callable function

function Search() {
  const [input, setInput] = useState<string>(''); // Explicit type string for input
  const [expanded, setExpanded] = useState<boolean>(false); // Explicit type boolean for expanded state
  const [videos, setVideos] = useState<any[]>([]); // To store the videos from the search

  const handleFocus = () => {
    setExpanded(true);
  };

  const handleBlur = () => {
    if (input === '') {
      setExpanded(false);
    }
  };

  // Type for form submit event
  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Call the backend to search videos by key
    try {
      const response = await getVideoByKey(input);
      setVideos(response); // Update the videos state with search results
    } catch (error) {
      console.error('Error fetching videos by key:', error);
    }
  };

  // Type for input change event
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div>
      <FormStyle
        onSubmit={submitHandler}
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
          />
        </div>
      </FormStyle>

      {/* Display search results */}
      <div>
        {videos.length > 0 ? (
          <ul>
            {videos.map((video) => (
              <li key={video.id}>
                <a href={`/watch?v=${video.filename}`}>
                  {video.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No videos found</p>
        )}
      </div>
    </div>
  );
}

const FormStyle = styled.form<{ $expanded: boolean }>`
  margin: 0rem auto;
  max-width: 40%;
  transition: max-width 0.5s;

  ${(props) =>
    props.$expanded &&
    css`
      max-width: 60%;
    `}

  div {
    width: 100%;
    position: relative;
  }
  input {
    border: none;
    background: linear-gradient(35deg, #494949, #313131);
    font-size: 1.5rem;
    color: white;
    padding: 1rem 3rem;
    border: none;
    border-radius: 1rem;
    outline: none;
    width: 100%;
  }
  svg {
    position: absolute;
    top: 50%;
    left: 0%;
    transform: translate(100%, -50%);
    color: white;
  }
`;

export default Search;
