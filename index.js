// Password Setup
require('dotenv').config();

// Database Setup (MongoDB/Mongoose)
const mongoose = require('mongoose');
const url = `mongodb+srv://admin:${process.env.PASSWORD}@blog.svxno.mongodb.net/blog?retryWrites=true&w=majority`;
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
const postSchema = new mongoose.Schema({ title: String, body: String });
const Post = mongoose.model('Post', postSchema);

// Server Setup (Express)
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const notFound = { message: '404: Page not found.' };

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/api', (req, res) => {
    Post.find()
        .then(posts => posts.reverse())
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json(notFound));
});

app.get('/api/posts/:postId', (req, res) => {
    Post.findById(req.params.postId)
        .then(post => post ? res.json(post) : res.status(404).json(notFound))
        .catch(err => res.status(404).json(notFound));
});

app.post('/', (req, res) => {
    new Post({ title: req.body.newPostTitle, body: req.body.newPostBody }).save()
        .then(post => console.log(`${post.title} created successfully!`))
        .then(post => res.redirect('/'))
        .catch(err => console.error(err));
});

app.use((req, res) => {
    res.status(404).json(notFound);
});

// Start Server
app.listen(port, () => {
    console.log(`Weblog server listening on port ${port}`);
});