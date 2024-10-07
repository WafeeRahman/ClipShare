# ClipShare

**ClipShare** is a full-stack web application designed to allow users to upload, search, and watch short videos. This project showcases a modern and dynamic user experience while leveraging cloud video processing to handle user-submitted videos efficiently.

**Note**: The project is deployed online, but the link is not publicly available. If you're interested in viewing the live application or have any questions, please reach out to me on [LinkedIn](https://www.linkedin.com/in/[your-profile](https://www.linkedin.com/in/wafee-rahman-772108270/)).

## Demo
![ezgif-3-0f92042798](https://github.com/user-attachments/assets/b840a570-2ff3-4f9b-841e-474b3cba9ab6)




## Features

- **Video Uploading**: Users can upload videos with titles, descriptions, and topics.
- **Search Functionality**: Real-time search bar with animated expansion and dynamic filtering of videos.
- **Video Playback**: Watch videos with player functionality and detailed video information through a ReactTS and NextJS frontend, deployed with Docker.
- **User Authentication**: Secure sign-in and sign-out functionality using OAuth2.
- **Cloud Video Processing**: Automatic compression and storage of uploaded videos using Google Cloud Platform.

## Tech Stack

###  Backend

- **Node.js & Express**: Server-side logic, API routing, data validation, and error handling.
- **Firebase Firestore**: Cloud-hosted NoSQL database for scalable data storage.
- **Firebase Cloud Functions**: Serverless functions for handling backend logic and integration with Firebase services.
- **Google Cloud Platform**: Deployed video processing service using Docker containers, enabling seamless video processing with Pub/Sub messaging.
- **OAuth2 Authorization**: Secure user authentication and function execution.

## Frontend

- **React.js & Next.js**: Dynamic and responsive user interface with server-side rendering capabilities.
- **TypeScript**: Static typing for safer and more maintainable code.

### Additional Technologies

- **Docker**: Containerization of video processing service for scalability and ease of deployment.
- **Google Cloud Pub/Sub**: Messaging service for communication between services.
- **Firebase Storage**: Secure and scalable storage for user-uploaded videos.
- **ESLint & Prettier**: Code linting and formatting for code consistency.
- **GitHub**: Version control and collaboration.

## Architecture Overview

The application is structured with a clear separation of concerns:

- **Frontend**: Built with React.js and Next.js, providing a dynamic and responsive user interface. Styled-components and Material UI are used for styling and design consistency.
- **Backend**: Utilizes Firebase Cloud Functions and Firestore for serverless backend logic and data storage. Node.js and Express handle API routing and data validation.
- **Cloud Video Processing**: Deployed on Google Cloud Platform using Docker containers. Videos are processed asynchronously using Pub/Sub messaging, allowing for efficient compression and storage.
- **Authentication**: OAuth2 is implemented for secure user authentication, ensuring only authorized users can upload and manage videos.
- **Data Flow**: Users interact with the frontend, which communicates with the backend APIs. Uploaded videos are sent to Cloud Storage, processed, and then made available for playback.

This architecture ensures that **ClipShare** is scalable, maintainable, and provides a seamless user experience for uploading and viewing videos.



