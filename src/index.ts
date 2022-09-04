import express from "express"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()
import "express-async-errors" 

import router from "./routers/indexRouter"

import {connection} from "../src/database/postgres"
import errorHandleMiddleware from "./middlewares/errorHandleMiddleware"



const app = express()


app.use(cors())
app.use(express.json())

app.use(router)
app.use(errorHandleMiddleware)

const PORT: number = Number(process.env.PORT) || 5000 

app.listen(PORT, ()=>{
    console.log("Servidor rodando na porta: "+PORT)
})