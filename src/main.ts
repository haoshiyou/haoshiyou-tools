let main= async function() {
  console.log(`XXX Start!`);
  const cloudinary = require('cloudinary');
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
//   api_secret: '7NzbW-6fmp651h3iBaasOTvB9RI'
// });

  cloudinary.api.resources(async function(result){
    let filtered = result.resources.filter(i => i.bytes>1000*1000);
    console.log(`XXX filtered = ${filtered.length}`);
    await Promise.all(filtered.map(async oldItem => {
      let id = oldItem.public_id;
      console.log(`Now overriding image ${id}, with original size ${oldItem.bytes}...`);
      let promise = new Promise((resolve,reject) => {
        cloudinary.v2.uploader.upload(
            `http://res.cloudinary.com/xinbenlv/image/upload/v1494131773/${id}.png`,
            {
              public_id:id,
              overwrite:true, transformation: [
              {quality:`auto:eco`, crop:`limit`, width: `1080`, height: `3000`}
            ]},

            (err,result) => {
              if (err) reject(err);
              else resolve(result);
            });
      });
      let newItem = await promise;
      let newUrl = `http://res.cloudinary.com/xinbenlv/image/upload/v1494131773/${newItem['public_id']}.jpg`;
      let oldSize = oldItem['bytes'];
      let newSize = newItem['bytes'];
      console.log(`
oldId=${oldItem['public_id']}, newId=${newItem['public_id']}, 
oldSize=${oldSize}, newSize=${newSize}, downsize = ${(oldSize-newSize)/oldSize * 100}%
Visit url ${newUrl}`);
      return result;
    }));
  }, { type: 'upload', max_results: 500});
  cloudinary.api.usage((result,err) => {
    console.log(result);
    console.log(err);
  });

};

main();
