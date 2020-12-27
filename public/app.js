const vm = new window.Vue({
    el: '#app',
    data: {
        posts: [],
        user: []
    },
});

fetch('/api')
    .then((response) => response.json())
    .then((data) => (vm.posts = data))
    .catch((err) => console.error(err));