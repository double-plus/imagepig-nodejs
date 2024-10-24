const ImagePig = require('./index');
const fs = require('fs');

void async function() {
    const path = 'output';
    fs.mkdir(path, {recursive: true}, (err) => {
        if (err) {
            throw err;
        }
    });

    const imagepig = ImagePig(process.env.IMAGEPIG_API_KEY),
        jane = 'https://imagepig.com/static/jane.jpeg',
        monaLisa = 'https://imagepig.com/static/mona_lisa.jpeg';

    let result;

    result = await imagepig.default('pig')
    await result.save(path + '/pig1.jpeg');

    result = await imagepig.xl('pig')
    await result.save(path + '/pig2.jpeg');

    result = await imagepig.flux('pig')
    await result.save(path + '/pig3.jpeg');

    result = await imagepig.faceswap(jane, monaLisa)
    await result.save(path + '/faceswap.jpeg');

    result = await imagepig.upscale(jane)
    await result.save(path + '/upscale.jpeg');

    result = await imagepig.cutout(jane)
    await result.save(path + '/cutout.png');

    result = await imagepig.replace(jane, 'woman', 'robot')
    await result.save(path + '/replace.jpeg');
}();
