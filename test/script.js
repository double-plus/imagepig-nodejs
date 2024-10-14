const ImagePig = require('imagepig');

void async function() {
    const imagepig = ImagePig(process.env.IMAGEPIG_API_KEY);
    const result = await imagepig.flux('fluffy pig', 'square')
    await result.save('pig.jpeg');
}();
