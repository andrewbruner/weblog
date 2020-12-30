// Password Setup
require('dotenv').config();

// Database Setup (MongoDB/Mongoose)
const mongoose = require('mongoose');
const url = `mongodb+srv://admin:${process.env.PASSWORD}@blog.svxno.mongodb.net/blog?retryWrites=true&w=majority`;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
const postSchema = new mongoose.Schema({
    title: String,
    markdown: String,
    html: String,
});
const Post = mongoose.model('Post', postSchema);
const userSchema = new mongoose.Schema({ username: String, password: String });
const User = mongoose.model('User', userSchema);

// Markdown Parsing Setup (Marked/DOMPurify/JSDOM)
const marked = require('marked');
marked.setOptions({
    headerIds: false,
});
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Server Setup (Express)
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
app.set('views', './views');
app.set('view engine', 'pug');
const notFound = { message: '404: Page not found.' };

// Authentication Setup (Passport)
// import modules
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
// set up passport strategy
passport.use(
    new LocalStrategy((username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            if (user.password != password) {
                return done(null, false);
            }
            return done(null, user);
        });
    })
);
// serialize/deserialize user instance to/from session
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        if (err) {
            return done(err);
        }
        done(null, user);
    });
});
// define method to check authentication
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        res.cookie('redirectTo', req.path);
        return res.redirect('/authenticate');
    }
    return next();
};

// Middleware (Body/Cookie Parsers, Passport)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.SECRET,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// ROUTES
// Posts Routes
app.get('/', (req, res) => {
    Post.find()
        .then((posts) => {
            posts.reverse();
            res.render('posts', { user: req.user, posts: posts });
        })
        .catch((err) => res.status(404).json(notFound));
});
app.get('/posts/:postId', (req, res) => {
    Post.findById(req.params.postId)
        .then((post) => res.render('posts', { user: req.user, posts: [post] }))
        .catch((err) => res.status(404).json(notFound));
});

// Authentication Routes
app.get('/authenticate', (req, res) => {
    req.user
        ? res.redirect('/')
        : res.render('authenticate');
});
app.post(
    '/authenticate',
    passport.authenticate('local', { failureRedirect: '/authenticate' }),
    (req, res) => {
        const redirectTo = req.cookies.redirectTo || '/';
        res.clearCookie('redirectTo');
        res.redirect(redirectTo);
    }
);
app.get('/logout', (req, res) => {
    req.logout();
    res.clearCookie('connect.sid');
    res.redirect('/');
});

// New Post Route
app.get('/new-post', isAuthenticated, (req, res) => {
    res.render('post', { user: req.user });
});
app.post('/create-post', isAuthenticated, (req, res) => {
    const clean = DOMPurify.sanitize(req.body.postBody);
    const html = marked(clean);
    new Post({
        title: req.body.postTitle,
        markdown: req.body.postBody,
        html: html
    })
        .save()
        .then((post) => res.redirect('/'))
        .catch((err) => console.error(err));
});

// Update Post Routes
app.get('/posts/:postId/update', isAuthenticated, (req, res) => {
    Post.findById(req.params.postId)
        .then((post) => res.render('post', { user: req.user, post: post }))
});
app.post('/update-post', isAuthenticated, (req, res) => {
    const clean = DOMPurify.sanitize(req.body.postBody);
    const html = marked(clean);
    Post.findByIdAndUpdate(
        req.body.postId, {
            title: req.body.postTitle,
            markdown: req.body.postBody,
            html: html
        }, (err, post) => {
            if (err) {
                res.status(404).json(notFound);
            } else {
                res.redirect(`/posts/${post.id}`);
            }
        }
    );
});

// Delete Post Route
app.post('/delete-post', isAuthenticated, (req, res) => {
    Post.findByIdAndDelete(
        req.body.postId, (err, post) => {
            if (err) {
                res.status(404).json(notFound);
            } else {
                res.redirect('/');
            }
        }
    );
});

// 404 Route
app.use((req, res) => {
    res.status(404).json(notFound);
});

// Start Server
app.listen(port, () => {
    console.log(`Weblog server listening on port ${port}`);
});
