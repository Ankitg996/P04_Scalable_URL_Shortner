const express = require('express');
const app = express();
const mongoose = require('mongoose');

const bodyparser = require('body-parser');
const route = require('./routes/route');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

mongoose.connect("mongodb+srv://ankitg99641:mongo123@cluster0.zdrae.mongodb.net/Group90Database?retryWrites=true&w=majority", {useNewUrlParser: true})
.then(() => console.log("mongoDB is connected"))
.catch(err => console.log(err))

app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express is running on port ' + (process.env.PORT || 3000))
});
