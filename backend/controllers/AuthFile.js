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
    const {email, password} = req.body;
    console.log("SIGN UP REQUEST RECEIVED");
    try{
        const client = await connectMongo();
        const userDataBase = await client.db('AuthDetails').collection('users');
        if(!email||!password)
        {
            //console.log("No Data Found");
        }
        else
        {
            await userDataBase.insertOne({email, password});
        }
        res.status(200).send("User created successfully");
    }
    catch(err)
    {
        console.error(err);
        res.status(500).send("Sign Up Error");
    }
}

exports.loginUser = async (req, res) => {
    const {email, password} = req.body;
    try{
        const client = await connectMongo();
        const userDataBase = await client.db('AuthDetails').collection('users');
        const user = await userDataBase.findOne({email, password});
        
        if(user)
        {
            req.session.user = user;
        }
        else
        {
            res.status(401).send("Invalid Credentials");
        }
    }
    catch(err)
    {
        //console.error(err);
        res.status(500).send("Login Error");
    }
}