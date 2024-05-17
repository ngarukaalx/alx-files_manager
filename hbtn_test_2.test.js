import chai from 'chai';
import chaiHttp from 'chai-http';

import MongoClient from 'mongodb';

chai.use(chaiHttp);

describe('GET /users', () => {
    let testClientDb = null;

    const fctRandomString = () => {
        return Math.random().toString(36).substring(2, 15);
    }

    beforeEach(() => {
        const dbInfo = {
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || '27017',
            database: process.env.DB_DATABASE || 'files_manager'
        };
        return new Promise((resolve) => {
            MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`, async (err, client) => {
                testClientDb = client.db(dbInfo.database);
            
                await testClientDb.collection('users').deleteMany({})

                resolve();
            }); 
        });
    });
        
    afterEach(() => {
    });

    it('GET /users with missing password', (done) => {
        const userParam = { 
            email: `${fctRandomString()}@me.com` 
        }
        chai.request('http://0.0.0.0:5000')
            .post('/users')
            .send(userParam)
            .end((err, res) => {
		    console.log(err);
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(400);
		    console.log(res.status);
                const resError = res.body.error;
		    console.log('this the body: ', res.body);
		    console.log(resError);
                chai.expect(resError).to.equal("Missing password");
                
                testClientDb.collection('users')
                    .find({})
                    .toArray((err, docs) => {
                        chai.expect(err).to.be.null;
                        chai.expect(docs.length).to.equal(0);
                        done();
                    })
            });
    }).timeout(90000);
});
