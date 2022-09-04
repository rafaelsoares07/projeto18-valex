import { Request, Response} from "express";
import {find, insert} from "../repositories/cardRepository"
import {findById} from "../repositories/businessRepository"
import createCardSchema from "../schemas/createCardSchema";


import * as cardService from "../services/cardService"


export async function get(req:Request , res:Response) {
    const result = await findById(2)
    console.log(result)
    res.status(200).send(result)
}

export async function create (req:Request, res:Response) {

    const createCardData = req.body
    const {employeeId, type} = createCardData

    const validation = createCardSchema.validate(req.body)
    if(validation.error){
        return res.status(422).send('erro no body')
    }

    const apiKey = req.headers["x-api-key"] as string; // Usando o as -> 'O valor que esta vindo, é uma string' 
    
    if(!apiKey) return res.status(401).send('usuario nao autorizado')


    await cardService.create(apiKey, employeeId, type) 

    res.status(201).send('Deu certo tudo ')
}