const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const md5 = require("md5");
const passwordValidator = require("password-validator");

const multer = require('multer');
const path = require('path');
const helpers = require('./helpers');
const XLSX = require("xlsx");
const fs = require("fs");
const request = require('request')
//const alert = require('alert');
const dialog = require("dialog");

var schema = new passwordValidator();
schema.is().min(6).has().uppercase().has().lowercase().has().digits(1)

const app = express();
app.use("/assets", express.static("assets"));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root123",
    database: "nodejs"
});

// connect to the database
connection.connect(function (error) {
    if (error) throw error
    else console.log("connected to the database successfully!")
});


app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index_two.html");
})

app.post("/", encoder, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    if (schema.validate(password)) {
        // console.log("true")
        var hashedLoginPwd = md5(password);

        connection.query("select * from loginuser where user_name = ? and user_pass = ?",
            [username, hashedLoginPwd], function (error, results, fields) {
                if (results.length > 0) {
                    res.redirect("/upload");
                } else {
                    // alert('Please register First')
                    //dialog.info("please register")
                    dialog.warn("Couldn't find your account, check your credentials or register", "Incorrect credentials", function () { })
                    res.redirect("/");
                    console.log("incorrect credentials");
                }
                res.end();
            })
    } else {
        console.log("Password rules not followed")
        // popup.alert({
        //     content : "Password conditions not followed"
        // })
    }



})
//register
app.post("/register", encoder, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;


    if (schema.validate(password)) {
        var hashedPwd = md5(password)

        connection.query("INSERT INTO loginuser(user_name, user_pass, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
            [username, hashedPwd, email, firstName, lastName], function (err, results) {
                //console.log(results)
                if (err) {
                    dialog.warn("There was an error", "Please try again", function () { })
                    console.log("there was an error")
                    throw err;
                } else {
                    dialog.info("Thank you for registering","Welcome",function(){
                        res.redirect("/upload");
                    })
                    console.log("1 record inserted");
                }
                res.end();
            })
    } else {
        console.log("register - pwd rules not followed")
    }

})

//upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },

    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

app.post("/upload", (req, res) => {

    let upload = multer({ storage: storage, fileFilter: helpers.file_Filter }).single('user_file');
    // console.log("in post upload")
    upload(req, res, function (err) {
        // console.log("REQUEST FILE-------------")
        // console.log(req.file)
        // console.log("REQUEST BODY------------")
        // console.log(req.body)
        if (req.fileValidationError) {
            //return res.send(req.fileValidationError);
            dialog.warn("Only .xlsx files are allowed!","Incorrect File Format")
        }
        else if (!req.file) {
            //return res.send('Please select a file to upload');
            dialog.warn("Please select a file to upload", "No file selected", function () {
                res.redirect('/upload')
             })
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        } else {

            dialog.info("Your file has been uploaded","Thanks!")
        //console.log("Your file has been uploaded")
            console.log(req.file.path);

            //to json
            var workbook = XLSX.readFile(req.file.path);
            var sheet_name_list = workbook.SheetNames;
            // console.log(workbook)
            // console.log(sheet_name_list); // getting as Sheet1

            sheet_name_list.forEach(function (y) {
                var worksheet = workbook.Sheets[y];
                //getting the complete sheet
                // console.log(worksheet);

                var headers = {};
                var data = [];
                for (z in worksheet) {
                    if (z[0] === "!") continue;
                    //parse out the column, row, and value
                    var col = z.substring(0, 1);
                    // console.log(col);

                    var row = parseInt(z.substring(1));
                    // console.log(row);

                    var value = worksheet[z].v;
                    // console.log(value);

                    //store header names
                    if (row == 1) {
                        headers[col] = value;
                        // storing the header names
                        continue;
                    }

                    if (!data[row]) data[row] = {};
                    data[row][headers[col]] = value;
                }
                //drop those first two rows which are empty
                data.shift();
                data.shift();
                console.log(data);

                sdata = JSON.stringify(data, null, 2)
                // console.log(sdata);


                // request.post(
                //     // url,

                //     {
                //         json: {sdata},
                //     },
                //     (error, res, body) => {
                //         if (error) {
                //             console.log(error)
                //             return
                //         }
                //         console.log(`statusCode: ${res.statusCode}`)
                //         console.log(body)

                //     }
                // )


                var jname = (req.file.filename).split('.').slice(0, -1).join('.') + ".json";
                console.log(jname);

                fs.writeFile("uploads//" + jname, sdata, finished);//
                function finished(err) {
                    console.log('all set.')
                }

                //    request.post({
                //        url : '',
                //        body : sdata,
                //        json : true
                //    }, function(error, response, body){
                //        console.log(body);
                //    }) 


            });


            res.redirect("/transaction")
            }

    });
});



// // when login is successfull
app.get("/upload", function (req, res) {
    res.sendFile(__dirname + "/upload.html")
    // console.log("in get upload")
})

app.get("/register", function (req, res) {
    res.sendFile(__dirname + "/register.html")
})

app.get("/index_two", function (req, res) {
    res.sendFile(__dirname + "/index_two.html")
})

app.get("/transaction", function (req, res) {
    res.sendFile(__dirname + "/transaction.html")
})

app.listen(4000, function () {
    console.log("listening on port 4000 ")
});