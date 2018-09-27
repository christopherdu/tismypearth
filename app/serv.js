// Import ALL the modules
const places = require('./places.json');
const download = require('image-downloader');
const request = require('request');
const Twitter = require('twitter');
const fs = require('fs');

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
    If something goes wrong with retrieving data, run this function
*/
function getDataFallback(url) {
    return new Promise((resolve, reject) => {
        request(url[0], (error, response, body) => {
            if(error) {
                reject
            } else {
                console.log("this is getDataFallback\n");
                const data = url[1];
                data["body"] = body;
                resolve(data);
            }
        });
    })
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
    const imgURL = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=&tags=${places[getLocation][ran].name}&content_type=1&safe_search=1&sort=interestingness-desc&privacy_filter=1&format=json&nojsoncallback=1&per_page=20`;
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
        request(`https://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=&user_id=${userId}&format=json&nojsoncallback=1`, (error, response, body) => {
            if(error) {
                reject(error);
            } else {
                const obj = data;

                const res = JSON.parse(body);
                const user = res.person.username._content;
                const profile = res.person.profileurl._content;
                const content = [user, profile];
                
                obj["content"] = content
                resolve(obj);
            }
        })
    })
}

/* 
    Download the image to local storage
*/
function downloadImg(res) {
    // Parse the response from the API call into a JSON object
    const body = JSON.parse(res.body);
    // Get a random number between 0 and the length of the sub-object within the JSON object
    const num = Math.floor(Math.random() * body.photos.photo.length);
    // Set variable to get the content we need
    const inner = body.photos.photo[num];
    // console.log(inner);
    //set body in our object to equal to inner
    res.body = inner;

    // Download the image to /app/img rename it to img.jpg
    // Set the options required to download the file
    const options = {
        url: `https://farm${inner.farm}.staticflickr.com/${inner.server}/${inner.id}_${inner.secret}_b.jpg`,
        dest: './app/img/img.jpg'
    }
    // Download the actual image
    download.image(options)
        .then((filename, image) => {
            console.log('File saved to', filename);
        })
    
    return new Promise((resolve,reject) => {
        resolve(res);
        reject(console.log(err));
    })
}

/* 
    Upload the downloaded image to Twitter services to receive a media_id to attach to the tweet
*/
function uploadImg(res) {
    console.log("This is the uploadImg function -- "+ res);
    const client = new Twitter({
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: '',
    });

    // Load the image
    const data = fs.readFileSync('app/img/img.jpg');

    // Make the POST request on media endpoint. Pass file data as media parameter
    if(fs.existsSync('app/img/img.jpg')) {
        return new Promise((resolve, reject) => {
            client.post('media/upload', {media: data}, (error, media, response) => {
                if (!error) {
                    const obj = res;
                    obj["media_id"] = media.media_id_string;
                    console.log(obj);
                    resolve(obj);
                } else {
                    reject(error);
                }
            });
        })
    }
}

function postTweet(data) {
    console.log("This is the postTweet function -- " + data);
    const hashloc  = data.location.Country.split(' ').join('');
    

    const client = new Twitter({
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: '',
    });

    //📷
    client.post('statuses/update', {status:`${data.location.name}, ${data.location.Country}\n\n${data.body.title}\n\r📷 by ${data.content[0]}\n\r${data.content[1]}\n\r#earth #travel #photography #${hashloc}`, media_ids:`${data.media_id}`}, (error, tweet, response) => {
        if(!error) {
            console.log(tweet);
        } else {
            console.log(error);
        }
    });
}

function delImg() {
    fs.unlink('app/img/img.jpg', err => {
        if (err){
            console.log(err);
        } else {
            console.log('app/img/img.jpg was deleted!');
        }
    })
}

getImgURL().then(res => {
    // Get the image from the Flickr API
    return getData(res); 
    }).then(res => {
        return downloadImg(res);
    }).then(res => {
        return getImgOwner(res);
    }).then(res => {
        return uploadImg(res);
    }).then(res => {
        postTweet(res)
    }).catch(err => console.error(err));

    // Delete the image from local storage after 4 seconds
    // Used to ensure the image is uploaded prior to deletig the image 
    // and to ensure the right image is uploaded
    setTimeout(() => {
        delImg();
    }, 4000)




