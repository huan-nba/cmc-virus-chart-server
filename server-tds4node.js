var express = require('express'),
  bodyParser = require('body-parser'),
  app = express(),
  crypto = require('crypto'),
  generatedTokens = [],
  http = require('http'),
  compression = require('compression'),
//  serverUrl = 'http://localhost:8888/';
  serverUrl = 'http://subnet2.noip.me:8888/';


var getDataWithQuery = function (query, callback) {
  http.get(serverUrl + 'tds?' + query, function(res) {
//    console.log("Got response: " + res.statusCode);
    var str = '';
    res.on('data', function (chunk) {
      str += chunk;
    });
    res.on('end', function () {
      var rawData = JSON.parse(str).result[0];
      var data = rawData.rows.map(function (row) {
        var obj = {};
        rawData.colData.forEach(function (val, index) {
          var columnName = val.value;
          obj[columnName] = row[index];
        });
        return obj;
      });
      if (callback) {
        callback(data);
      }
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    if (callback) {
      callback('Error:' + e.message);
    }
  });
};

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.all("/*", function (req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST');
  return next();
});

/*
 Precheck access to all api routes and block if valid token not presented
 */
app.post('/api/*', function (req, res, next) {
  if (validTokenProvided(req.body.token)){
    return next();
  }
  else {
    res.status(401).send();
    return;
  }

});

var generateToken = function () {
  var token = crypto.randomBytes(48).toString('hex');
  generatedTokens.push(token);

  return token;
};

var validTokenProvided = function(token) {
  console.log('requested with token = ' + token);
//  return true;
  if (token && generatedTokens.indexOf(token) > -1) {
    return true;
  }
  else return false;
};

app.post('/auth.json', function (req, res) {
  var username = encodeURIComponent(req.body.username);
  var password = encodeURIComponent(req.body.password);
  getDataWithQuery("select top 1 * from users where username = '"+username+"' and password = '"+password+"'",
    function (data) {
      console.dir(data);
      if (data.length > 0)
      {
        res.send({token: generateToken()});
      }
      else
        res.status(401).send();
    });
});

app.post('/api/server-clients-count.json', function (req, res) {
  getDataWithQuery("select * from vw_server_clients_count",
    function (data) {
      res.send(data);
    });
});

app.post('/api/server-status.json', function (req, res) {
  getDataWithQuery("select * from vw_data_status",
    function (data) {
      res.send(data);
    });
});

app.post('/api/all-infected-tables.json', function (req, res) {
  getDataWithQuery("select * from vw_all_infected_tables",
    function (data) {
      res.send(data);
    });
});

app.post("/api/all-restrictedareas-tables.json", function (req, res) {
  getDataWithQuery("select * from vw_all_restrictedareas_tables",
    function (data) {
      res.send(data);
    });
});

app.post("/api/restrictedareas-latest.json", function (req, res) {
  getDataWithQuery("exec restrictedareas_latest",
    function (data) {
      res.send(data);
    });
});

app.post("/api/infected-latest.json", function (req, res) {
  getDataWithQuery("exec infected_latest",
    function (data) {
      res.send(data);
    });
});


app.post('/api/server-infected-clients-lastest.json', function (req, res) {
  getDataWithQuery("exec server_with_infected_clients_lastest",
    function (data) {
      res.send(data);
    });
});

app.post('/api/top-10-infected-clients-lastest.json', function (req, res) {
  getDataWithQuery("exec top_10_infected_clients_lastest",
    function (data) {
      res.send(data);
    });
});

app.post('/api/top-10-infected-lastest.json', function (req, res) {
  getDataWithQuery("exec top_10_infected_lastest",
    function (data) {
      res.send(data);
    });
});

app.post('/api/infected-in-month-year.json', function (req, res) {
  if (req.body.month && req.body.year) {
//    console.log('before query sql infected-in-month-year');
    getDataWithQuery("exec infected_in_month_year " + req.body.month + ", " + req.body.year,
      function (data) {
        res.send(data);
      });
  } else {
    res.status(400).send();
  }

});

app.post('/api/restrictedareas-in-year.json', function (req, res) {
  if (req.body.year) {
//    console.log('before query sql infected-in-month-year');
    getDataWithQuery("exec restrictedareas_in_year " + req.body.year,
      function (data) {
        res.send(data);
      });
  } else {
    res.status(400).send();
  }

});

app.post('/api/get-clients.json', function(req, res){
  getDataWithQuery("select * from vw_clients",
    function(data){
      res.send(data);
    });
});


console.log('Server started listening on port 8080...');
app.listen(8080);

//app.post('/get-tables', function(request, response){
//  getDataWithQuery("SELECT TABLE_NAME FROM INFORMATION_SCHEMA." +
//      "TABLES WHERE TABLE_TYPE = 'BASE TABLE' ",
//      function(data){
//        response.send(data);
//      });
//});




//sql.connect(sqlConfig, function (err) {
//  var request = new sql.Request();
//  request.input('input_parameter', sql.Int, 3);
//  request.output('output_parameter', sql.VarChar(50));
//  request.execute('procedure_name', function (err, recordsets, returnValue) {
//    // ... error checks
//    console.dir(recordsets);
//  });
//});
