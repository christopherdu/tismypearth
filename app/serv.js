// Import JSON that has our beautiful places on Earth
const places = require('./places.json');
const download = require('image-downloader');
const request = require('request');

/*
    Call our API endpoints to retrieve data
*/
function getData(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if(error) {
                reject(error);
            } else {
                resolve(response);
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
    const imgURL = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=6bdb82beef6144523581b81cd724202a&tags=${places[getLocation][ran].name}&content_type=1&format=json&nojsoncallback=1&per_page=15`;

    return new Promise((resolve, reject) => {
        resolve(imgURL);
        reject("Something went wrong");
    })
}

/* 
    Grab the publisher of the image we've selected, grabbing both their username and Flickr profile url
    Return an array that contains the publisher's username, profile, and the original object of our image
*/
function getImgOwner(data) {
    const userId = data.owner;
    return  new Promise((resolve, reject) => {
        request(`https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=6bdb82beef6144523581b81cd724202a&user_id=${userId}&format=json&nojsoncallback=1`, (error, response, body) => {
            if(error) {
                reject(error);
            } else {
                const res = JSON.parse(body);
                const user = res.person.username._content;
                const profile = res.person.profileurl._content;
                const content = [data, user, profile];
                resolve(content);
            }
        })
    })
    
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
    
    return getImgOwner(body.photos.photo[num]);
})
// .then(res => {
//     console.log(res);
    
// })




