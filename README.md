# Andrew Bruner | Weblog

A personal weblog project using the MEVN technology stack of MongoDB/Mongoose, Express, Vue and Node.js.

## Prerequisites

- Access to the [terminal](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Command_line#Welcome_to_the_terminal) on your local machine (computer)
- [Node.js](https://nodejs.org) and [npm](https://npmjs.com) installed on your local machine
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and database

## Installation

1. Dowload these files onto your local machine into a containing folder/directory.

2. In your terminal run this command from the parent directory:
   
    ```
   npm install
    ``` 

    This installs all dependencies (other neccessary programs) of the project for you.

3. Create a file in the root directory name `.env`
   
   Note the dot ( . ) at the beginning of the file name.

4. In the `.env` file, write the following:

    ```
    PASSWORD=your-mongodb-atlas-database-password
    SECRET=a-secret-word-or-phrase
    ```

    Input your personal MongoDB Atlas Database password and secret phrase of choice

## Usage

1. In your terminal, run this command from the parent directory:

    ```
    npm start
    ```

    Or, if you are testing changes in development:

    ```
    npm run dev
    ```

    This will restart the server automatically when you make changes to any file using the `nodemon` utility.
