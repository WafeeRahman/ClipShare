# ClipShare

**ClipShare** is a full-stack web application designed to allow users to upload, search, and watch videos. This project showcases a modern and dynamic user experience with a focus on smooth animations and responsive design. The application leverages cloud video processing to handle user-submitted videos efficiently.

**Note**: The project is deployed online, but the link is not publicly available. If you're interested in viewing the live application or have any questions, please reach out to me on [LinkedIn](https://www.linkedin.com/in/your-profile).

## Demo
![ClipShareDemo (1)](https://github.com/user-attachments/assets/f228acb2-55de-496d-b3b5-705558c27c79)



## Features

- **Video Uploading**: Users can upload videos with titles, descriptions, and topics.
- **Search Functionality**: Real-time search bar with animated expansion and dynamic filtering of videos.
- **Video Playback**: Watch videos with an elegant player and detailed video information.
- **User Authentication**: Secure sign-in and sign-out functionality using OAuth2.
- **Interactive UI**: Smooth animations and hover effects throughout the site for an engaging user experience.
- **Cloud Video Processing**: Automatic compression and storage of uploaded videos using Google Cloud Platform.

## Tech Stack

### Backend
- **Firebase Firestore**: Cloud-hosted NoSQL database for scalable data storage.
- **Firebase Cloud Functions**: Serverless functions for handling backend logic and integration with Firebase services.
- **Google Cloud Platform**: Deployed video processing service using Docker containers, enabling seamless video processing with Pub/Sub messaging.
- **OAuth2 Authorization**: Secure user authentication and function execution.

### Frontend

- **React.js & Next.js**: Dynamic and responsive user interface with server-side rendering capabilities.
- **TypeScript**: Static typing for safer and more maintainable code.
- **Styled-components**: CSS-in-JS for styling React components.
- **Material UI**: Modern and consistent design system for UI components.

### Additional Technologies

- **Docker**: Containerization of video processing service for scalability and ease of deployment.
- **Google Cloud Pub/Sub**: Messaging service for communication between services.
- **Firebase Storage**: Secure and scalable storage for user-uploaded videos.

## Architecture Overview

The application is structured with a clear separation of concerns:

- **Frontend**: Built with React.js and Next.js, providing a dynamic and responsive user interface. Styled-components and Material UI are used for styling and design consistency.
- **Backend**: Utilizes Firebase Cloud Functions and Firestore for serverless backend logic and data storage. Node.js and Express handle API routing and data validation.
- **Cloud Video Processing**: Deployed on Google Cloud Platform using Docker containers. Videos are processed asynchronously using Pub/Sub messaging, allowing for efficient compression and storage.
- **Authentication**: OAuth2 is implemented for secure user authentication, ensuring only authorized users can upload and manage videos.
- **Data Flow**: Users interact with the frontend, which communicates with the backend APIs. Uploaded videos are sent to Cloud Storage, processed, and then made available for playback.

This architecture ensures that **ClipShare** is scalable, maintainable, and provides a seamless user experience for uploading and viewing videos.
