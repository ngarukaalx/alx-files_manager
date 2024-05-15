import mongodb from 'mongodb';

class DBClient {
	constructor() {
		const host = process.env.DB_HOST || '127.0.0.1';
		const port = process.env.DB_PORT || 27017;
		const database = process.env.DB_DATABASE || 'files_manager';
		
		// connection url
		const url = `mongodb://${host}:${port}`;
		this.client = new mongodb.MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
		this.client.connect().then(() => {
			this.db = this.client.db(`${database}`);
		}).catch((err) => {
			console.log(err);
		});
	}

	// a function isAlive that returns true when the connection
	// to MongoDB is a success otherwise, false
	isAlive() {
		return this.client.isConnected();
	}

	// an asynchronous function nbUsers that returns the number
	// of documents in the collection users
	async nbUsers() {
		try {
			const usersCount = await this.db.collection('users').countDocuments();
		        return usersCount;
		} catch (error) {
			console.log('Error count users: ', error.message);
		}
	}
	// an asynchronous function nbFiles that returns the number of
	// documents in the collection files
	async nbFiles() {
		try {
			const filesCount = await this.db.collection('files').countDocuments();
		        return filesCount;
		} catch (error) {
			console.log('Error count files: ', error.message);
		}
	}
	// a fuction to create a user
	async newUser(email, password) {
		try {
			// construct a query
			const user = {
				email: email,
				password: password
			};

			const result = await this.db.collection('users').insertOne(user);
			// return the id of the inserted user
			return result.insertedId;
		} catch (error) {
			console.log('Error creating user: ', error.message);
			return null;
		}
	}

	// function to create a newfile
	async newfile(data) {
		try {
			const result = await this.db.collection('files').insertOne(data);
			const insertedFile = result.ops[0];
			return insertedFile;
		} catch (error) {
			console.log('Error creating file: ', error.message);
			return null;
		}
	}

	// fuction to find a folder by parent id
	async parentid(parentId) {
		try {
			// construct a query
			const query = {
				_id: parentId
			};
			const result = await this.db.collection('files').findOne(query);
			return result;
		} catch (error) {
			console.log('Error fetching file: ', error.message);
			return null;
		}
	}

	// add a new field
	async addnewfield(folderid, fieldname, value) {
		try {
			const query = {
				_id: folderid
			};

			const update = {
				$set: { [fieldname]: value}
			};

			const result = await this.db.collection('files').updateOne(query, update);
			return result;
		} catch (error) {
			console.log('Error in update: ', error.message);
			return null;
		}
	}

	// update a field
	async publishUpublish(fileid, value) {
		try {
			const query = {
				_id: fileid
			};

			const update = {
				$set: { ['isPublic']: value }
			};
			// to return the modified
			const options = {
				returnOriginal: false
			};

			const result =  await this.db.collection('files').findOneAndUpdate(query, update, options);
			return result.value;
		} catch (error) {
			console.error('Error in update: ', error.message);
			return null;
		}
	}

	// find files by parent id return by limit(pagination)
	async parentidPagination(parentid, userid, page, limit) {
		try {
			// calculete skip
			const skip = page * limit;

			// construct query
			const query = {
				$and: [
					{ parentId: parentid },
					{ userId: userid }
				]
			};
			
			// find files matching query
			const files = await this.db.collection('files').find(query).skip(skip).limit(limit).toArray();
			return files;
		} catch (error) {
			console.error('Error seraching: ', error.message);
			return [];
		}

	}

	// fuction to find a user by email
	async findUser(email) {
		try {
			// construct a query
			const query = {
				email: email
			};
			const result = await this.db.collection('users').findOne(query);
			return result;
		} catch (error) {
			console.log('Error finding user: ', error.message);
			return null;
		}

	}

	// fuction to find user by email and pass
	async finduserEp(email, pass) {
		try {
			// construct a query
			const query = {
				email: email,
				password: pass
			};
			const result = await this.db.collection('users').findOne(query);
			return result;
		} catch (error) {
			console.log('Error finding user: ', error.message);
			return null;
		}
	}

	// fuction to find a user by id
	async userByid(id) {
		try {
			// construct a query
			const query = {
				_id: id
			};
			const result = await this.db.collection('users').findOne(query);
			return result
		} catch (error) {
			console.log('Error finding user: ', error.message);
			return null;
		}
	}
};

// create and export an instance of DBClient called dbClient
const dbClient = new DBClient();
module.exports = dbClient;
