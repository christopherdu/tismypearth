// Import ALL the modules
const places = require('./places.json');
const download = require('image-downloader');
const request = require('request');
const Twitter = require('twitter');

/*
    Call our API endpoints to retrieve data
*/
function getData(url) {
    return new Promise((resolve, reject) => {
        request(url.imgURL, (error, response, body) => {
            if(error) {
                reject(error);
            } else {
                const data = url;
                data["body"] = body;
                resolve(data);
            }
        });
    });
}

/*
    Get the desired image URL.
    const getLocation = Get a random sub object from the places JSON object
    const ran = A random element from within the sub oject
    const imgURL = Our URL used to search for the image we want.

*/
function getImgURL() {
    const getLocation = Object.keys(places)[Math.floor(Math.random() * 7)];
    const ran = Math.floor(Math.random() * (places[getLocation].length));
    const imgURL = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=6bdb82beef6144523581b81cd724202a&tags=${places[getLocation][ran].name}&content_type=1&safe_search=1&sort=interestingness-desc&license=1&format=json&nojsoncallback=1&per_page=20`;
    const data = {
        imgURL: imgURL,
        location: places[getLocation][ran]
    }

    return new Promise((resolve, reject) => {
        resolve(data);
        reject("Something went wrong");
    })
}

/* 
    Grab the publisher of the image we've selected, grabbing both their username and Flickr profile url
    Return an array that contains the publisher's username, profile, and the original object of our image
*/
function getImgOwner(data) {
    const userId = data.body.owner;
    return  new Promise((resolve, reject) => {
        request(`https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=6bdb82beef6144523581b81cd724202a&user_id=${userId}&format=json&nojsoncallback=1`, (error, response, body) => {
            if(error) {
                reject(error);
            } else {
                const obj = data;

                const res = JSON.parse(body);
                const user = res.person.username._content;
                const profile = res.person.profileurl._content;
                const content = [user, profile];
                
                obj["content"] = content;
                resolve(obj);
            }
        })
    })
}

function uploadImg(res) {
    const client = new Twitter({
        consumer_key: 'eX6nSVXpSmejEBWJYGPe4FepT',
        consumer_secret: 'yFXBv5YxHgcQN91WA5vwA176ptt4mO5b7B0mVcI65ce04g0Vyr',
        access_token_key: '4429661560-tbobUvkAhbgbxuzr8zwWcwcEeUhj0WfZ8mpSRv7',
        access_token_secret: 'zrIJnq6fJOhMH6XVdlCRuVS8glplRN1w40UlzkwAhRcQP',
    });

    // Load the image
    const data = require('fs').readFileSync('app/img/img.jpg');

    // Make post request on media endpoint. Pass file data as media parameter
    return new Promise((resolve, reject) => {
        client.post('media/upload', {media: data}, (error, media, response) => {
            if (!error) {
                let obj = res;
                obj["media_id"] = media.media_id;
                resolve(obj);
            } else {
                reject(error);
            }
        });
    })

}

function postTweet(data) {
    
    client.post('statuses/update', {status:``, media_ids:`${data[3]}`})
}

getImgURL().then(res => {
    // Get the image from the Flickr API
    return getData(res); 
}).then(res => {
     // Parse the response from the API call into a JSON object
     const body = JSON.parse(res.body);
     // Get a random number between 0 and the length of the sub-object within the JSON object
     const num = Math.floor(Math.random() * body.photos.photo.length);
     // Set variable to get the content we need
     const inner = body.photos.photo[num];
     //set body in our object to equal to inner
     res.body = inner;
     // Download the image to /app/img rename it to img.jpg
     // Set the options required to download the file
     const options = {
         url: `https://farm${inner.farm}.staticflickr.com/${inner.server}/${inner.id}_${inner.secret}_h.jpg`,
         dest: './app/img/img.jpg'
     }

     // Download the actual image
     download.image(options)
     .then((filename, image) => {
         console.log('File saved to', filename);
     })
     .catch(err => console.log(err));
    
     return getImgOwner(res);
}).then(res => {
    console.log(res);
      return uploadImg(res)
 })//.then(res => {
//     postTweet(res)
// }).catch(err => console.error(err));




