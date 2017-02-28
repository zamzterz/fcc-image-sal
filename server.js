'use strict';

const express = require('express');
const Bing = require('bing.search');
const mongo = require('mongodb').MongoClient;

let search = new Bing(process.env.BING_ACCOUNT_KEY);

let app = express();
app.set('json spaces', 2);

app.get('/imagesearch', (req, res) => {
  let query = req.query.q;
  if (!query) {
    return res.status(400).end('Include query param \'q\' with search query');
  }
  let offset = Number(req.query.offset) || 0;

  search.images(query, {'top': 10, 'skip': offset}, (err, results) => {
    if (err) {
      return err.status(500).end(err.toString);
    }

    let filteredResults = results.map((value) => {
      return {
        'img_url': value.url,
        'page_url': value.sourceUrl,
        'text': value.title
      };
    });

    mongo.connect(process.env.DB_URI, (err, db) => {
      db.collection('img-search-strings').insertOne(req.query,
        (err, result) => {
          db.close();
        }
      );
    });
    res.json(filteredResults);
  });
});

app.get('/imagesearch/latest', (req, res) => {
  mongo.connect(process.env.DB_URI, (err, db) => {
    if (err) {
      return res.status(500).end('Could not get the latest searches.');
    }

    db.collection('img-search-strings').find(null, {'_id': 0}).sort({ _id : -1 }).limit(10).toArray((err, results) => {
      res.json(results);
    });
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});