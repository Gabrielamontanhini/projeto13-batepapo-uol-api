import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"

//Criação do servidor
const app = express()

//Configurações
app.use(express.json())
app.use(cors())
dotenv.config()

//Conexão com o Banco de Dados
const mongoClient = new MongoClient(process.env.DATABASE_URL); //dotenv
try {
    await mongoClient.connect()
    console.log("MongoDB conectado!")
} catch (err) {
    console.log(err.message)
}
const db = mongoClient.db()



//Endpoints

app.post("/participants", async(req, res)=> {  
    const { name } = req.body
    const newOne = { name: name}
    try {
    await db.collection("participants").insertOne(newOne)
        return res.status(201)
    } catch (err){ res.status(500).send(err.message) }
    })

app.get("/participants", async(req, res)=>{   
    try {
        await db.collection("participants").find().toArray()
        res.status(200).send(participants)
    } catch (err){
        res.status(500).send(err.message)
    }
}) 



app.post("/messages", async(req, res)=>{
    const { to, text, type } =  req.body
    const newMessage = { to, text, type }
    try {
        await db.collection("messages").insertOne(newMessage)
        res.status(201).send("Mensagem enviada!")
    }
    catch (err){
        res.status(500).send(err.message)
    }
})

app.get("/messages", async(req, res)=>{
    try{
        await db.collection("messages").find().toArray()
        res.status(200).send(messages)
    }
    catch(err){
        res.status(500).send(err.message)
    }
})


app.post("/status", (req, res)=>{

}) //post status



//Deixar o app escutante
const PORT = 5005
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))