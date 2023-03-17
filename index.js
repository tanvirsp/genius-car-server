const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fb1wzfq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return  res.status(401).send({message: "Unauthorized Access"});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(401).send({message:  "Unauthorized Access"})
    }
    req.decoded = decoded;
    next();
  });
}

async function run(){
  try{
    const serviceCollection = client.db('geniusCar').collection('services');
    const orderCollection = client.db('geniusCar').collection('orders');

    
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({token});
    })

   
    app.get("/services", async (req, res)=>{
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);

    })

    app.get("/service/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const service = await serviceCollection.findOne(query);
      res.send(service);

    })

    //orders api
    app.post('/order', verifyJWT, async(req, res)=>{
      const data = req.body;
      
      const result = await orderCollection.insertOne(data);
      res.send(result);
      
    })

    app.get("/orders", verifyJWT, async(req, res)=>{
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        res.status(403).send("Unauthorized Access");
      }
      
      let query = {}
      if(req.query.email){
        query = {
          email: req.query.email
        }
      }

      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);

    })



  }
  finally{

  }
}

run().catch(console.dir);



app.get("/", (req, res)=>{
    res.send("Server Running");
})


app.listen(port, ()=>{
    console.log(`Genius Car Server is running on Port ${port}`);
})
