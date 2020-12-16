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
const userSchema = new mongoose.Schema({ username: String, password: String });
const User = mongoose.model('User', userSchema);

// Server Setup (Express)
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
const notFound = { message: '404: Page not found.' };

// Middleware (Body/Cookie Parsers)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// ROUTES (API/Authentication/Static/Application/404)
// API Routes
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

// Authentication Route
app.post('/authenticate', (req, res) => {
    User.findOne({ username: req.body.username })
        .then(user => {
            if (user.password == req.body.password) {
                res.cookie('authenticated', 'true');
                if (req.cookies.redirectTo) {
                    res.redirect(req.cookies.redirectTo);
                } else {
                    res.redirect('/');
                }
            } else {
                res.redirect('/authenticate');
            };
        })
        .catch(err => res.status(404).json(notFound));
});

// Static Routes (Public/Private)
app.use(express.static('public'));
app.use((req, res, next) => {
    req.cookies.authenticated == 'true' ? next() : (() => {
        res.cookie('redirectTo', req.path);
        res.redirect('/authenticate');
    })();
}, express.static('private'));

// Application Routes
app.post('/new-post', (req, res) => {
    new Post({ title: req.body.newPostTitle, body: req.body.newPostBody }).save()
        .then(post => console.log(`${post.title} created successfully!`))
        .then(post => res.redirect('/'))
        .catch(err => console.error(err));
});

// 404 Route
app.use((req, res) => {
    res.status(404).json(notFound);
});

// Start Server
app.listen(port, () => {
    console.log(`Weblog server listening on port ${port}`);
});
