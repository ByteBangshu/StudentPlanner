const {MongoClient} = require('mongodb');
const uri = process.env.MONGO_API;
let monServer;

async function connectMongo()
{
    if(!monServer)
    {
        monServer = new MongoClient(uri);
        await monServer.connect();
    }
    return monServer;
}

exports.createUser = async (req, res) => {
    const {username, password} = req.body;
    console.log(username);
    try{
        const client = await connectMongo();
        const userDataBase = await client.db('AuthDetails').collection('users');
        if(!username||!password)
        {
            console.log("No Data Found");
        }
        else
        {
            await userDataBase.insertOne({username, password});
        }
        console.log("Hello Wolrd");
        res.status(200).send("User created successfully");
    }
    catch(err)
    {
        console.error(err);
        res.status(500).send("Sign Up Error");
    }
}