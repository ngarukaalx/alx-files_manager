import Queue from 'bull';
import dbClient from './utils/db';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';

const thumnailQue = new Queue('thumnailQue');

thumnailQue.process(async (job) => {
	const { fileId, userId } = job.data;

	if(!fileId) {
		throw new Error('Missing fileId');
	}
	if(!userId) {
		throw new Error('Missing userId');
	}

	// get the file in db
	const fileInDb  = await dbClient.parentid(fileId);
	if(!fileInDb || fileInDb.userId !== userId) {
		throw new Error('File not found');
	}

	// create a thumbnails
	const options5 = { width: 500 };
	const options2 = { width: 250 };
	const option1 = { width: 100 };
	const path = fileInDb.localPath;
	const parts = path.split('/');
	const filename = parts[parts.length - 1];
	const origianlPath = '/tmp/files_manager/';

	const optionsArray = [options5, options2, option1];

	for (const opt of optionsArray) {
		try {
			const newName = filename + '_' + opt.width;
			const thumbnail = await imageThumbnail(path, opt);
			// save file with extension of width
			await fs.writeFile(origianlPath + newName, thumbnail, (err) => {
				if(err) {
					console.error('Error saving thumbnail');
				} else {
					console.log('Thumbnail save successfully');
				}
			});
		} catch (err) {
			console.error(err.messge);
		}
	};


});

export async function createThumbnail(fileId, userId) {
	await thumnailQue.add({ fileId, userId });
	console.log(`Job added to queue for user: ${userId}, file: ${fileId}`);
};
