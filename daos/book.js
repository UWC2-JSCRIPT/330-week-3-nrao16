const mongoose = require('mongoose');

const Book = require('../models/book');
const author = require('../models/author');

module.exports = {};

// get all books by authorId or search term - if neither given then get all books
module.exports.getAll = (authorId, query, page, perPage) => {
  if (authorId) {
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return null;
    }
    return Book.find({ authorId: new mongoose.Types.ObjectId(authorId) }).limit(perPage).skip(perPage * page).lean();
  }
  // search in text index
  if (query) {
    return Book.find({
      $text: { $search: query }
    },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(perPage).skip(perPage * page).lean();

  }
  return Book.find().limit(perPage).skip(perPage * page).lean();

}

// get book stats by author Id
module.exports.getStatsByAuthorId = (authorInfo) => {

  //TODO - fix this
  if(authorInfo) {
    return Book.aggregate([{$lookup: { from: "authors", localField: "authorId", foreignField:"_id", as: "author"} } ]);
  }
  return Book.aggregate([
    { $group: {_id: "$authorId", numBooks: { $count: {} },  averagePageCount: { $avg: "$pageCount"}, titles: { $addToSet: "$title" } } },
    { $project: { authorId: "$_id", _id: 0, numBooks: 1, averagePageCount: 1, titles: 1 }}, 
    { $sort: { title: -1 } } ]);
}

module.exports.getById = (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }
  return Book.findOne({ _id: bookId }).lean();
}

module.exports.deleteById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.deleteOne({ _id: bookId });
  return true;
}

module.exports.updateById = async (bookId, newObj) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.updateOne({ _id: bookId }, newObj);
  return true;
}

module.exports.create = async (bookData) => {
  try {
    const created = await Book.create(bookData);
    return created;
  } catch (e) {
    if (e.message.includes('validation failed') || e.message.includes('dup key')) {
      throw new BadDataError(e.message);
    }
    throw e;
  }
}

class BadDataError extends Error { };
module.exports.BadDataError = BadDataError;