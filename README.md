# ![cam icon](halCam.png)HAL-loCam 

##Obstacles:
There were a lot of moving parts to this project. I figure the best approach is to take it one milestone at a time.

###1. Finding resources to work with:
First issue was not having the right equipment (some IP cameras don't give me the necessaary information I need, e.g. FOSCam cameras didn't provide IP address or other ways to extract information. They were limited by their app). Eventually, I did find a website that has a "still image feed" here:
https://www.cedarpoint.com/online-fun/live-video-cam

To capture the images say every 8 seconds, I used setInterval which looks like this:
```javascript
var i = 0;
setInterval(function() {
  request('http://192.168.1.112/tmpfs/auto.jpg').pipe(fs.createWriteStream('DCCam'+i+'.png'));
  i++;
}, 8000);
```

###2. Uploading files to MongoDB
On my research, I learned about [GridFS](http://excellencenodejsblog.com/gridfs-using-mongoose-nodejs/). To summarize as files are uploaded they are split into 2 chunks: one to store metadata the other to store the files as a "chunk." With the limitation of how much memory I have in the database, I realize to do a videostream would take up too much memory. So, I opted for still images instead, leading me to ditch GridFS.

When images are stored to something like MongoDB, they aren't stored as actual images. Instead, they're stored as either binary or "buffers." To convert the buffers to images on the front end, it'll invole 'base64':

**Backend**
```javascript
app.get('/images', function(request, response, next) {
  Image.find()
  .then(function(images) {
    images = images.map(function(image) {
      return {
        timestamp: image.timestamp,
        data: image.data.toString('base64')
      };
    });
    response.json(images);
  })
  .catch(next);
});
```

IMPORTANT: when working with base64 conversion, you'll encounter errors in the browser console that mentions how "unsafe" the urls are. To sanitize the image links, it'll look like this:
>imgSrcSanitizationWhitelist([regexp]); 

*from https://docs.angularjs.org/api/ng/provider/$compileProvider

With the way my code was written, I had to chop some things out to make it less specific. I made the parameter below match up to exclusively the image instead of factoring other possible parameters like links.
**Frontend: AngularJS**
```javascript
app.config(function($compileProvider){
  $compileProvider.imgSrcSanitizationWhitelist(/^data:image/);
});
```

>"Retrieves or overrides the default regular expression that is used for whitelisting of safe urls during img[src] >sanitization.
>The sanitization is a security measure aimed at prevent XSS attacks via html links.

>Any url about to be assigned to img[src] via data-binding is first normalized and turned into an absolute url. Afterwards, >the url is matched against the imgSrcSanitizationWhitelist regular expression. If a match is found, the original url is >written into the dom. Otherwise, the absolute url is prefixed with 'unsafe:' string and only then is it written into the DOM.

For more information on [Base-64 encoding images in Node.js visit](http://nodeexamples.com/2012/09/26/base-64-encoding-images-in-node-js/)
