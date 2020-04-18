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

/***************************************************** Routs definitions ********************************************************** */
// Show all books chosen (get data from book table in database) when open rout '/'
app.get('/', getIndex);

// Show search form to start get the data from the api when open rout '/searches/new'
app.get('/searches/new', formSearchForABook);

// Show search results (get data from api) when opn rout '/searches/shows'
app.post('/searches/shows', showSearchBooks);

// Show full details for the selected book (get data from book table and bookshelves table) when open rout '/books/:bookId'
app.get('/books/:bookId', moreDetails);

// show data in bookshelves table when open rout 'bookshelves'
app.get('/bookshelves', bookshelves);

// Add the selected book to the database when open rout '/books'
app.post('/books', addToCollection);

// Update data for the selected book when open rout '/update/:bookId'
app.put('/update/:bookId', updateInfo);

// Delete the selected book when open rout '/delete/:bookId'
app.delete('/delete/:bookId', deleteBook);

// Rout for Errors
app.get('/error', errorHandler);

// if open a rout does not exist
app.get('*', notExist);

/***************************************************** Functions ********************************************************** */
// Show all books chosen (get data from book table in database) when open rout '/'
function getIndex(req, res) {
  let SQL = 'SELECT * FROM books ORDER BY id ASC;';
  return client.query(SQL)
    .then(results => res.render('pages/index', { books: results.rows }));
}

// show data in bookshelves table when open rout bookshelves
function bookshelves(req, res) {
  let SQL = 'SELECT * FROM bookshelves;';
  return client.query(SQL)
    .then((results) => res.render('bookshelvesData', { bookshelvesData: results.rows }));
}


// Update data for the selected book when open rout '/update/:bookId'
function updateInfo(req, res) {
  let { title, authors, description, img, isbn, bookshelf } = req.body;

  let SQL = 'UPDATE books SET title=$1,authors=$2,description=$3,img=$4,isbn=$5,bookshelf_id=(SELECT id2 FROM bookshelves where name=$6) WHERE id=$7;';
  let safeValues = [title, authors, description, img, isbn,bookshelf,req.params.bookId];
  client.query(SQL, safeValues)
    .then(res.redirect(`/books/${req.params.bookId}`))
}

// Delete the selected book when open rout '/delete/:bookId'
function deleteBook(req, res) {
  let SQL = 'DELETE FROM books WHERE id=$1';
  let value = [req.params.bookId];
  return client.query(SQL, value)
    .then(res.redirect('/'))
}


// Show search form to start get the data from the api when open rout '/searches/new'
function formSearchForABook(req, res) {
  res.render('pages/searches/new');
}

// Show search results (get data from api) when opn rout '/searches/shows'
function showSearchBooks(req, res) {
  allBooks = [];
  let search = req.body.search;
  let searchType = req.body.searchType;
  search = search.replace(' ', '%20');
  let url = `https://www.googleapis.com/books/v1/volumes?q=${searchType}:${search}`;
  return superagent.get(url)
    .then(data => {
      try {
        allBooks = data.body.items.map(element => new Book(element));
        return res.render('pages/searches/shows', { book: allBooks });
      }
      catch (err) {
        console.log(err);
        return res.redirect('../error');
      }
    })
}

// Show full details for the selected book (get data from book table and bookshelves table) when open rout '/books/:bookId'
function moreDetails(req, res) {
  let SQL1 = 'SELECT DISTINCT name FROM bookshelves;';
  let allbookshelf = [];
  client.query(SQL1)
    .then(results => allbookshelf = results.rows)

  let SQL = 'SELECT * FROM books JOIN bookshelves ON bookshelves.id2=books.bookshelf_id WHERE books.id=$1;';
  let value = [req.params.bookId];
  return client.query(SQL, value)
    .then(results => res.render('pages/books/show', { book: results.rows[0], shel: allbookshelf }));
}

// Add the selected book to the database when open rout '/books'
function addToCollection(req, res) {
  let idx = req.body.index;
  let { title, authors, description, img, isbn, bookshelf } = allBooks[idx];

  let SQL = 'INSERT INTO bookshelves (name) VALUES($1) ON CONFLICT (name) DO NOTHING;';
  let values = [bookshelf];
  client.query(SQL, values).then();

  SQL = 'INSERT INTO books (title,authors,description,img,isbn,bookshelf_id)  VALUES ($1,$2,$3,$4,$5,(SELECT id2 FROM bookshelves WHERE name =$6))';
  values = [title, authors, description, img, isbn, bookshelf];
  client.query(SQL, values).then();

  SQL = 'SELECT id FROM books WHERE title=$1;';
  values = [title];
  return client.query(SQL,values)
    .then(results => res.redirect(`/books/${results.rows[0].id}`));
}

/**************************************************Constructor function****************************************************** */
function Book(data) {
  this.title = data.volumeInfo.title || 'No Title found';
  this.authors = data.volumeInfo.authors ? data.volumeInfo.authors[0] : 'No Author found';
  this.description = data.volumeInfo.description ? data.volumeInfo.description : 'No Discription found';
  this.img = data.volumeInfo.imageLinks.smallThumbnail ? data.volumeInfo.imageLinks.smallThumbnail : 'https://via.placeholder.com/150';
  this.isbn = data.volumeInfo.industryIdentifiers[0].identifier ? data.volumeInfo.industryIdentifiers[0].identifier : '00';
  this.bookshelf = data.volumeInfo.categories ? data.volumeInfo.categories[0] : 'No type found';
}

/******************************************************** Error functions******************************************************************* */

// Rout for Errors
function errorHandler(req, res) {
  res.render('pages/error');
}

// if open a rout does not exist
function notExist(req, res) {
  res.status(404).send('This route does not exist!!');
}

app.use((error, req, res) => {
  res.status(500).send(error);
  res.render('pages/error', { err: error });
});

/***************************************************************** Connect to Database ******************************************************** */

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`);
    });
  });

