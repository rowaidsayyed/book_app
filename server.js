'use strict';

require('dotenv').config();

const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();
const superagent = require('superagent');
const cors = require('cors');

app.use(cors());
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
/*************************************************************************************************************** */
app.get('/', (req, res) => {
  res.render('pages/index');
})

app.get('/error', (req, res) => {
  res.render('pages/error');
});

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new');
})

app.post('/searches/shows', (req, res) => {
  let search = req.body.search;
  if (req.body.searchType === 'author') {
    getBooksAuthor(res, search).then();
  }
  if (req.body.searchType === 'title') {
    getBooksTitle(res, search).then();
  }
})
/******************************************************************************************************************* */
function getBooksAuthor(res, search) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=${search}+inauthor&orderBy=newest`;
  return superagent.get(url)
    .then(data => {
      try {
        let allBooks = data.body.items.map(element => {
          return new BookAuthor(element);
        });
        res.render('pages/searches/shows', { book: allBooks });
      }
      catch (err) {
        res.redirect('../error');
      }
    })
}

function getBooksTitle(res, search) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=${search}+intitle&orderBy=newest`;
  return superagent.get(url)
    .then(data => {
      try {
        let allBooks = data.body.items.map(element => {
          console.log(element);
          return new BookTitle(element);
        });
        res.render('pages/searches/shows', { book: allBooks });
      }
      catch (err) {
        res.redirect('../error');
      }
    })
}

function BookAuthor(data) {
  this.title = data.volumeInfo.title;
  this.authors = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  this.img = data.volumeInfo.imageLinks.thumbnail;
}

function BookTitle(data) {
  this.title = data.volumeInfo.title;
  this.authors = data.volumeInfo.authors;
  this.description = data.volumeInfo.description;
  this.img = data.volumeInfo.imageLinks.thumbnail;
}

app.get('*', (req, res) => {
  res.status(404).send('This route does not exist!!');
});

app.use((error, req, res) => {
  res.status(500).send(error);
  res.render('pages/error', { err: error });
});

app.listen(PORT, () => {
  console.log(`Listening at PORT ${PORT}`);
});

