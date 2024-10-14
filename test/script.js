const ImagePig = require('imagepig');

void async function() {
    const imagepig = ImagePig(process.env.IMAGEPIG_API_KEY);
    const result = await imagepig.flux('fluffy pig', 'square', {storage_days: 1})
    await result.save('pig.jpeg');
}();
