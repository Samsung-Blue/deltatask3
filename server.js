var http = require('http');
var mysql = require('mysql');
var fs = require('fs');
var url = require('url');
var formidable = require('formidable');
var bcrypt = require('bcryptjs');
var pictures =[];
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'infinity',
  port : 8801,
  database : 'users'
});
var i=0,pass=-1;
connection.connect(function(err){
	if(err)
		console.log("Error connecting to database");
	else
		console.log("Connection to database sucessful");
});
connection.query("DROP TABLE users",function(err,result){
});
connection.query("CREATE TABLE users(pass integer,username varchar(100),password varchar(100),email varchar(100),phone varchar(10))",function(err,result){
	if(err)
		console.log("Error creating table");
	else
		console.log("table created");
});
http.createServer(function(req,res){
    if(req.method.toLowerCase()==='get')
    {
      if(url.parse(req.url).pathname==='/profile')
         displayLogin(res);
      else
         displayForm(res); 
    }
    else if(req.method.toLowerCase()==='post')
        processFields(req,res);
}).listen(8081);

function displayForm(res){
    fs.readFile('index.html',function(err,data){
        res.writeHead(200,{'Content-type':'text/html','Content-length':data.length});
        res.write(data);
        res.end(); 
        });
}

function processFields(req,res){
    i=0;
    var post={
        pass:-1,
        username :'',
        password:'',
        email:'',
        phone:''
    };
    var form = new formidable.IncomingForm();
    var fields =[];
    form.on('field',function(field,value){
      fields[field]=value;
      i++;
      if(i===1)
          post.username = value;
      else if(i===2)
      {
          post.password= value;
      }
      else if(i===3)
          post.email=value;
      else if(i===4)
          post.phone = value;
      else
      {
          console.log(value);
          pictures.push(value);
          pass++;
          post.pass=pass;
      }

    });
    form.on('end',function(){
        if(i===5)
        {
            var salt = bcrypt.genSaltSync(1);
            var hash = bcrypt.hashSync(post.password,salt);
            post.password = hash;
            connection.query('INSERT INTO users SET ?',post,function(err,result){
                console.log("Inserted");
                displayForm(res);
            });
        }
        else if(i===2)
        {
          displayDetails(req,res,post);
        }
      });
    form.parse(req);
  }

function displayDetails(req,res,post)
{
  connection.query('SELECT * FROM users WHERE username=?',post.username,function(err,rows,fields){
                if(!err)
                {
                    if(rows.length>0&&bcrypt.compareSync(post.password,rows[0].password))
                    {  
                      var pathname = url.parse(req.url).pathname;
                      if(pathname==='/profile')
                      {
                        var index = rows[0].pass;
                        var path = __dirname + '/'+ pictures[index];
                        res.writeHead(200,{'Content-type':'image/png'});
                        fs.createReadStream(path).pipe(res);
                      }
                      else{
                      var index = rows[0].pass;
                      var path = __dirname + '/'+ pictures[index];
                      var body ="Username : "+rows[0].username+'\n'+"Password : " +rows[0].password+'\n'+"Email : "+rows[0].email+'\n'+"Phone : "+rows[0].phone
                      var body = '<html><head></head><body><ul><li>Username : '+rows[0].username+'</li><li>Password : '+rows[0].password+'</li><li>Email : '+rows[0].email+'</li><li>Phone : '+rows[0].phone+'</li><br><h3>Click back button to logout</h3></body>';
                      res.writeHead(200,{'Content-type':'text/html'});
                      res.write(body);
                    }
                   }
                else
                    res.end("Either Username or Password is wrong");
                }
                else
                    console.log("Error has occurred");
            });
}
function displayLogin(res){
  fs.readFile('login.html',function(err,data){
    res.writeHead(200,{'Content-type':'text/html','Content-length':data.length});
    res.write(data);
    res.end();
  });
}
console.log("Server is running at 8081");