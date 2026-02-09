# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install express explicitly
RUN npm install express

# Copy app source
COPY index.js ./

# Start the app
CMD ["npm", "start"]
