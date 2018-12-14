const cloudinary = require('cloudinary');

let main= async function() {
  console.log(`XXX Start!`);
  if (process.env.CLOUDINARY_SECRET !== undefined && process.env.CLOUDINARY_SECRET.length > 0) {
    cloudinary.config({
      cloud_name: 'xinbenlv',
      api_key: '999284541119412',
      api_secret: process.env.CLOUDINARY_SECRET
    });

  } else {
    console.error('Need to specify cloudinary secret by export CLOUDINARY_SECRET="some_secret" .');
    process.exit();
  }
// Dev Account
// cloudinary.config({
//   cloud_name: 'xinbenlv-dev',
//   api_key: '864183515878769',
//   api_secret: process.env.CLOUDINARY_SECRET
// });
  // let nextCursor = 0;
  let responses = null;
  do {
    responses = await listImages(responses ? responses.next_cursor : null);
    console.log(`Handling next_cursor = ${responses.next_cursor}`);
    let filtered = responses.resources.filter(item => item.bytes > 500000);
    console.log(`Number of filtered = ${filtered.length}`);
    console.log(JSON.stringify(responses.next_cursor, null,'\t'));
    let unfinished = (await resizeAll(filtered)).filter(ret => ret != null);
    console.log(`Unfinished =${JSON.stringify(unfinished)}`);
  }
  while(responses.next_cursor);
  console.log(`XXX all done!`);
  let usage = await showUsage();
  console.log(`Usage = ${JSON.stringify(usage, null, '  ')}`);
};

let listImages = async function(nextCursor = null) {
    let option = { type: 'upload', max_results: 500,
      next_cursor: nextCursor
    };
    if (nextCursor) option.next_cursor = nextCursor;
    return new Promise(resolve => {
      cloudinary.api.resources(function(result){
        resolve(result);
      }, option);
    });

};
let resizeAll = async function(listOfImages) {
  return Promise.all(listOfImages.map(async oldItem => {
    let id = oldItem.public_id;
    console.log(`Now overriding image ${id}, with original size ${oldItem.bytes}...`);
    let promise = new Promise((resolve,reject) => {
      cloudinary.v2.uploader.upload(
          `http://res.cloudinary.com/xinbenlv/image/upload/c_limit,w_1080/v1494131773/${id}.jpg`,
          {
            public_id:id,
            overwrite:true, transformation: [
            {quality:`auto:eco`, crop:`limit`, width: `1080`, height: `5000`}
          ]},
          (err, result) => {
            if (err) {
              console.log(`XXXX 1 err = ${JSON.stringify(err, null, ' ')}`);
              resolve(err);
            } else {
              // console.log(`XXXX 1 result = ${JSON.stringify(result, null, ' ')}`);
              resolve(result);
            }
          });
    });
    let newItem = await promise;
    if (newItem['public_id']) {
      let newUrl = `http://res.cloudinary.com/xinbenlv/image/upload/v1494131773/${newItem['public_id']}.jpg`;
      let oldSize = oldItem['bytes'];
      let newSize = newItem['bytes'];
      console.log(`
oldId=${oldItem['public_id']}, newId=${newItem['public_id']}, 
oldSize=${oldSize}, newSize=${newSize}, downsize = ${(oldSize-newSize)/oldSize * 100}%
Visit url ${newUrl}`);
      return oldSize == newSize ? oldItem['public_id'] : null;
    } else {
      // skipping
      return oldItem['public_id'];
    }
  }));
};

let showUsage = async function() {
  return new Promise((resolve) => {
    cloudinary.api.usage((result) => {
resolve(result);
    });
  });
};

main();
