import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
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


app.post("/participants", async (req, res) => {
    const { name } = req.body
    if (!name) { //validação do nome
        return res.status(422).send("O nome deve ser preenchido")
    }
    const newOne = { name: name, lastStatus: Date.now() }
    try {
        const participant = await db.collection("participants").findOne({ name: name }) //validação de nome
        if (participant) return res.status(409).send("Esse nome já está em uso")
        await db.collection("participants").insertOne(newOne)
        return res.sendStatus(201)
    } catch (err) { res.status(500).send(err.message) }
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
    const { to, text, type } = req.body
    const newMessage = { to, text, type }
    try {
        await db.collection("messages").insertOne(newMessage)
        res.status(201).send("Mensagem enviada!")
    }
    catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/messages", async (req, res) => {
    try {
        const messages = await db.collection("messages").find().toArray()
        res.status(200).send(messages)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
})


app.post("/status", (req, res) => {

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




//Deixar o app escutante
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))