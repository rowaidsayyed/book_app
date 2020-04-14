'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');
const app = express();
const pg = require('pg');


const client = new pg.Client(process.env.DATABASE_URL);
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
var allBooks = [];
var count = 0;


/*************************************************************************************************************** */
app.get('/', getIndex);

app.get('/searches/new', formSearchForABook);

app.post('/searches/shows', showSearchBooks);

app.get('/books/:bookId', moreDetails);

app.post('/books', addToCollection);

app.get('/error', errorHandler);

app.get('*', notExist);

app.put('/update/:bookId', updateInfo);
app.delete('/delete/:bookId', deleteBook);
/******************************************************************************************************************* */
function updateInfo(req, res) {
  console.log(req.body);
  let { title, authors, description, img, isbn, bookshelf } = req.body;
  let SQL = 'UPDATE books SET title=$1,authors=$2,description=$3,img=$4,isbn=$5,bookshelf=$6 WHERE id=$7;';

  let safeValues = [title, authors, description, img, isbn, bookshelf, req.params.bookId];
  client.query(SQL, safeValues)
    .then(res.redirect(`/books/${req.params.bookId}`))

}

function deleteBook(req, res) {
  count--;
  let SQL = 'DELETE FROM books WHERE id=$1';
  let value = [req.params.bookId];
  client.query(SQL, value)
    .then(res.redirect('/'))
}

function getIndex(req, res) {
  let SQL = 'SELECT * FROM books ORDER BY id ASC;';
  client.query(SQL)
    .then(results => {
      count = results.rows.length;
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
      }
      catch (err) {
        console.log(err);
        res.redirect('../error');
      }
    })
}

function moreDetails(req, res) {

  let SQL1 = 'SELECT DISTINCT bookshelf FROM books;';
  // let value1 = [req.params.bookId];
  let all=[];
  client.query(SQL1)
    .then(results => {
      // console.log('firrrrrrrrrst',results.rows);
      return results.rows;
    }).then(x => all=x )

  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let value = [req.params.bookId];
  client.query(SQL, value)
    .then(results => {
      // console.log(all);
      res.render('pages/books/show', { book: results.rows[0],shel:all});
    });
}

function addToCollection(req, res) {
  let idx = req.body.index;
  count++;
  let { title, authors, description, img, isbn, bookshelf } = allBooks[idx];
  let SQL = 'INSERT INTO books (title,authors,description,img,isbn,bookshelf)  VALUES ($1,$2,$3,$4,$5,$6)';
  let safeValues = [title, authors, description, img, isbn, bookshelf];
  client.query(SQL, safeValues).then(() => {
    res.redirect(`/books/${count}`);
  });

}

function errorHandler(req, res) {
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


function notExist(req, res) {
  res.status(404).send('This route does not exist!!');
}

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

