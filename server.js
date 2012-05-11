var http = require('http'),
url = require('url'),
path = require('path'),
fs = require('fs'),
io = require('/root/node_modules/socket.io'),
geoip = require('/root/node_modules/geoip'),
sys = require('sys');


// create the http server
server = http.createServer(function(request, response){
    
	var uri = url.parse(request.url).pathname;
	var filename = path.join(process.cwd(), uri);
    
    // check whether the requested file exists
	path.exists(filename, function(exists) {
        
        // if the file does not exist, serve a 404 (note: not sure if this actually works...)
		if (!exists) {
			response.writeHeader(404, {'Content-Type':'text/plain'});
			response.end("Can''t find it...");
		}
        
        // serve the requested file
		fs.readFile(filename, 'binary',function(err, file){
            
            // if reading the file results in an error, serve the error
			if (err) {
				response.writeHeader(500, {'Content-Type':'text/plain'});
				response.end(err + "\n");
				return;
			}
            
            // else serve the file
			response.writeHead(200);
			response.write(file, 'binary');
			response.end();

		});
	});
});

// make the server listen on port 8080
server.listen(8080);

// create a listener attached to the server
var listener = io.listen(server);

/* listen to stdin and broadcast anything received */
process.openStdin().addListener("data", function(text) {
	listener.broadcast(text);
});


/* watch a file and broadcast any changes */
var file = '/home/green/home/public_html/ipcapture/ip.txt';
//var file = '/var/log/apache2/access.log';

// this will watch for ALL filesystem events
fs.watchFile(file, function(curr, prev) {

    console.log("it changed!");

    //console.log('the current mtime is: ' + curr.mtime);
    //console.log('the previous mtime was: ' + prev.mtime);
    
    // compare modified times to ensure we are seeing a mod, not just an access
    if (curr.mtime > prev.mtime) {
        fs.readFile(file, "binary", function(err, data) {
            
            // get the last line
            var results = data.split("\n");
            var last = results[results.length - 2];
            
            // get the ip address
            var ip = last.split(" ")[0];
            
            //console.log(ip);
            
            // get the country from the ip address
            var Country = geoip.Country;
            var country = new Country('GeoIP.dat');
            var country_obj = country.lookupSync(ip);
            
            // for the geoip module Ubuntu requires 
            // * libgeoip1
            // * libgeoip-dev
            
            //console.log(country_obj);
            
            // broadcast the new file contents
            listener.broadcast(country_obj);
        });
    }

});
