const { Buffer } = require('node:buffer');

class ImagePigError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

function APIResponse(content) {
    const DOWNLOAD_ATTEMPTS = 10,
        DOWNLOAD_INTERRUPTION = 1;

    return {
        get content() {
            return content;
        },
        get data() {
            if (content.image_data) {
                return Promise.resolve(Buffer.from(content.image_data, 'base64'));
            }

            if (content.image_url) {
                return (async () => {
                    for (let i = 0; i < DOWNLOAD_ATTEMPTS; i++) {
                        response = await fetch(content.image_url, {headers: {'User-Agent': 'Mozilla/5.0'}});

                        if (response.ok) {
                            return Buffer.from(await response.arrayBuffer());
                        }

                        if (response.status === 404) {
                            await new Promise(resolve => setTimeout(resolve, DOWNLOAD_INTERRUPTION * 1000));
                        } else {
                            throw new ImagePigError(`Unexpected response when downloading, got HTTP code ${string}.`);
                        }
                    }
                })();
            }

            return Promise.resolve(null);
        },
        get url() {
            return content.image_url || null;
        },
        get seed() {
            return content.seed || null;
        },
        get mimeType() {
            return content.mime_type || null;
        },
        get duration() {
            if (content.started_at && content.completed_at) {
                return (new Date(content.completed_at) - new Date(content.started_at)) / 1000;
            }

            return null;
        },
        async save(path) {
            const fs = require('node:fs');

            fs.writeFile(path, await this.data, (error) => {
                if (error) {
                    throw error;
                }
            });
        }
    };
}

function ImagePig(apiKey, raiseException = true, apiUrl='https://api.imagepig.com') {
    const proportions = ['landscape', 'portrait', 'square', 'wide'],
        upscaling_factors = [2, 4, 8];

    return {
        async apiCall(endpoint, payload) {
            response = await fetch(`${apiUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': apiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok && raiseException) {
                throw new ImagePigError(`Response status: ${response.status}`);
            }

            return APIResponse(
                JSON.parse(
                    await response.text(),
                    (key, value, context) => context && key === 'seed' ? BigInt(context.source) : value
                )
            );
        },
        async default(prompt, negative_prompt='', args={}) {
            args.positive_prompt = prompt;
            args.negative_prompt = negative_prompt;
            return await this.apiCall('', args);
        },
        async xl(prompt, negative_prompt='', args={}) {
            args.positive_prompt = prompt;
            args.negative_prompt = negative_prompt;
            return await this.apiCall('xl', args);
        },
        async flux(prompt, proportion='landscape', args={}) {
            args.positive_prompt = prompt;

            if (!proportions.includes(proportion)) {
                throw new ImagePigError(`Unknown proportion value: ${proportion}.`);
            }

            args.proportion = proportion;
            return await this.apiCall('flux', args);
        },
        prepareImage(image, paramName, params) {
            if (typeof image === 'string') {
                const url = new URL(image);

                if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
                    throw new ImagePigError(`Invalid URL: ${image}`);
                }

                params[paramName + '_url'] = image;
            } else if (Buffer.isBuffer(image)) {
                params[paramName + '_data'] = image.toString('base64');
            } else {
                throw new ImagePigError(`Please provide string or Buffer for ${paramName}.`);
            }

            return params;
        },
        async faceswap(source_image, target_image, args={}) {
            args = this.prepareImage(source_image, 'source_image', args);
            args = this.prepareImage(target_image, 'target_image', args);
            return await this.apiCall('faceswap', args);
        },
        async upscale(image, upscaling_factor=2, args={}) {
            args = this.prepareImage(image, 'image', args);

            if (!upscaling_factors.includes(upscaling_factor)) {
                throw new ImagePigError(`Unknown upscaling factor value: ${upscaling_factor}.`);
            }

            args.upscaling_factor = upscaling_factor;
            return await this.apiCall('upscale', args);
        },
        async cutout(image, args={}) {
            args = this.prepareImage(image, 'image', args);
            return await this.apiCall('cutout', args);
        },
        async replace(image, select_prompt, positive_prompt, negative_prompt='', args={}) {
            args = this.prepareImage(image, 'image', args);
            args.select_prompt = select_prompt;
            args.positive_prompt = positive_prompt;
            args.negative_prompt = negative_prompt;
            return await this.apiCall('replace', args);
        },
        async outpaint(image, positive_prompt, top=0, right=0, bottom=0, left=0, negative_prompt='', args={}) {
            args = this.prepareImage(image, 'image', args);
            args.positive_prompt = positive_prompt;
            args.negative_prompt = negative_prompt;
            args.top = top;
            args.right = right;
            args.bottom = bottom;
            args.left = left;
            return await this.apiCall('outpaint', args);
        }
    };
}

module.exports = ImagePig;
