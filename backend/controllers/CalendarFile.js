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

//Get Calendar Data
exports.getCalendar = async (req, res) => {
    const {year,month,day} = req.query;
    try{
        const client = await connectMongo();
        const userDataBase = await client.db('CalendarEvents').collection('DailyTasks');
        const specficTask = await userDataBase.findOne({year:year, month:month, day:day});
        if(specificTask)
        {
            res.status(200).json(specficTask);
        }
        else
        {
            res.status(404).send("No Data Found");
        }
    }
    catch(err)
    {
        res.status(500).send("Error in fetching schedule data");
    }
}

//Set Calendar Data
exports.setCalendar = async(req,res) => {
    const {year,month,day,task} = req.body;
    try{
        const client = await connectMongo();
        const userDataBase = await client.db('CalendarEvents').collection('DailyTasks');
        const updateResult = await userDataBase.updateOne(
            {year:year, month:month, day:day},
            {$set: {task:task}},
            {upsert: true}
        );
        console.log(year,month,day,task);
    }
    
    catch(err)
    {
        console.error(err);
        res.status(500).send("Error in setting schedule data");
    }
}

