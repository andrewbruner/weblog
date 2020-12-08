// Environment Variables
require('dotenv').config();

// MongoDB/Mongoose
const mongoose = require('mongoose');
const url = `mongodb+srv://admin:${process.env.PASSWORD}@blog.svxno.mongodb.net/blog?retryWrites=true&w=majority`;
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
const postSchema = new mongoose.Schema({ title: String, body: String });
const Post = mongoose.model('Post', postSchema);

// Express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const notFound = { message: '404: Page not found.'};

// Routes
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/api', async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

app.get('/api/posts/:postId', async (req, res) => {
    const post = await Post.findById(req.params.postId).catch(err => 'error');
    post != 'error' ? res.json(post) : res.status(404).json(notFound);
});

app.post('/', async (req, res) => {
    await Post.create({ title: req.body.newPostTitle, body: req.body.newPostBody}, (err, post) => {
        err ? console.error(err) : console.log(`${post.title} saved successfully!`);
    });
    res.redirect('/');
})

app.use((req, res) => {
    res.status(404).json(notFound);
});

// Server
app.listen(port, () => {
    console.log(`Blog server listening on port ${port}`);
});