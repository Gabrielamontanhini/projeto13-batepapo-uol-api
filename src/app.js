import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"



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

app.post("/participants", async (req, res) => {

    const nameSchema = joi.object({
        name: joi.string().required()
    })

    const valid = nameSchema.validate(req.body, {abortEarly: false})
    if (valid.error) {
        const errors = valid.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }

    const { name } = req.body
    const now = dayjs().format("HH:mm:ss")
    const newOne = { name, lastStatus: Date.now() }
    const newParticipant = {
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().format("HH:mm:ss")
    }
    try {
        const participant = await db.collection("participants").findOne({ name })
        if (participant) return res.status(409).send("Esse nome já está em uso")
        await db.collection("participants").insertOne(newOne)
        await db.collection("messages").insertOne(newParticipant)
        return res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})


app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray()
        res.status(200).send(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }
})



app.post("/messages", async (req, res) => {
    const { user } = req.headers
    const { to, text, type } = req.body
    const newMessage =
    {
        from: user,
        to,
        text,
        type, 
        time: dayjs().format("HH:mm:ss")
    }
    const userSchema = joi.object({
        from: joi.string().required(),
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private_message").required(), 
        time: joi.required()
    })
    const validation = userSchema.validate(newMessage, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {

    const online = await db.collection("participants").findOne({name: user})
    if (!online) return res.sendStatus(422)
        await db.collection("messages").insertOne(newMessage)
        res.status(201).send("Mensagem enviada!")
    }
    catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/messages", async (req, res) => {
    const user  = req.headers.user
    const {limit} = req.query

    try {
        const messages = await db.collection("messages").find({$or:[{from: user}, {to: 'Todos'}, {to: user}]}).toArray()

        if (!limit){
            return res.status(200).send(messages)
        }else if ({limit}){
            const limitQuery = {limit: Number(limit)}
            const limitSchema = joi.object({ 
            limit: joi.number().integer().positive() 
        })
        const limited = limitSchema.validate(limitQuery, {abortEarly: false})
        if (limited.error){
        return res.status(422).send(!limit)
        }
        res.status(200).send(messages.slice(-limit))
    } 
    }
    catch (err) {
        res.status(500).send(err.message)
    }
})



app.post("/status", async (req, res) => {
    const  user  = req.headers
    if (!user) {
        return res.sendStatus(404)
    }
    try {
    const status = await db.collection("participants").findOne(user)
    if (!status) return res.sendStatus(404)
    await db.collection("participants").updateOne({name: user}, {$set: {name: user, lastStatus: Date.now()}})
    res.sendStatus(200)
    }
    catch (err) { 
    }
}) //post status




app.delete("/participants/:id", async (req, res) => { //deletar PARTICIPANTES
    const { id } = req.params

    try {
        const result = await db.collection("participants").deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) return res.status(404).send("Esse item não existe!")
        res.send("Item deletado com sucesso!")

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.delete("/messages/:id", async (req, res) => { //deletar MENSAGENS
    const { id } = req.params

    try {
        const result = await db.collection("messages").deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) return res.status(404).send("Esse item não existe!")
        res.send("Item deletado com sucesso!")

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.delete("/messages/many/:filtro", async (req, res) => {

    const { filtro } = req.params

    try{
        const result = await db.collection("messages").deleteMany({type: filtro})
        if (result.deletedCount === 0) return res.status(404).send("Não encontrado")
res.send("Mensagens deletadas com sucesso!")
    } catch (err){
        res.status(500).send(err.message)
    }
})


//Limpeza do banco

setInterval( async () =>{
let timesUp = Date.now() - 1000000
try{
    const inactive = await db.collection("participants").find({lastStatus: {$lt: timesUp}}).toArray()
    console.log(inactive)
    for (let i=0; i<inactive.length; i++){
    await db.collection("messages").insertOne({
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        from: inactive[i].name,
        time: dayjs().format("HH:mm:ss")
    })
    await db.collection("participants").deleteOne({name: inactive[i].name})}

}
catch(err){

}
} , 150000)







//Deixar o app escutante
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))