DROP TABLE IF EXISTS books;

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    authors VARCHAR(100),
    description TEXT,
    img VARCHAR(255),
    isbn VARCHAR(255),
    bookshelf VARCHAR(255)
);

INSERT INTO books (title,authors,description,img,isbn,bookshelf) VALUES ('my book','i am author','hahahahaha','https://via.placeholder.com/150',12315,'comedy');