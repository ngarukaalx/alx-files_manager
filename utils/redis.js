import redis from 'redis';
import util from 'util';

// class redisclient
class RedisClient {
	constructor() {
		this.client = redis.createClient();
		this.client.on('error', (err) => {
			console.log('Error: ', err.message);
		});
	}

	// returns true when the connection to Redis
	// is a success otherwise, false
	isAlive() {
		return this.client.connected;
	}

	// an asynchronous function get that takes a string
	// key as argument and returns the Redis value stored
	// for this key
	async get(key) {
		const promisify = util.promisify;
		const getAsync = promisify(this.client.get).bind(this.client);

	        try {
			const value = await getAsync(key);
		        return value;
	        } catch (err) {
		        return err.message;
		}
	}

	// an asynchronous function set that takes a string key, a value
	// and a duration in second as arguments to store it in Redis
	// (with an expiration set by the duration argument)
	async set(key, value, duration) {
		// promisify Redis client methods
		const promisify = util.promisify;
		const setAsync = promisify(this.client.set).bind(this.client);
		const expireAsync = promisify(this.client.expire).bind(this.client);

		try {
			// set the key with the value
			await setAsync(key, value);
			// set the expiration time in seconds
			await expireAsync(key, duration);
		} catch (err) {
			console.log('Error setting', err.message);
		}
	}
	// an asynchronous function del that takes a string key as
	// argument and remove the value in Redis for this key
	async del(key) {
		const promisify = util.promisify;
		const delAsync = promisify(this.client.del).bind(this.client);
		try {
			// delete the value
			await delAsync(key);
		} catch (err) {
			console.log('Error in deletion: ', err.message);
		}
	}
}

// create and export an instance of RedisClient called redisClient
const redisClient = new RedisClient();
module.exports = redisClient;
