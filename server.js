'use strict';

require('dotenv').config();

const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();
const superagent = require('superagent');
const pg = require('pg');
// const cors = require('cors');
const client = new pg.Client(process.env.DATABASE_URL);
// app.use(cors());
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
var allBooks = [];
var count =0;

/*************************************************************************************************************** */
app.get('/', getIndex);

app.get('/searches/new', formSearchForABook);

app.post('/searches/shows', showSearchBooks);

app.get('/books/:bookId', moreDetails);

app.post('/books', addToCollection);

app.get('/error', errorHandler);

/******************************************************************************************************************* */
function getIndex(req, res) {
  let SQL = 'SELECT * FROM books;';
  client.query(SQL)
    .then(results => {
      count = results.rows.length;
      // console.log(count,'allllllllllllllll');
      res.render('pages/index', { books: results.rows });
    });
}

function formSearchForABook(req, res) {
  res.render('pages/searches/new');
}

function showSearchBooks(req, res) {
  allBooks = [];
  let search = req.body.search;
  let searchType = req.body.searchType;
  search = search.replace(' ', '%20');
  let url = `https://www.googleapis.com/books/v1/volumes?q=${searchType}:${search}`;
  return superagent.get(url)
    .then(data => {
      try {
        allBooks = data.body.items.map(element => {
          return new Book(element);
        });
        res.render('pages/searches/shows', { book: allBooks });
        // allBooks.forEach(e => {
        //   let SQL = 'INSERT INTO books (title,author,discription,img)  VALUES ($1,$2,$3,$4)';
        //   let safeValues = [e.title, e.authors, e.description, e.img];
        //   client.query(SQL, safeValues).then();
        // })
      }
      catch (err) {
        console.log(err);
        res.redirect('../error');
      }
    })
}

function moreDetails(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let value = [req.params.bookId];
  client.query(SQL, value)
    .then(results => {
      res.render('pages/books/show', { book: results.rows[0] });
    });

}

function addToCollection(req, res) {
  let idx = req.body.index;
  // console.log(count,'vefooooooore');
  count++;
  // console.log(count,'affffffffffffffffffffter');
  // console.log(req.body.index, allBooks[idx]);
  let { title, authors, description, img, isbn, bookshelf } = allBooks[idx];
  let SQL = 'INSERT INTO books (title,authors,description,img,isbn,bookshelf)  VALUES ($1,$2,$3,$4,$5,$6)';
  let safeValues = [title, authors, description, img, isbn, bookshelf];
  client.query(SQL, safeValues).then(() =>{
    res.redirect(`/books/${count}`);
    // res.render('pages/books/show', { book: allBooks[idx] });
  });

}

function errorHandler(req, res){
  res.render('pages/error');
}


function Book(data) {
  this.title = data.volumeInfo.title || 'No Title found';
  this.authors = data.volumeInfo.authors ? data.volumeInfo.authors[0] : 'No Author found';
  this.description = data.volumeInfo.description ? data.volumeInfo.description : 'No Discription found';
  this.img = data.volumeInfo.imageLinks.smallThumbnail ? data.volumeInfo.imageLinks.smallThumbnail : 'https://via.placeholder.com/150';
  this.isbn = data.volumeInfo.industryIdentifiers[0].identifier ? data.volumeInfo.industryIdentifiers[0].identifier : '00';
  this.bookshelf = data.volumeInfo.categories ? data.volumeInfo.categories[0] : 'No type found';
}

app.get('*', (req, res) => {
  res.status(404).send('This route does not exist!!');
});

app.use((error, req, res) => {
  res.status(500).send(error);
  res.render('pages/error', { err: error });
});

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`);
    });
  });

