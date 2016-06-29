var http = require('http');
var mysql = require('mysql');
var fs = require('fs');
var url = require('url');
var path = require('path');
var formidable = require('formidable');
var bcrypt = require('bcryptjs');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'infinity',
  port : 8801,
  database : 'users'
});
var i=0;
connection.connect(function(err){
	if(err)
		console.log("Error connecting to database");
	else
		console.log("Connection to database successful");
});
connection.query("DROP TABLE users",function(err,result){
});
connection.query("CREATE TABLE users(path varchar(200),username varchar(100) NOT NULL UNIQUE,password varchar(100) NOT NULL,email varchar(100) NOT NULL,phone varchar(10) NOT NULL)",function(err,result){
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
    var post={
        path : '',
        username :'',
        password:'',
        email:'',
        phone:''
    };
    var confirm='';
    i=0;
    var fields=[];
    var form = new formidable.IncomingForm();
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
          confirm=value;
      else if(i===4)
        post.email=value;
      else if(i===5)
          post.phone = value;
    });
    form.on('file',function(name,file){
      console.log(file);
      if(file.name==='')
         post.path=__dirname+'/noprofile.jpg';
      else
        post.path=file.path;
       });
    form.on('end',function(){
        if(i===5)
        {
            if(post.username!==''&&post.passowrd!==''&&post.password===confirm)
            {
            var salt = bcrypt.genSaltSync(1);
            var hash = bcrypt.hashSync(post.password,salt);
            post.password = hash;
            connection.query('INSERT INTO users SET ?',post,function(err,result){
                console.log("Inserted");
                displayForm(res);
            });
          }
              else if(post.username===''||post.passowrd==='')
              {
                res.end("Username and Password field should not be left blank");
              }
              else {
                res.end("Check / Re-enter your password");
              }
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
                       if(rows[0].path==='')
                       {
                        res.end("Some error has occurred");
                      }
                      else{
                        var img = fs.readFileSync(rows[0].path);
                        var contenttype = check(rows[0].path);
                        res.writeHead(200, {'Content-Type': contenttype });
                        res.end(img, 'binary');
                      }
                      }
                      else{
                      var body = '<html><head></head><body><ul><li>Username : '+rows[0].username+'</li><li>Email : '+rows[0].email+'</li><li>Phone : '+rows[0].phone+'</li><br><a href="http://localhost:8081" style="text-decoration:none;color:black"><div style="background-color:pink;padding-top:10px;height:35px;width:100px;text-align:center;border-radius:5px;">Logout</div></a></body>';
                      res.writeHead(200,{'Content-type':'text/html'});
                      res.write(body);
                    }
                   }
                else
                    res.end("Either Username or Password is wrong");
                }
                else
                    res.end("Some Error has occurred");
            });
}
function displayLogin(res){
  fs.readFile('login.html',function(err,data){
    if(!err)
    {
    res.writeHead(200,{'Content-type':'text/html','Content-length':data.length});
    res.write(data);
    res.end();
  }
  else
    res.end("Some error has occurred");
  });
}
function check(givenPath)
{
  if(path.extname(givenPath)==='.jpg')
    return "image/jpg";
  else if(path.extname(givenPath)==='.png')
    return "image/png";
  else if(path.extname(givenPath)==='.gif')
    return "image/gif";
  else if(path.extname(givenPath)==='.bmp')
    return "image/bmp";
  else 
    return "image/png";
}
console.log("Server is running at 8081");