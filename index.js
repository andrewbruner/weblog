// Password Setup
require('dotenv').config();

// Database Setup (MongoDB/Mongoose)
const mongoose = require('mongoose');
const url = `mongodb+srv://admin:${process.env.PASSWORD}@blog.svxno.mongodb.net/blog?retryWrites=true&w=majority`;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
const postSchema = new mongoose.Schema({ title: String, body: String });
const Post = mongoose.model('Post', postSchema);
const userSchema = new mongoose.Schema({ username: String, password: String });
const User = mongoose.model('User', userSchema);

// Markdown Parsing Setup (Marked/DOMPurify/JSDOM)
const marked = require('marked');
marked.setOptions({
    headerIds: false 
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
const notFound = { message: '404: Page not found.' };

// Authentication Setup (Passport)
// import modules
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
// set up passport strategy
passport.use(new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if (err) { return done(err) }
            if (!user) { return done(null, false); }
            if (user.password != password) { return done(null, false); }
            return done(null, user);
        });
    }
));
// serialize/deserialize user instance to/from session
passport.serializeUser((user, done) => {
    done(null, user.id);
  });
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        if (err) { return done(err); }
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
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET
}));
app.use(passport.initialize());
app.use(passport.session());

// ROUTES (API/Authentication/Public/Private/Application/404)
// API Routes
app.get('/api', (req, res) => {
    Post.find()
        .then((posts) => posts.reverse())
        .then((posts) => res.json(posts))
        .catch((err) => res.status(404).json(notFound));
});

app.get('/api/posts/:postId', (req, res) => {
    Post.findById(req.params.postId)
        .then((post) =>
            post ? res.json(post) : res.status(404).json(notFound)
        )
        .catch((err) => res.status(404).json(notFound));
});

// Authentication Route
app.post('/authenticate', passport.authenticate('local', { failureRedirect: '/authenticate' }),
    (req, res) => { res.redirect(req.cookies.redirectTo || '/'); }
);

// Static Routes (Public)
app.use(express.static('public'));

// Static Routes (Private)
app.get('/new-post', isAuthenticated, express.static('private'));

// Application Routes
app.post('/new-post', (req, res) => {
    const clean = DOMPurify.sanitize(req.body.newPostBody);
    const markdown = marked(clean);
    new Post({ title: req.body.newPostTitle, body: markdown }).save()
        .then((post) => res.redirect('/'))
        .catch((err) => console.error(err));
});

// 404 Route
app.use((req, res) => {
    res.status(404).json(notFound);
});

// Start Server
app.listen(port, () => {
    console.log(`Weblog server listening on port ${port}`);
});
