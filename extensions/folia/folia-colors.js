/* Folia color palette extraction; AGPL-3.0. Corresponding sources: upstream-features. */
(()=>{
// src/utils/colorPalette.ts
// Builds a population-weighted palette for consumers that need representative cover colors.

                         
              
              
              
                   
 

                       
                            
                   
 

const QUANTIZATION_SHIFT = 4;
const MIN_ALPHA = 128;

const getChannelRange = (colors                 , channel                 ) => {
    let min = 255;
    let max = 0;
    for (const color of colors) {
        min = Math.min(min, color[channel]);
        max = Math.max(max, color[channel]);
    }
    return max - min;
};

const splitBucket = (bucket             )                                    => {
    if (bucket.colors.length < 2) return null;

    const ranges = {
        r: getChannelRange(bucket.colors, 'r'),
        g: getChannelRange(bucket.colors, 'g'),
        b: getChannelRange(bucket.colors, 'b'),
    };
    const channel = (Object.keys(ranges)                              )
        .reduce((widest, candidate) => ranges[candidate] > ranges[widest] ? candidate : widest, 'r');
    const sorted = [...bucket.colors].sort((a, b) => a[channel] - b[channel]);
    const midpoint = bucket.weight / 2;
    let accumulatedWeight = 0;
    let splitIndex = 1;

    for (let index = 0; index < sorted.length - 1; index += 1) {
        accumulatedWeight += sorted[index].weight;
        splitIndex = index + 1;
        if (accumulatedWeight >= midpoint) break;
    }

    const left = sorted.slice(0, splitIndex);
    const right = sorted.slice(splitIndex);
    return [
        { colors: left, weight: left.reduce((sum, color) => sum + color.weight, 0) },
        { colors: right, weight: right.reduce((sum, color) => sum + color.weight, 0) },
    ];
};

const averageBucket = (bucket             )                => {
    const totals = bucket.colors.reduce((result, color) => ({
        r: result.r + color.r * color.weight,
        g: result.g + color.g * color.weight,
        b: result.b + color.b * color.weight,
    }), { r: 0, g: 0, b: 0 });
    return {
        r: Math.round(totals.r / bucket.weight),
        g: Math.round(totals.g / bucket.weight),
        b: Math.round(totals.b / bucket.weight),
        weight: bucket.weight,
    };
};

const toHex = ({ r, g, b }               ) => (
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
);

// Uses weighted median-cut so large cover regions matter more than small, highly saturated details.
const extractRepresentativeColorsFromPixels = (
    pixels                   ,
    count         = 5,
)           => {
    if (count <= 0) return [];

    const histogram = new Map                       ();
    for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] < MIN_ALPHA) continue;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const key = ((r >> QUANTIZATION_SHIFT) << 8)
            | ((g >> QUANTIZATION_SHIFT) << 4)
            | (b >> QUANTIZATION_SHIFT);
        const existing = histogram.get(key);
        if (existing) {
            existing.r += r;
            existing.g += g;
            existing.b += b;
            existing.weight += 1;
        } else {
            histogram.set(key, { r, g, b, weight: 1 });
        }
    }

    const colors = [...histogram.values()].map(color => ({
        r: Math.round(color.r / color.weight),
        g: Math.round(color.g / color.weight),
        b: Math.round(color.b / color.weight),
        weight: color.weight,
    }));
    if (colors.length === 0) return [];

    const buckets                = [{
        colors,
        weight: colors.reduce((sum, color) => sum + color.weight, 0),
    }];
    while (buckets.length < Math.min(count, colors.length)) {
        let bucketIndex = -1;
        let bestScore = -1;
        for (let index = 0; index < buckets.length; index += 1) {
            const bucket = buckets[index];
            if (bucket.colors.length < 2) continue;
            const widestRange = Math.max(
                getChannelRange(bucket.colors, 'r'),
                getChannelRange(bucket.colors, 'g'),
                getChannelRange(bucket.colors, 'b'),
            );
            const score = widestRange * Math.sqrt(bucket.weight);
            if (score > bestScore) {
                bestScore = score;
                bucketIndex = index;
            }
        }
        if (bucketIndex < 0) break;
        const split = splitBucket(buckets[bucketIndex]);
        if (!split) break;
        buckets.splice(bucketIndex, 1, ...split);
    }

    return buckets
        .map(averageBucket)
        .sort((a, b) => b.weight - a.weight)
        .map(toHex);
};


// src/utils/colorExtractor.ts

               
              
              
              
 

/**
 * 把图片缩到 50×50 读出像素（crossOrigin 匿名请求）。图片加载失败、没有 CORS 头、画布被污染（读像素抛
 * SecurityError）时都返回 null。silent：失败时不打 warn（墙上一批头像取色时用，失败只是回退）。
 */
const loadImagePixels = (imageUrl        , { silent = false }                       = {})                                    => (
    new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            // Resize for performance
            const width = 50;
            const height = 50;
            canvas.width = width;
            canvas.height = height;

            try {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.getImageData(0, 0, width, height).data);
            } catch (error) {
                // 画布被跨源图片污染时 getImageData 抛错；不吞掉的话这个 Promise 永远不 resolve。
                if (!silent) console.warn("Failed to read image pixels for color extraction", error);
                resolve(null);
            }
        };

        img.onerror = (e) => {
            if (!silent) console.warn("Failed to load image for color extraction", e);
            resolve(null);
        };
        img.src = imageUrl;
    })
);

const extractVibrantColorsFromPixels = (imageData                   , count        )           => {
    const colors        = [];

    // Improved sampling: step = 2 instead of 5 for better coverage
    const step = 2;
    for (let i = 0; i < imageData.length; i += 4 * step) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue; // Skip transparent

        // Calculate saturation and brightness
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));

        // Prefer colors with some saturation (avoid pure grays)
        // and exclude very dark or very bright colors
        if (saturation > 0.2 && l > 30 && l < 220) {
            colors.push({ r, g, b });
        } else if (colors.length < 100) {
            // Still collect some low-saturation colors as fallback
            colors.push({ r, g, b });
        }
    }

    // Sort by saturation (vibrant colors first)
    colors.sort((a, b) => {
        const satA = (Math.max(a.r, a.g, a.b) - Math.min(a.r, a.g, a.b)) / 255;
        const satB = (Math.max(b.r, b.g, b.b) - Math.min(b.r, b.g, b.b)) / 255;
        return satB - satA;
    });

    // Extract distinct colors with lower distance threshold
    const distinctColors        = [];
    const minDistance = 20; // Reduced from 30 for more variety

    for (const c of colors) {
        if (distinctColors.length >= count) break;

        const isDistinct = distinctColors.every(dc => {
            const d = Math.sqrt(
                Math.pow(c.r - dc.r, 2)
                + Math.pow(c.g - dc.g, 2)
                + Math.pow(c.b - dc.b, 2)
            );
            return d > minDistance;
        });

        if (isDistinct || distinctColors.length === 0) {
            distinctColors.push(c);
        }
    }

    return distinctColors.map(c => {
        const hexR = c.r.toString(16).padStart(2, '0');
        const hexG = c.g.toString(16).padStart(2, '0');
        const hexB = c.b.toString(16).padStart(2, '0');
        return `#${hexR}${hexG}${hexB}`;
    });
};

const extractColors = async (imageUrl        , count         = 5)                    => {
    const pixels = await loadImagePixels(imageUrl);
    return pixels ? extractVibrantColorsFromPixels(pixels, count) : [];
};

const extractRepresentativeColors = async (
    imageUrl        ,
    count         = 5,
)                    => {
    const pixels = await loadImagePixels(imageUrl);
    return pixels ? extractRepresentativeColorsFromPixels(pixels, count) : [];
};


window.FoliaColors={extractColors,extractRepresentativeColors};
})();
