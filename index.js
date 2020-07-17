const fs = require('fs').promises;
const jimp = require('jimp');
const cliProgress = require('cli-progress');

const sizes = [
    {w: 112, h: 112, name: 'eggThumbnail'},
    {w: 224, h: 224, name: 'eggThumbnail@2x'},
    {w: 336, h: 336, name: 'eggThumbnail@3x'},
]
const selectNameRegExp = /[_\s](\w+)-/;
const resultsFolderName = 'results_' + Date.now();
const sourceFolderName = 'source'

async function checkFileExists(file) {
    return fs.access(file, require('fs').constants.F_OK)
        .then(() => true)
        .catch(() => false)
}

async function resizeAndSave(imagePath, destinationPath, size) {
    return new Promise(resolve => {
        jimp.read(imagePath, (_, image) => {
            image
                .resize(size.w, size.h)
                .write(`${destinationPath}/${size.name}.jpg`);

            resolve();
        })
    })
}

async function copyImage(imagePath, destinationPath, newName) {
    return new Promise(resolve => {
        jimp.read(imagePath, (_, img) => {
            console.log(_)
            img.write(destinationPath + `/${newName}.jpg`);
            resolve();
        })
    })
}

async function f(progress) {
    progress.start(100, 0);
    const dirFiles = await fs.readdir(process.cwd() + `/${sourceFolderName}`);
    const listPhotos = dirFiles.filter(f => f.match(/\.jpg$/));

    if (!await checkFileExists(process.cwd() + `/${resultsFolderName}`)) {
        await fs.mkdir(process.cwd() + `/${resultsFolderName}`);
    }

    for (const [i, photoPath] of listPhotos.entries()) {
        const photoName =  photoPath.match(selectNameRegExp)[1];
        const resultPath = process.cwd() + `/${resultsFolderName}/${photoName}`;
        const sourcePath = process.cwd() + `/${sourceFolderName}/${photoPath}`;

        if (!await checkFileExists(resultPath)) {
            await fs.mkdir(resultPath);
        }

        await copyImage(sourcePath, resultPath, 'egg');

        for (size of sizes) {
            await resizeAndSave(sourcePath, resultPath, size);
        }

        progress.update(((i + 1) / listPhotos.length) * 100);
    }

    progress.stop();
    return listPhotos;
}

f(new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic))
    .then((photos) => {
        console.log(`${photos.length} Photos processed and saved to ${process.cwd()}/${resultsFolderName}`);
    });
