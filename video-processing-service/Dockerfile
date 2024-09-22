#Build App
FROM node:18 AS builder

#Set Working Directory as /app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

#Install dependencies
RUN npm install

# Bundle the app source inside the Docker image
COPY . .

# Build the app
RUN npm run build

#Production

#Parent image, an office node runtime
FROM node:18

#Install ffmpeg cli into the container
RUN apt-get update && apt-get install -y ffmpeg

#Set working directory in the container to /app
WORKDIR /app

#Copy both package jsons to the container, the way this works is that each command builds a new docker layer, and docker can cache these layers
#These layers are cached and if the package.json file has not changed, the docker will use the cached layer, 
# and not download the dependencies again
COPY package*.json ./

#Install procudtion dependencies
RUN npm install --only=production

# Copy app src inside the docker image
COPY --from=builder /app/dist ./dist 

#Free port 3000 outside trhe container
EXPOSE 3000

#Run start script to run the app using CMD
CMD ["npm", "run", "serve"] 
#Serves Dist Folder Files in production mode