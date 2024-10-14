function APIResponse(content) {
    const DOWNLOAD_ATTEMPTS = 10,
        DOWNLOAD_INTERRUPTION = 1;

    return {
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
                            throw new Error(`Unexpected response when downloading, got HTTP code ${string}`);
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

function ImagePig(apiKey, apiUrl='https://api.imagepig.com') {
    const proportions = ['landscape', 'portrait', 'square', 'wide'];
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

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return APIResponse(await response.json());
        },
        checkURL(string) {
            const url = new URL(string);

            if (!['http', 'https'].includes(url.protocol) || !url.hostname) {
                throw new Error(`Invalid URL: ${string}`);
            }
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
                throw new Error(`Unknown proportion value: ${proportion}`);
            }

            args.proportion = proportion;
            return await this.apiCall('flux', args);
        },
        async faceswap(source_image_url, target_image_url, args={}) {
            this.checkURL(source_image_url);
            this.checkURL(target_image_url);
            args.source_image_url = source_image_url;
            args.target_image_url = target_image_url;
            return await this.apiCall('faceswap', args);
        }
    };
}

module.exports = ImagePig;
