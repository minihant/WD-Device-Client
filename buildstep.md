# create dockfile 
    ```
    FROM node:12.13.1

    # Create app directory
    WORKDIR /usr/src/app

    # Install app dependencies
    COPY package*.json ./

    RUN npm install
    # If you are building your code for production
    # RUN npm ci --only=production

    # Bundle app source
    COPY . .

    EXPOSE 8081

    CMD [ "node", "server.js" ]
    ```

#build .dockerignore
    ```
    node_modules
    npm-debug.log
    ```


# Building your image
    docker build -t winpos/display .

# Run the image
    docker run --init -p 8081:8081 -it winpos/display

# if you need to go inside the container you can use the exec command:
    docker exec -it <container id> /bin/bash

# get container ip address
    docker inspect <container_ID Or container_name> | grep 'IPAddress'