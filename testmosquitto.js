const mongoose = require('mongoose/');
const options = {
    user: 'admin',
    pass: '5617091',
    "auth": { "authSource": "admin" },
    useNewUrlParser: true,
    useUnifiedTopology: true
};

function callback(err, result) {
    if (err) {
        throw err;
    }
}

mongoose.connect("mongodb://192.168.1.54/finalproject", options, callback);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("mongo has connected");
    // define Schema
    var BookSchema = mongoose.Schema({
        name: String,
        price: Number,
        quantity: Number,
        copy: Object
    });

    // compile schema to model
    var Book = mongoose.model('Book', BookSchema, 'bookstore');

    // a document instance
    var book = new Book({ name: 'Introduction to Mongoose', price: 10, quantity: 25 });
    var book1 = new Book({ name: 'Introduction to Mongoose', price: 10, quantity: 25, copy: book });

    //console.log(Object(book1));

    // save model to database
    book1.save(function (err, book) {
        if (err) return console.error(err);
        console.log(book.name + " saved to bookstore collection.");
    });
});