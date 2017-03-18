var json2csv = require('json2csv');
var s3 = require('s3');

var fs = require('fs'); // csv file

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: "AKIAJ7MBOXFDGUVAXIZQ",
    secretAccessKey: "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",
    // any other options are passed to new AWS.S3() 
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
  },
});

const RedshiftProvider = require('./../helpers/redshift_provider');
this._redshiftProvider = new RedshiftProvider('redshift://dstiefe:DavidAlex2@steeful.cdjttjnusyyn.us-east-1.redshift.amazonaws.com:5439/mytropical');

this._redshiftProvider.select('SELECT * FROM mytropical.public.coxrunstats LIMIT 100', function (rows) {
    //session.userData.prevData = JSON.stringify(rows);
    //session.send(JSON.stringify(rows));
    
    console.log('rows');
    console.log(rows);
    //next();

    var myData = rows;
    var fields = Object.keys(rows[0]);

    //console.log();

    console.log('csv');
    try {
        var csv = json2csv({ data: myData, fields: fields });
        //console.log(csv);

        var file_name = Date.now() + '-file.csv';
        var bucket = 'my_bot';
        var bucketLocation = "";
        /*
            "" (default) - US Standard
            "eu-west-1"
            "us-west-1"
            "us-west-2"
            "ap-southeast-1"
            "ap-southeast-2"
            "ap-northeast-1"
            "sa-east-1"
        */

        fs.writeFile(file_name, csv, function(err) {
        if (err) throw err;
            console.log('file saved');

            //console.log(fs);
           

            var params = {
                localFile: file_name,
                
                s3Params: {
                    Bucket: bucket,
                    Key: file_name,
                    ACL: 'public-read'
                    // other options supported by putObject, except Body and ContentLength. 
                    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
                },
            };

            var uploader = client.uploadFile(params);
            uploader.on('error', function(err) {
                console.error("unable to upload:", err.stack);
                fs.unlinkSync(file_name);
            });

            uploader.on('progress', function() {
                console.log("progress", uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
            });
            
            uploader.on('end', function() {
                console.log("done uploading");

                console.log(s3.getPublicUrl(bucket, file_name, bucketLocation));

                fs.unlinkSync(file_name);
            });

        });
    } catch (err) {
    // Errors are thrown for bad options, or if the data is empty and no fields are provided. 
    // Be sure to provide fields if it is possible that your data array will be empty. 
    console.error(err);
    }
    
    

    return;
});