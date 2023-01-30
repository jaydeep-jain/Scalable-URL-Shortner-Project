const mongoose = require('mongoose')

const urlSchema = new mongoose.Schema({
    urlCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    longUrl: {
        type: String,
        required: true
    },

    shortUrl: {
        type: String,
        required: true,
        unique: true,
    }
},{timestamps:true});

module.exports = mongoose.model('URL', urlSchema)


  //  { urlCode: { mandatory, unique, lowercase, trim }, longUrl: {mandatory, valid url}, shortUrl: {mandatory, unique} }
