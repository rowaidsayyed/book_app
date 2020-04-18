-- first step craet a copy for the whole database

DROP TABLE IF EXISTS BOOKSHELVES CASCADE;

CREATE TABLE BOOKSHELVES (id2 SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE); 

INSERT INTO bookshelves(name) SELECT DISTINCT bookshelf FROM books; 

ALTER TABLE books ADD COLUMN bookshelf_id INT; 

UPDATE books SET bookshelf_id=shelf.id2 FROM (SELECT * FROM bookshelves) AS shelf WHERE books.bookshelf = shelf.name; 

ALTER TABLE books DROP COLUMN bookshelf;

ALTER TABLE books ADD CONSTRAINT fk_bookshelves FOREIGN KEY (bookshelf_id) REFERENCES bookshelves(id2); 