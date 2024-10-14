# imagepig-javascript
A [npm library](https://www.npmjs.com/package/imagepig) for [Image Pig](https://imagepig.com/), the API for AI images.

## Installation

```
npm i imagepig
```

## Example of usage

```javascript
const ImagePig = require('imagepig');

void async function() {
    // create instance of API (put here your actual API key)
    const imagepig = ImagePig('your-api-key');

    // call the API with a prompt to generate an image
    const result = await imagepig.xl('cute piglet running on a green garden')

    // save image to a file
    await result.save('cute-piglet.jpeg');

    // or access image data (bytes)
    await result.data;
}();

```
